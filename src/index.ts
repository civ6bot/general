import {importx} from "@discordx/importer";
import {httpServer} from "./server/server.app";
import {discordClient} from "./client/client";
import {dataSource} from "./database/database.datasource";
import {DatabaseServiceText} from "./database/services/service.Text";
import {loadTextEntities} from "./utils/loaders/utils.loader.text";
import {DatabaseServiceConfig} from "./database/services/service.Config";
import {loadDefaultConfigs} from "./utils/loaders/utils.loader.config";
import * as dotenv from "dotenv";
dotenv.config({path: 'general.env'});

importx(
    __dirname + "/modules/*/*.interactions.{js,ts}",
).then(async () => {
    await discordClient.login(((process.env.TEST_MODE === '1') 
        ? process.env.TEST_BOT_TOKEN 
        : process.env.BOT_TOKEN
    ) as string);
    console.log((process.env.TEST_MODE === '1') 
        ? "Civ6Bot Test started" 
        : "Civ6Bot General started"
    );
});

dataSource.initialize().then(async () => {
    let databaseServiceText: DatabaseServiceText = new DatabaseServiceText();
    let databaseServiceConfig: DatabaseServiceConfig = new DatabaseServiceConfig();

    await databaseServiceText.insertAll(loadTextEntities());
    await databaseServiceConfig.insertAll(loadDefaultConfigs());

    console.log(`Database connected`);
});

httpServer.listen(process.env.SERVER_HTTP_PORT, () => {
    console.log(`HTTP server listening`);
});

process.on('uncaughtException', error => {
    console.error(error);
});
