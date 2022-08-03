import path from "path"
import http from "http"
import express from "express"
import {sessionMiddleware} from "./utils/middleware"

const app = express()
const server = http.createServer(app)
import bodyParser from "body-parser"

import socketio from "socket.io"
// @ts-ignore
const io = socketio(server)
import "dotenv/config"
import "./utils/db"
import {socketRouter} from "./router/socket";
import {userRouter} from "./router/user";

const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')
socketRouter(io)

app.use(express.static(publicDirectory))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(sessionMiddleware)
app.use(bodyParser.json())
app.use(userRouter(io))

app.use((req, res) => {
    res.status(404).render('error');
});
server.listen(port, () => {
    console.log(`Server is up on ${port}! `)
})


