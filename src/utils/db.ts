import 'dotenv/config'
import {DataSource} from 'typeorm'
import {User} from '../models/User'
import {Socket} from '../models/Socket'


const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: 3306,
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    entities: ['./src/models/*.ts'],
    synchronize: true
})

dataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    })
export const userRepository = dataSource.getRepository(User)
export const socketRepository = dataSource.getRepository(Socket)

