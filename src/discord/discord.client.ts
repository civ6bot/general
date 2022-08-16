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
    ],
    botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
    silent: true,
    shards: "auto",
    rest: {offset: 0}
});

discordClient.once("ready", async () => {
    await discordClient.initApplicationCommands({ global: { log: false } });
});

discordClient.on("interactionCreate", (interaction: Interaction) => {
    discordClient.executeInteraction(interaction, true);
});
