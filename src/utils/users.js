const jwt = require('jsonwebtoken')
const {userRepository, socketRepository} = require('../utils/db')
const {Socket} = require('../models/Socket')
const addUser = async ({id, username, room}) => {
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
    user.sockets.push({
        'socketID': id,
        'roomName': room
    })
    await userRepository.save(user)
    return user
}
const removeUser = async (id) => {

    const user = await userRepository.createQueryBuilder('user').leftJoinAndSelect('user.sockets', 'socket').where('socketID =:id', {id}).getOne()
    await socketRepository.createQueryBuilder().delete().where('socketID =:id', {id}).execute()
    return user

}

const getUserAndRoom = async (id) => {
    return userRepository.createQueryBuilder('user').leftJoinAndSelect('user.sockets', 'socket').where('socketID =:id', {id}).getOne()

}

const getUserInRoom = (room) => {
    room = room.trim().toLowerCase()
    return userRepository.createQueryBuilder('user').leftJoinAndSelect('user.sockets', 'socket').where('roomName =:room', {room}).getMany()
}

const getInfo = async () => {
    const results = await socketRepository.createQueryBuilder('socket').leftJoinAndSelect('socket.user', 'user').getMany()
    const groupRoom = results.reduce((acc, result) => {
        // Group initialization
        if (!acc[result.roomName]) {
            acc[result.roomName] = []
        }
        // Grouping
        acc[result.roomName].push(result.user)
        return acc
    }, {})
    return Object.entries(groupRoom).map(([room, users]) => ({
        room,
        users
    }))
}

const generateAuthToken = (user) => {
    return jwt.sign({_id: user.id}, process.env.JWT_SECRET)
}

module.exports = {
    addUser,
    removeUser,
    getUserAndRoom,
    getUserInRoom,
    getInfo,
    generateAuthToken
}
