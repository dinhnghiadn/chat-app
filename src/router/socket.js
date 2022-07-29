const {sessionMiddleware, wrap} = require('../utils/middleware')
const {addUser, removeUser, getUserAndRoom, getUserInRoom, getInfo} = require('../utils/users')
const {generateMessage, generateLocationMessage} = require('../utils/messages')
const Filter = require('bad-words')

module.exports = function (io) {
    io.use(wrap(sessionMiddleware));
    io.on('connection', async (socket) => {
        console.log('New Websocket connection !')
        socket.emit('info', await getInfo())
        socket.on('join', async ({room}, callback) => {
            if (!socket.request.session.User) {
                return socket.emit('redirect')
            }
            const usernameInput = socket.request.session.User.username
            let user = await addUser({
                id: socket.id,
                username: usernameInput,
                room: room
            })
            socket.join(room)
            socket.emit('message', generateMessage('Admin', 'Welcome!'))
            socket.broadcast.to(room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
            io.to(room).emit('joinInfo', await getInfo())
            io.to(room).emit('roomData', {
                room: room,
                users: await getUserInRoom(room)
            })
            callback()
        })

        socket.on('sendMessage', async (message, callback) => {
            const user = await getUserAndRoom(socket.id)
            const filter = new Filter()
            if (filter.isProfane(message)) {
                return callback('Profanity is not allowed')
            }
            io.to(user.sockets[0].roomName).emit('message', generateMessage(user.username, message))
            callback()

        })
        socket.on('sendLocation', async (coords, callback) => {
            const user = await getUserAndRoom(socket.id)
            io.to(user.sockets[0].roomName).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
            callback()
        })
        socket.on('disconnect', async () => {
            const user = await removeUser(socket.id)
            if (user) {
                io.to(user.sockets[0].roomName).emit('message', generateMessage('Admin', `${user.username} has left! `))
                io.to(user.sockets[0].roomName).emit('joinInfo', await getInfo())
                io.to(user.sockets[0].roomName).emit('roomData', {
                    room: user.sockets[0].roomName,
                    users: await getUserInRoom(user.sockets[0].roomName)
                })
            }
        })

    })
}
