const users = []

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({id, username, room}) => {
    //Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }
    //Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    //Validate username
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }
    //Store user
    const user = {id, username, room}
    users.push(user)
    return {user}
}
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUserInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

const getInfo = () => {
    const groupedTech = users.reduce((acc, user) => {
        // Group initialization
        if (!acc[user.room]) {
            acc[user.room] = []
        }
        // Grouping
        acc[user.room].push(user)
        return acc
    }, {})
    return Object.entries(groupedTech).map(([room, users]) => ({
        room,
        users
    }))

    // return users
}

module.exports = {
    addUser, removeUser, getUser, getUserInRoom, getInfo
}
