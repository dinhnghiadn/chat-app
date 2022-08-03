import {sessionMiddleware, wrap} from '../utils/middleware'
import {
    addUser,
    removeUser,
    getUserAndRoom,
    getUserInRoom,
    getInfo
} from '../utils/users'
import {generateMessage, generateLocationMessage} from '../utils/messages'
import Filter from 'bad-words'
import {User} from "../models/User";

export function socketRouter(io: any) {
    io.use(wrap(sessionMiddleware));
    io.on('connection', async (socket: any) => {
        console.log('New Websocket connection !')
        socket.emit('info', await getInfo())
        socket.on('join', async ({room}: any, callback: () => void) => {
            if (!socket.request.session.user) {
                return socket.emit('redirect')
            }
            const usernameInput = socket.request.session.user
            let user = await addUser(
                socket.id,
                usernameInput,
                room
            )
            socket.join(room)
            socket.emit('message', generateMessage('Admin', 'Welcome!'))
            if (user instanceof User) {
                socket.broadcast.to(room).emit('message', generateMessage('Admin', `${user.username} has joined!`) as any)
            }
            io.to(room).emit('joinInfo', await getInfo())
            io.to(room).emit('roomData', {
                room: room,
                users: await getUserInRoom(room)
            } as any)
            callback()
        })

        socket.on('sendMessage', async (message: string, callback: any) => {
            const user = await getUserAndRoom(socket.id)
            const filter = new Filter()
            if (filter.isProfane(message)) {
                return callback('Profanity is not allowed')
            }
            io.to(user!.sockets[0].roomName).emit('message', generateMessage(user!.username, message) as any)
            callback()

        })
        socket.on('sendLocation', async (coords: { latitude: string, longitude: string }, callback: () => void) => {
            const user = await getUserAndRoom(socket.id)
            io.to(user!.sockets[0].roomName).emit('locationMessage', generateLocationMessage(user!.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`) as any)
            callback()
        })
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

    })
}
