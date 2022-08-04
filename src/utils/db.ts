import 'dotenv/config'
import {DataSource} from 'typeorm'
import {User} from '../models/User'
import {Socket} from '../models/Socket'
import { Server } from 'http'

export class DatabaseConnection {
    dataSource = new DataSource({
        type: 'mysql',
        host: process.env.MYSQL_HOST,
        port: 3306,
        username: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        entities: ['./src/models/*.ts'],
        synchronize: true
    })
    userRepository = this.dataSource.getRepository(User)
    socketRepository = this.dataSource.getRepository(Socket)

    constructor(server: Server,port:string) {
        this.dataSource.initialize()
            .then(() => {
                console.log("Data Source has been initialized!")
                server.listen(port, () => {
                    console.log(`Server is up on ${port}! `)
                })
            })
            .catch((err) => {
                console.error("Error during Data Source initialization", err)
            })
    }
}

