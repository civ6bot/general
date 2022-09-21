import {IntentsBitField, Interaction} from "discord.js";
import {Client} from "discordx";

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
    botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id).filter((guild) => guild !== "663144077818331186")],
    silent: false,
    shards: "auto",
    rest: {offset: 0},
});

discordClient.once("ready", async () => {
    await discordClient.initApplicationCommands({ global: { log: false } });
});

discordClient.on("interactionCreate", (interaction: Interaction) => {
    discordClient.executeInteraction(interaction, true);
});

process.on('uncaughtException', error => {
    console.error(error);
});
