import {importx} from "@discordx/importer";
import {httpServer} from "./server/server.app";
import {discordClient} from "./client/client";
import {localDataSource, outerDataSource} from "./database/database.datasources";
import {DatabaseServiceText} from "./database/services/service.Text";
import {loadTextEntities} from "./utils/loaders/utils.loader.text";
import {DatabaseServiceConfig} from "./database/services/service.Config";
import {loadDefaultConfigs} from "./utils/loaders/utils.loader.config";
import * as dotenv from "dotenv";
dotenv.config({path: 'general.env'});

importx(
    __dirname + "/modules/*/*.{events,interactions}.{js,ts}"
).then(() => {
    discordClient.login(((process.env.TEST_MODE == '1') ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN) as string).then(() => {
        console.log((process.env.TEST_MODE == '1') ? "Civilization VI \"Test\" started" : "Civilization VI \"General\" started");
    });
});

localDataSource.initialize().then(async () => {
    let databaseServiceText: DatabaseServiceText = new DatabaseServiceText();
    let databaseServiceConfig: DatabaseServiceConfig = new DatabaseServiceConfig();

    await databaseServiceText.clearAll();
    await databaseServiceConfig.clearAll();

    await databaseServiceText.insertAll(loadTextEntities());
    await databaseServiceConfig.insertAll(loadDefaultConfigs());

    console.log(`Local database started`);
});

outerDataSource.initialize().then(() => {
    console.log(`Outer database started`);
});

httpServer.listen(process.env.SERVER_HTTP_PORT, () => {
    console.log(`HTTP server listening on PORT=${process.env.SERVER_HTTP_PORT}`);
});

process.on('uncaughtException', error => {
    console.error(error);
});
