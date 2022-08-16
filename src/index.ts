import {importx} from "@discordx/importer";
import * as dotenv from "dotenv";
import {httpsServer} from "./server/server.app";
import {discordClient} from "./discord/discord.client";
import {dataSource} from "./database/database.datasource";
import {DatabaseServiceText} from "./database/services/service.Text";
import {loadTextEntities} from "./core/loaders/core.loader.text";
import {DatabaseServiceConfig} from "./database/services/service.Config";
import {loadDefaultConfigs} from "./core/loaders/core.loader.config";

dotenv.config({path: 'general.env'});

importx(__dirname + "/modules/*/*.interactions.{js,ts}").then(() => {
    discordClient.login(process.env.BOT_TOKEN as string).then(() => {
        console.log("Civilization VI \"General\" started");
    });
});

dataSource.initialize().then(async () => {
    let databaseServiceText: DatabaseServiceText = new DatabaseServiceText();
    let databaseServiceConfig: DatabaseServiceConfig = new DatabaseServiceConfig();

    await databaseServiceText.clearAll();
    await databaseServiceText.insertAll(loadTextEntities());

    await databaseServiceConfig.clearAll();
    await databaseServiceConfig.insertAll(loadDefaultConfigs());

    console.log(`Local database started`);
});

httpsServer.listen(process.env.SERVER_HTTPS_PORT, () => {
    console.log(`HTTPS server listening on PORT=${process.env.SERVER_HTTPS_PORT}`);
});
