import {IntentsBitField, Interaction} from "discord.js";
import {Client} from "discordx";
import * as dotenv from "dotenv";

dotenv.config({path: 'general.env'});
const isDebug: boolean = Boolean(Number(process.env.DEBUG_TEST_MODE) || 0);

export const discordClient: Client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.MessageContent,
    ],
    botGuilds: isDebug
        ? [(client) => client.guilds.cache.map((guild) => guild.id).filter((guild) => guild !== "663144077818331186")]
        : [(client) => client.guilds.cache.map((guild) => guild.id)],
    silent: !isDebug,
    shards: "auto",
    rest: {offset: 0},
});

discordClient.once("ready", async () => {
    await discordClient.initApplicationCommands({ global: { log: isDebug } });
});

discordClient.on("interactionCreate", (interaction: Interaction) => {
    discordClient.executeInteraction(interaction, isDebug);
});
