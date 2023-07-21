import {IntentsBitField, Partials} from "discord.js";
import {Client} from "discordx";
import * as dotenv from "dotenv";
dotenv.config({path: 'general.env'});

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
    botGuilds: (process.env.TEST_MODE === '1') ? ["795264927974555648"] : undefined,  // Test Guild or all Guilds.
    partials: [Partials.Channel],   // For DM messages catching.
    silent: !((process.env.TEST_MODE == '1')),
    shards: "auto",
    rest: {offset: 0}
});
