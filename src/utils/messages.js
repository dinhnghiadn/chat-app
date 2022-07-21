// const http = require('http')
// const express = require('express')
// const app = express()
// const server = http.createServer(app)
// const socketio = require('socket.io')
// const io = socketio(server)
const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}
module.exports = {generateMessage, generateLocationMessage}
