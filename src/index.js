const path = require('path')
const http = require('http')
const express = require('express')
const {sessionMiddleware, wrap, auth} = require('./utils/middleware')
const app = express()
const server = http.createServer(app)
const bodyParser = require("body-parser")
const socketio = require('socket.io')
const io = socketio(server)
require('dotenv/config')
require('./utils/db')
require('./router/socket')(io)
const userRouter = require('./router/user')(io)

const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')


app.use(express.static(publicDirectory))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(sessionMiddleware)
app.use(bodyParser.json())
app.use(userRouter)

app.use((req, res) => {
    res.status(404).render('error');
});
server.listen(port, () => {
    console.log(`Server is up on ${port}! `)
})


