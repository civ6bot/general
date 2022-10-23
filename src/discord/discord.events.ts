import {ArgsOf, Client, Discord, On, Once} from "discordx";
import {ActivityType} from "discord.js";
import * as dotenv from "dotenv";
dotenv.config({path: 'general.env'});

@Discord()
export abstract class DiscordEvents {
    @Once({event: "ready"})
    public async onceReady([clientArg]: ArgsOf<"ready">, client: Client) {
        await client.initApplicationCommands({ global: { log: Boolean((process.env.TEST_MODE)) } });

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
            }, 30*1000);
            setTimeout(() => {
                client.user?.setActivity({
                    name: `📄 /help to check commands.`,
                });
            }, 45*1000);
        }, 60*1000);
    }

    @On({event: "interactionCreate"})
    public async onInteractionCreate([interaction]: ArgsOf<"interactionCreate">, client: Client) {
        client.executeInteraction(interaction);
    }
}
