import 'dotenv/config'
import {DataSource, Repository} from 'typeorm'

import fs from 'fs'
import path from 'path'

const {MYSQL_USERNAME, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_DATABASE} = process.env
const MODEL_PATH = './src/models/*.entity.ts';
const MODEL_DIR = './src/models'


export class DatabaseConnection {
    dataSource: DataSource
    //TODO: refractor type of Repository
    repositories: { [model: string]: Repository<any> }

    constructor() {
        this.dataSource = new DataSource({
            type: 'mysql',
            host: MYSQL_HOST,
            port: 3306,
            username: MYSQL_USERNAME,
            password: MYSQL_PASSWORD,
            database: MYSQL_DATABASE,
            entities: [MODEL_PATH],
            synchronize: true
        })
        this.repositories = {}

    }

    initialize() {
        return this.dataSource.initialize()
            .then(() => {
                console.log("Data Source has been initialized!")
                // init repositories models
                fs.readdir(MODEL_DIR, async (err, files) => {
                    if (err) {
                        throw err;
                    } else {
                        // fetch all files in models folder
                        for (const file of files) {
                            if (file.indexOf('.') !== 0 && file.slice(-3) === '.ts') {
                                const model = await import(path.join(`${__dirname}/`, '../models', file))
                                const modelName = file.replace('.entity.ts', '')
                                this.repositories[modelName] = this.dataSource.getRepository(model[modelName]);
                            }
                        }
                    }
                })
            })
            .catch((err) => {
                console.error("Error during Data Source initialization", err)
            });
    }

    getRepository(entityName: string) {
        return this.repositories[entityName];
    }

}

