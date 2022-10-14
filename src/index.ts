import {importx} from "@discordx/importer";
import * as dotenv from "dotenv";
import {httpsServer} from "./server/server.app";
import {discordClient} from "./discord/discord.client";
import {dataSource, outerDataSource} from "./database/database.datasource";
import {DatabaseServiceText} from "./database/services/service.Text";
import {loadTextEntities} from "./core/loaders/core.loader.text";
import {DatabaseServiceConfig} from "./database/services/service.Config";
import {loadDefaultConfigs} from "./core/loaders/core.loader.config";
import {ActivityType} from "discord.js";

dotenv.config({path: 'general.env'});
const isDebug: boolean = Boolean(Number(process.env.DEBUG_TEST_MODE) || 0);

importx(__dirname + "/modules/*/*.interactions.{js,ts}").then(() => {
    discordClient.login(process.env.BOT_TOKEN as string).then(() => {
        try {
            discordClient.user?.setAvatar(
                isDebug
                    ? __dirname + "/../images/avatar-test.png"
                    : __dirname + "/../images/avatar-general.png"
            );
        } catch {}

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

        console.log(
            isDebug
                ? "Civilization VI \"Test\" started"
                : "Civilization VI \"General\" started"
        );
    });
});

dataSource.initialize().then(async () => {
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
})

httpsServer.listen(process.env.SERVER_HTTPS_PORT, () => {
    console.log(`HTTPS server listening on PORT=${process.env.SERVER_HTTPS_PORT}`);
});

process.on('uncaughtException', error => {
    console.error(error);
});
