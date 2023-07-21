import { DataSource } from "typeorm"
import * as dotenv from "dotenv";
dotenv.config({path: 'general.env'});

export const outerDataSource: DataSource = new DataSource({
    type: "mysql",
    host: process.env.DATABASE_HOSTNAME,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [
        __dirname + "/entities/entity.Config.{js,ts}",
        __dirname + "/entities/entity.Invite.{js,ts}",
        __dirname + "/entities/entity.UserSteam.{js,ts}",
        __dirname + "/entities/entity.RulePage.{js,ts}"
    ],
    charset: "utf8mb4_bin",
    logging: false,
    synchronize: true
});

export const localDataSource: DataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../../localDatabase.sqlite",
    entities: [
        __dirname + "/entities/entity.Config.{js,ts}",
        __dirname + "/entities/entity.Text.{js,ts}"
    ],
    logging: false,
    synchronize: true
});
