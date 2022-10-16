import {IntentsBitField, Interaction} from "discord.js";
import {Client} from "discordx";
import * as dotenv from "dotenv";

dotenv.config({path: 'general.env'});
const isTesting: boolean = Boolean(Number(process.env.TEST_MODE) || 0);

export const discordClient: Client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.MessageContent
    ],
    botGuilds: isTesting
        ? ["795264927974555648"]    // test guild
        : [(client) => client.guilds.cache.map((guild) => guild.id)],
    silent: !isTesting,
    shards: "auto",
    rest: {offset: 0}
});

discordClient.once("ready", async () => {
    await discordClient.initApplicationCommands({ global: { log: isTesting } });
});

discordClient.on("interactionCreate", (interaction: Interaction) => {
    discordClient.executeInteraction(interaction, isTesting);
});
