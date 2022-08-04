import path from "path"
import http from "http"
import express from "express"
import {sessionMiddleware} from "./utils/middleware"

const app = express()
const httpServer = http.createServer(app)
import { Server } from "socket.io"
const io = new Server(httpServer)
import "dotenv/config"
import {socketRouter} from "./router/socket"
import {userRouter} from "./router/user"
import {DatabaseConnection} from "./utils/db"


const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')
socketRouter(io)

app.use(express.static(publicDirectory))

// Middleware for parsing bodies from URL to request
app.use(express.urlencoded({
    extended: false
}))

// Middleware for parsing json objects to request
app.use(express.json())

app.use(sessionMiddleware)

app.use(userRouter(io))

app.use((req, res) => {
    res.status(404).render('error');
});

export const startConnection = new DatabaseConnection(httpServer,port as string)

// httpServer.listen(port, () => {
//     console.log(`Server is up on ${port}! `)
// })


