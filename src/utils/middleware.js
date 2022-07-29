const session = require('express-session');
const jwt = require('jsonwebtoken')
const {userRepository} = require('./db')

const sessionMiddleware = session({
    secret: "changeit",
    resave: false,
    saveUninitialized: false
})

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        // const user = await User.findOne({ _id: decode._id, 'tokens.token': token })
        const user = await userRepository.findOne({where:{id:decode._id}})
        if (user === null) {
            throw new Error()
        }
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate!' })
    }
}
module.exports = {sessionMiddleware,wrap,auth}
