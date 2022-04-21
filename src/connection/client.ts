import {Intents, Interaction} from "discord.js";
import {Client} from "discordx";

export const client: Client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.DIRECT_MESSAGES,
    ],
    botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
    silent: true,
    shards: "auto",
    restTimeOffset: 0
});

client.once("ready", async () => {
    await client.initApplicationCommands({global: { log: false }});
    await client.initApplicationPermissions(false);
    console.log("Civilization VI bot started");
});

client.on("interactionCreate", (interaction: Interaction) => {client.executeInteraction(interaction);});
