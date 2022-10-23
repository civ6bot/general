import {importx} from "@discordx/importer";
import {httpsServer} from "./server/server.app";
import {discordClient} from "./discord/discord.client";
import {localDataSource, outerDataSource} from "./database/database.datasources";
import {DatabaseServiceText} from "./database/services/service.Text";
import {loadTextEntities} from "./utils/loaders/utils.loader.text";
import {DatabaseServiceConfig} from "./database/services/service.Config";
import {loadDefaultConfigs} from "./utils/loaders/utils.loader.config";
import * as dotenv from "dotenv";
dotenv.config({path: 'general.env'});

importx(
    __dirname + "/modules/*/*.interactions.{js,ts}",
    __dirname + "/discord/discord.events.{js,ts}",
).then(() => {
    discordClient.login((process.env.TEST_MODE ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN) as string).then(() => {
        console.log(process.env.TEST_MODE ? "Civilization VI \"Test\" started" : "Civilization VI \"General\" started");
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

outerDataSource.initialize().then(async () => {
    console.log(`Outer database started`);
});

httpsServer.listen(process.env.SERVER_HTTPS_PORT, () => {
    console.log(`HTTPS server listening on PORT=${process.env.SERVER_HTTPS_PORT}`);
});

process.on('uncaughtException', error => {
    console.error(error);
});
