const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {sessionMiddleware, wrap} = require('./utils/middleware')
const app = express()
const server = http.createServer(app)
const bodyParser = require("body-parser")
const io = socketio(server)
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUserInRoom, getInfo} = require('./utils/users')

const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')

app.use(express.static(publicDirectory))
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.post('/chat.html', function (req, res) {
    const username = req.body.username;
    const room = req.body.room;
    req.session.User = {username, room}
    res.redirect('/chat.html?room=' + room)
});

io.use(wrap(sessionMiddleware));
io.on('connection', (socket) => {
    console.log('New Websocket connection !')
    socket.emit('info', getInfo())
    socket.on('join', ({room}, callback) => {
        if (!socket.request.session.User) {
            return socket.emit('redirect')
        }
        const usernameInput = socket.request.session.User.username

        const {error, user} = addUser({
            id: socket.id,
            username: usernameInput,
            room: room
        })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('joinInfo', getInfo())
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()

    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left! `))
            io.to(user.room).emit('joinInfo', getInfo())
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

})

server.listen(port, () => {
    console.log(`Server is up on ${port}! `)
})
