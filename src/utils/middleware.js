const session = require('express-session');
const sessionMiddleware = session({
    secret: "changeit",
    resave: false,
    saveUninitialized: false
})

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
module.exports = {sessionMiddleware,wrap}
