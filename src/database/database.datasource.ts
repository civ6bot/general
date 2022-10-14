import { DataSource } from "typeorm"
import * as dotenv from "dotenv";

dotenv.config({path: 'general.env'});

export const outerDataSource: DataSource = new DataSource({
    type: "mysql",
    host: process.env.DATABASE_HOSTNAME,
    port: process.env.DATABASE_PORT as number | undefined,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [
        __dirname + "/entities/entity.Config.{js,ts}",
        __dirname + "/entities/entity.UserSteam.{js,ts}"
    ],
    charset: "utf8mb4_bin",
    logging: false,
    synchronize: false   // поменять на false
});

export const dataSource: DataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../../database.sqlite",
    entities: [
        __dirname + "/entities/entity.Config.{js,ts}",
        __dirname + "/entities/entity.Text.{js,ts}"
    ],
    logging: false,
    synchronize: true
});
