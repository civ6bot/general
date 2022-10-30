import {ArgsOf, Client, Discord, On, Once} from "discordx";
import {ActivityType} from "discord.js";
import * as dotenv from "dotenv";
import {UtilsServiceTime} from "../utils/services/utils.service.time";
dotenv.config({path: 'general.env'});

@Discord()
export abstract class DiscordEvents {
    @Once({event: "ready"})
    public async onceReady([clientArg]: ArgsOf<"ready">, client: Client) {
        await client.initApplicationCommands({ global: { log: (process.env.TEST_MODE == '1') } });

        setInterval(() => {
            let guildsAmount: number = client.guilds.cache.size;
            let usersAmount: number = client.guilds.cache
                .map((guild): number => guild.memberCount)
                .reduce((a, b) => a+b);
            client.user?.setActivity({
                name: `${guildsAmount} 🏰, ${usersAmount} 👥`,
                type: ActivityType.Listening
            });
            setTimeout(() => {
                client.user?.setActivity({
                    name: `⭐ Support us!`
                });
            }, UtilsServiceTime.getMs(30, "s"));
            setTimeout(() => {
                client.user?.setActivity({
                    name: `📄 /help to check commands.`,
                });
            }, UtilsServiceTime.getMs(45, "s"));
        }, UtilsServiceTime.getMs(60, "s"));
    }

    @On({event: "interactionCreate"})
    public async onInteractionCreate([interaction]: ArgsOf<"interactionCreate">, client: Client) {
        client.executeInteraction(interaction);
    }
}
