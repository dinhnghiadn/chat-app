import jwt from 'jsonwebtoken'
import {userRepository, socketRepository} from "./db"
import {User} from "../models/User";

export const addUser = async (id:string, username:string, room:string) => {
    //Clean room name
    room = room.trim().toLowerCase()
    //Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }
    //Store user
    const user = await userRepository.findOneOrFail({
        where: {username},
        relations: {sockets: true}
    },)
    const newSocket = socketRepository.create({socketID:id, roomName:room})
    user.sockets.push(newSocket)
    await userRepository.save(user)
    return user
}
export const removeUser = async (id: string) => {
    const user = await userRepository.createQueryBuilder('user').leftJoinAndSelect('user.sockets', 'socket').where('socketID =:id', {id}).getOne()
    await socketRepository.createQueryBuilder().delete().where('socketID =:id', {id}).execute()
    return user

}

export const getUserAndRoom = async (id: string) => {
    return userRepository.createQueryBuilder('user').leftJoinAndSelect('user.sockets', 'socket').where('socketID =:id', {id}).getOne()

}

export const getUserInRoom = (room: string) => {
    room = room.trim().toLowerCase()
    return userRepository.createQueryBuilder('user').leftJoinAndSelect('user.sockets', 'socket').where('roomName =:room', {room}).getMany()
}


export const getInfo = async () => {
    const results = await socketRepository.createQueryBuilder('socket').leftJoinAndSelect('socket.user', 'user').select(['socket.roomName',
    'user.username']).getRawMany()

    const groupRoom = results.reduce((acc, result) => {
        // Group initialization
        if (!acc[result.socket_roomName]) {
            acc[result.socket_roomName] = []
        }
        // Grouping
        acc[result.socket_roomName].push(result.user_username)
        return acc
    }, {})

    return Object.entries(groupRoom).map(([room, users]) => ({
        room,
        users
    }))
}

export const generateAuthToken = (user: User) => {
    return jwt.sign({_id: user.id}, process.env.JWT_SECRET as string)
}
