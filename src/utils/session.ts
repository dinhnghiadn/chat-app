import session from "express-session"
import {NextFunction, Request, Response} from "express"
import 'dotenv/config'

export const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 30,
        sameSite: true,
    },
})

export const wrap = (middleware: any) => (socket: { request: Request }, next: NextFunction) => middleware(socket.request, socket.request.res, next)

