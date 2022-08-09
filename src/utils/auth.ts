import {NextFunction, Request, Response} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import {startConnection} from "../index";
import {User} from "../models/User.entity";

const {JWT_SECRET} = process.env
export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const token = req.header('Authorization')!.replace('Bearer ', '')
        const decode = jwt.verify(token,JWT_SECRET as string)
        const id = (decode as JwtPayload)['_id'];
        const user = await startConnection.getRepository('User').findOneOrFail({where:{id}})
        req.body.token = token
        req.body.user = user
        next()

    } catch (e) {
        res.status(401).send({ error: 'Unauthenticated!' })
    }
}


export const generateAuthToken = (user: User) => {
    return jwt.sign({_id: user.id},JWT_SECRET as string)
}
