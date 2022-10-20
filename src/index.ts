import {importx} from "@discordx/importer";
import * as dotenv from "dotenv";
import {httpsServer} from "./server/server.app";
import {discordClient} from "./discord/discord.client";
import {localDataSource, outerDataSource} from "./database/database.datasources";
import {DatabaseServiceText} from "./database/services/service.Text";
import {loadTextEntities} from "./utils/loaders/utils.loader.text";
import {DatabaseServiceConfig} from "./database/services/service.Config";
import {loadDefaultConfigs} from "./utils/loaders/utils.loader.config";
import {ActivityType} from "discord.js";

dotenv.config({path: 'general.env'});
const isTesting: boolean = Boolean(Number(process.env.TEST_MODE) || 0);

importx(__dirname + "/modules/*/*.interactions.{js,ts}").then(() => {
    discordClient.login((isTesting ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN) as string).then(() => {
        setInterval(() => {
            let guildsAmount: number = discordClient.guilds.cache.size;
            let usersAmount: number = discordClient.guilds.cache
                .map((guild): number => guild.memberCount)
                .reduce((a, b) => a+b);
            discordClient.user?.setActivity({
                name: `${guildsAmount} 🏘️, ${usersAmount} 👥`,
                type: ActivityType.Listening
            });
            setTimeout(() => {
                discordClient.user?.setActivity({
                    name: `⭐ Support us!`
                });
            }, 30*1000);
            setTimeout(() => {
                discordClient.user?.setActivity({
                    name: `📄 /help to check commands.`,
                });
            }, 45*1000);
        }, 60*1000);

        console.log(isTesting
                ? "Civilization VI \"Test\" started"
                : "Civilization VI \"General\" started"
        );
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
