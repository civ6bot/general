import {Message} from "discord.js";

export class CoreServiceEmojis {
    public static async reactOrder (msg: Message, emojis: string[]): Promise<void> {
        for(let emoji of emojis)
            await msg.react(emoji);
    }
}
