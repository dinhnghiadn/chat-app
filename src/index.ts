import path from "path"
import http from "http"
import express from "express"
import {sessionMiddleware} from "./utils/session"
import "dotenv/config"
import {socketRouter} from "./router/socket"
import {userRouter} from "./router/user"
import {DatabaseConnection} from "./utils/db"
import { Server } from "socket.io"

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer)

const port = process.env.PORT || 3000
const publicDirectory = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../public/views')
socketRouter(io)
//
app.set('views', viewsPath)
app.set('view engine', 'ejs')

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
    res.status(404).render('error')
})

export const startConnection = new DatabaseConnection()
startConnection.initialize().then(()=>{
    httpServer.listen(port, () => {
        console.log(`Server is up on ${port}! `)
    })
}).catch((err) => {
    console.error("Error during Data Source initialization", err)
})


