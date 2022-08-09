import {sessionMiddleware, wrap} from '../utils/session'
import {
    addUser,
    removeUser,
    getUserAndRoom,
    getUserInRoom,
    getInfo, getUserAndSocket
} from '../utils/users'
import {generateMessage, generateLocationMessage} from '../utils/messages'
import Filter from 'bad-words'
import {User} from "../models/User.entity"
import {Socket} from "../models/Socket.entity";

export function socketRouter(io: any) {
    io.use(wrap(sessionMiddleware));
    io.on('connection', async (socket: any) => {
        console.log('New Websocket connection !')
        socket.emit('info', await getInfo())
        //Listen on join event
        socket.on('join', async (room: string, callback: () => void) => {
            if (!socket.request.session.user) {
                return socket.emit('redirect', 'Invalid username')
            }
            const usernameInput = socket.request.session.user
            let user = await addUser(
                socket.id,
                usernameInput,
                room
            )
            if (!(user instanceof User)) {
                return socket.emit('redirect', user.error)
            }
            socket.join(room)
            socket.emit('message', generateMessage('Admin', 'Welcome!'))
            socket.broadcast.to(room).emit('message', generateMessage('Admin', `${user.username} has joined!`) as any)
            io.to(room).emit('joinInfo', await getInfo())
            io.to(room).emit('roomData', {
                room: room,
                users: await getUserInRoom(room)
            } as any)
            callback()
        })

        //Listen on sendMessage event
        socket.on('sendMessage', async (message: string, callback: any) => {
            const user = await getUserAndRoom(socket.id)
            const filter = new Filter()
            if (filter.isProfane(message)) {
                return callback('Profanity is not allowed')
            }
            io.to(user!.sockets[0].roomName).emit('message', generateMessage(user!.username, message) as any)
            callback()

        })

        //Listen on sendLocation event
        socket.on('sendLocation', async (coords: { latitude: string, longitude: string }, callback: () => void) => {
            const user = await getUserAndRoom(socket.id)
            io.to(user!.sockets[0].roomName).emit('locationMessage', generateLocationMessage(user!.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`) as any)
            callback()
        })

        //Listen on disconnect event
        socket.on('disconnect', async () => {
            const user = await removeUser(socket.id)
            if (user) {
                io.to(user.sockets[0].roomName).emit('message', generateMessage('Admin', `${user.username} has left! `) as any)
                io.to(user.sockets[0].roomName).emit('joinInfo', await getInfo())
                io.to(user.sockets[0].roomName).emit('roomData', {
                    room: user.sockets[0].roomName,
                    users: await getUserInRoom(user.sockets[0].roomName)
                } as any)
            }
        })

        socket.on('clearSession',async () =>{
            const user = await getUserAndSocket(socket.request.session.user)
            socket.request.session.destroy()
            socket.emit('redirect', 'Log out')
            user.sockets.forEach((i : Socket)=>{
                io.in(i.socketID).disconnectSockets()
            })
        })

    })
}
