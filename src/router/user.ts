import express, {NextFunction, Request, Response} from "express"

const router = express.Router()
import {generateAuthToken} from "../utils/users"
import {auth} from "../utils/middleware"
import {validate} from "class-validator"
import bcrypt from "bcryptjs"
import {startConnection} from "../index"

export function userRouter(io: any) {
    // Sign up user
    router.post('/signup', async (req: Request, res: Response) => {
        try {
            const existUser = await startConnection.userRepository.findOne({where: {username: req.body.username}})
            if (existUser === null) {
                const user = startConnection.userRepository.create(req.body)
                const errors = await validate(user)
                if (errors.length > 0) {
                    let messages = JSON.stringify(errors.map(error => error.constraints))
                    res.status(400).send(messages)
                } else {
                    await startConnection.userRepository.save(user)
                    res.status(201).redirect('/')
                }

            } else res.status(400).send({error: 'Username has been taken!'})

        } catch (e) {
            res.status(400).send({error: 'Error occur!'})
        }
    })

    // Login via API
    router.post('/login', async (req: Request, res: Response) => {
        try {
            if (!req.body.username || !req.body.password) {
                res.status(400).send({'message': 'Invalid input!'})
            }
            const user = await startConnection.userRepository.findOne({
                where: {
                    username: req.body.username
                }
            })
            console.log(user)
            if (user !== null) {
                const isMatch = await bcrypt.compare(req.body.password, user.password)
                if (isMatch) {
                    const token = generateAuthToken(user)
                    res.status(200).send({user, token})
                } else res.status(400).send({error: 'Password not match!'})
            } else res.status(404).send({error: 'User not found!'})
        } catch (e) {
            res.status(400).send({error: 'Error occur!'})
        }
    })

    // Delete user(admin)
    router.delete('/admin/users/:id', (req: Request, res: Response, next: NextFunction) => auth(req, res, next), async (req: Request, res: Response) => {
        try {
            if (req.body.user.role === 'admin') {

                const existUser = await startConnection.userRepository.findOne({where: {id: parseInt(req.params.id)}})
                if (existUser !== null) {
                    await startConnection.userRepository.createQueryBuilder().delete().where('id' +
                        ' =:id', {id: req.params.id}).execute()

                    res.status(200).send({'message': 'Delete user successfully!'})
                } else res.status(404).send({error: 'User not found!'})
            } else {
                return res.status(403).send({
                    error: 'Unauthorized. Only admin can' +
                        ' delete user!'
                })
            }
        } catch (e) {
            res.status(400).send({error: 'Error occur. Cannot delete user!'})
        }
    })
    // Delete room(admin)
    router.delete('/admin/room/:name', (req: Request, res: Response, next: NextFunction) => auth(req, res, next), async (req: Request, res: Response) => {
        try {
            if (req.body.user.role === 'admin') {
                const existRoom = await startConnection.socketRepository.find({where: {roomName: req.params.name}})
                if (existRoom.length !== 0) {
                    await startConnection.socketRepository.createQueryBuilder().delete().where('roomName' +
                        ' =:name', {name: req.params.name}).execute()
                    io.to(req.params.name).disconnectSockets()
                    res.status(200).send({'message': 'Delete room successfully!'})
                } else res.status(404).send({error: 'Room not found!'})
            } else {
                return res.status(403).send({
                    error: 'Unauthorized. Only admin can' +
                        ' delete room!'
                })
            }
        } catch (e) {
            res.status(400).send({error: 'Error occur. Cannot delete room!'})
        }
    })

    // Delete all rooms(admin)
    router.delete('/admin/room', (req: Request, res: Response, next: NextFunction) => auth(req, res, next), async (req: Request, res: Response) => {
        try {
            if (req.body.user.role === 'admin') {
                //mysql driver doesnt support DISTINCT, use GROUP_BY instead
                const existRoom = await startConnection.socketRepository.createQueryBuilder('socket').select(['socket.roomName']).groupBy("socket.roomName").getMany()
                if (existRoom.length !== 0) {
                    for (const socket of existRoom) {
                        await startConnection.socketRepository.createQueryBuilder().delete().where('roomName' +
                            ' =:name', {name: socket.roomName}).execute()
                        io.to(socket.roomName).disconnectSockets()
                    }
                    res.status(200).send({
                        'message': 'Delete rooms' +
                            ' successfully!'
                    })
                } else res.status(404).send({error: 'No room found!'})
            } else {
                return res.status(401).send({
                    error: 'Unauthorized. Only admin can' +
                        ' delete room!'
                })
            }
        } catch (e) {
            res.status(400).send({error: 'Error occur. Cannot delete room!'})
        }
    })

    // Chat login api
    router.post('/chat.html', async (req: Request, res: Response) => {
        const user = await startConnection.userRepository.findOne({
            where: {
                username: req.body.username
            }
        })
        if (user!==null) {

            const isMatch = await bcrypt.compare(req.body.password, user.password)
            if (isMatch) {
                const username = req.body.username;
                const room = req.body.room;
                await startConnection.userRepository.save(user)
                req.session.user = username;
                res.redirect('/chat.html?room=' + room)
            } else res.status(400).send({error: 'Password not match!'})

        } else {
            res.status(404).send({error: 'Invalid username!'})
        }
    })

    return router
}
