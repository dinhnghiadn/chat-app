import session from "express-session"
import jwt, {JwtPayload} from "jsonwebtoken"
import {userRepository} from "./db"
import {NextFunction, Request, RequestHandler, Response} from "express";
import 'dotenv/config'


export const sessionMiddleware = session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false
})

export const wrap = (middleware: any) => (socket: { request: Request; }, next: NextFunction) => middleware(socket.request, socket.request.res, next)

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')!.replace('Bearer ', '')
        const decode = jwt.verify(token, process.env.JWT_SECRET as string)
        const id = (decode as JwtPayload)['_id'];
        const user = await userRepository.findOneOrFail({where:{id}})
        req.body.token = token
        req.body.user = user
        next()

    } catch (e) {
        res.status(401).send({ error: 'Unauthenticated!' })
    }
}
module.exports = {sessionMiddleware,wrap,auth}
