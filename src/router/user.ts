import express, {NextFunction, Request, Response} from "express"
import {generateAuthToken, auth} from "../utils/auth"
import {validate} from "class-validator"
import * as bcrypt from "bcryptjs"
import {startConnection} from "../index"
import {getInfo} from "../utils/users";

const router = express.Router()

export function userRouter(io: any) {
    // Index
    router.get('/', async (req: Request, res: Response) => {
        if (req.session.user) {
            return res.redirect('/room')
        }
        res.render('index.ejs')
    })

    // Sign up user api
    router.get('/signup', async (req: Request, res: Response) => {
        if (req.session.user) {
            return res.status(400).send({error: 'Please log out first!'})
        }
        res.render('signup.ejs')
    })

    router.post('/signup', async (req: Request, res: Response) => {
        try {
            const existUser = await startConnection.getRepository('User').findOne({where: {username: req.body.username}})
            if (existUser !== null) {
                return res.status(400).send({error: 'Username has been taken!'})
            }
            const user = startConnection.getRepository('User').create(req.body)
            const errors = await validate(user)
            if (errors.length > 0) {
                let messages = JSON.stringify(errors.map(error => error.constraints))
                return res.status(400).send(messages)
            }
            await startConnection.getRepository('User').save( user)
            res.render('index.ejs', {
                username: req.body.username,
                password: req.body.password,
            })

        } catch (e) {
            res.status(400).send({error: 'Error occur!'})
        }
    })

    // Room api after login
    router.post('/room', async (req: Request, res: Response) => {
        const user = await startConnection.getRepository('User').findOne({
            where: {
                username: req.body.username
            }
        })
        if (user === null) {
            return res.status(404).send({error: 'Invalid username!'})
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if (!isMatch) {
            return res.status(400).send({error: 'Password not match!'})
        }
        const username = req.body.username;
        await startConnection.getRepository('User').save(user)
        req.session.user = username;
        const info = await getInfo()
        res.render('room.ejs', {info})
    })

    // Login via API
    router.post('/api/login', async (req: Request, res: Response) => {
        try {
            if (!req.body.username || !req.body.password) {
                return res.status(400).send({'message': 'Invalid input!'})
            }
            const user = await startConnection.getRepository('User').findOne({
                where: {
                    username: req.body.username
                }
            })
            if (user === null) {
                return res.status(404).send({error: 'User not found!'})
            }
            const isMatch = await bcrypt.compare(req.body.password, user!.password)
            if (!isMatch) {
                return res.status(400).send({error: 'Password not match!'})
            }
            const token = generateAuthToken(user!)
            res.status(200).send({user, token})
        } catch (e) {
            res.status(400).send({error: 'Error occur!'})
        }
    })

    // Delete user(admin)
    router.delete('/admin/users/:id', (req: Request, res: Response, next: NextFunction) => auth(req, res, next), async (req: Request, res: Response) => {
        try {
            if (req.body.user.role !== 'admin') {
                return res.status(403).send({
                    error: 'Unauthorized. Only admin can' +
                        ' delete user!'
                })
            }
            const existUser = await startConnection.getRepository('User').findOne({where: {id: parseInt(req.params.id)}})
            if (existUser === null) {
                return res.status(404).send({error: 'User not found!'})

            }
            await startConnection.getRepository('User').createQueryBuilder().delete().where('id' +
                ' =:id', {id: req.params.id}).execute()
            res.status(200).send({'message': 'Delete user successfully!'})
        } catch (e) {
            res.status(400).send({error: 'Error occur. Cannot delete user!'})
        }
    })
    // Delete room(admin)
    router.delete('/admin/room/:name', (req: Request, res: Response, next: NextFunction) => auth(req, res, next), async (req: Request, res: Response) => {
        try {
            if (req.body.user.role !== 'admin') {
                return res.status(403).send({
                    error: 'Unauthorized. Only admin can' +
                        ' delete room!'
                })
            }
            const existRoom = await startConnection.getRepository('Socket').find( {where: {roomName: req.params.name}})
            if (existRoom.length === 0) {
                return res.status(404).send({error: 'Room not found!'})
            }
            await startConnection.getRepository('Socket').createQueryBuilder().delete().where('roomName' +
                ' =:name', {name: req.params.name}).execute()
            io.to(req.params.name).disconnectSockets()
            res.status(200).send({'message': 'Delete room successfully!'})
        } catch (e) {
            res.status(400).send({error: 'Error occur. Cannot delete room!'})
        }
    })

    // Delete all rooms(admin)
    router.delete('/admin/room', (req: Request, res: Response, next: NextFunction) => auth(req, res, next), async (req: Request, res: Response) => {
        try {
            if (req.body.user.role !== 'admin') {
                return res.status(401).send({
                    error: 'Unauthorized. Only admin can' +
                        ' delete room!'
                })
            }
            //mysql driver doesnt support DISTINCT, use GROUP_BY instead
            const existRoom = await startConnection.getRepository('Socket').createQueryBuilder( 'socket').select(['socket.roomName']).groupBy("socket.roomName").getMany()
            if (existRoom.length === 0) {
                return res.status(404).send({error: 'No room found!'})
            }
            for (const socket of existRoom) {
                await startConnection.getRepository('Socket').createQueryBuilder().delete().where('roomName' +
                    ' =:name', {name: socket.roomName}).execute()
                io.to(socket.roomName).disconnectSockets()
            }
            res.status(200).send({
                'message': 'Delete room' +
                    ' successfully!'
            })
        } catch (e) {
            res.status(400).send({error: 'Error occur. Cannot delete room!'})
        }
    })


    router.get('/room', async (req: Request, res: Response) => {
        if (!req.session.user) {
            return res.status(404).send({error: 'Invalid username!'})
        }
        const info = await getInfo()
        res.render('room.ejs', {info})
    })

    // Chat api
    router.get('/chat', async (req: Request, res: Response) => {
        const room = req.query.room
        res.render('chat.ejs', {room})
    })


    return router
}
