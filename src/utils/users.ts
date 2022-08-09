import {startConnection} from "../index"
import {validate} from "class-validator"
import {Socket} from "../models/Socket.entity";

export const addUser = async (id: string, username: string, room: string) => {
    //Clean room name
    room = room.trim().toLowerCase()
    const user = await startConnection.getRepository('User').findOneOrFail({
        where: {username},
        relations: {sockets: true}
    },)
    if (user.sockets.some((i:Socket) => i.roomName === room)) {
        return {'error': `User already in this room!!`}
    }
    const newSocket = startConnection.getRepository('Socket').create({
        socketID: id,
        roomName: room
    })
    const errors = await validate(newSocket)
    if (errors.length > 0) {
        console.log(errors)
        let messages = JSON.stringify(errors.map(error => error.constraints))
        return {'error': `${messages}`}
    }

    user.sockets.push(newSocket)
    await startConnection.getRepository('User').save(user)
    return user
}
export const removeUser = async (id: string) => {
    const user = await startConnection.getRepository('User').createQueryBuilder( 'user').leftJoinAndSelect('user.sockets', 'socket').where('socketID =:id', {id}).getOne()
    await startConnection.getRepository('Socket').createQueryBuilder().delete().where('socketID =:id', {id}).execute()
    return user
}

export const getUserAndSocket = async (username: string) => {
    return startConnection.getRepository('User').createQueryBuilder('user').leftJoinAndSelect('user.sockets', 'socket').where('username =:username', {username}).getOne()
}


export const getUserAndRoom = async (id: string) => {
    return startConnection.getRepository('User').createQueryBuilder( 'user').leftJoinAndSelect('user.sockets', 'socket').where('socketID =:id', {id}).getOne()

}

export const getUserInRoom = (room: string) => {
    room = room.trim().toLowerCase()
    return startConnection.getRepository('User').createQueryBuilder('user').leftJoinAndSelect('user.sockets', 'socket').where('roomName =:room', {room}).getMany()
}

export const getInfo = async () => {
    const results = await startConnection.getRepository('Socket').createQueryBuilder( 'socket').leftJoinAndSelect('socket.user', 'user').select(['socket.roomName',
        'user.username']).getRawMany()

    const groupRoom = results.reduce((acc, result) => {
        if (!acc[result.socket_roomName]) {
            acc[result.socket_roomName] = []
        }
        acc[result.socket_roomName].push(result.user_username)
        return acc
    }, {})

    return Object.entries(groupRoom).map(([room, users]) => ({
        room,
        users
    }))
}
