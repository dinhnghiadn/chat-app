import {NextFunction, Request, Response} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import {startConnection} from "../index";
import {User} from "../models/user.entity";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const token = req.header('Authorization')!.replace('Bearer ', '')
        const decode = jwt.verify(token, process.env.JWT_SECRET as string)
        const id = (decode as JwtPayload)['_id'];
        const user = await startConnection.userRepository.findOneOrFail({where:{id}})
        req.body.token = token
        req.body.user = user
        next()

    } catch (e) {
        res.status(401).send({ error: 'Unauthenticated!' })
    }
}


export const generateAuthToken = (user: User) => {
    return jwt.sign({_id: user.id}, process.env.JWT_SECRET as string)
}
