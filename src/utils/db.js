require('dotenv/config')
const {DataSource} = require('typeorm')
const User = require('../models/User')
const Socket = require('../models/Socket')


const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: 3306,
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    entities: ['./src/models/*.js'],
    synchronize: true
})

dataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    })
const userRepository = dataSource.getRepository(User)
const socketRepository = dataSource.getRepository(Socket)
module.exports = {userRepository, socketRepository}
