import {Message} from "discord.js";

export class UtilsServiceEmojis {
    public static async reactOrder (msg: Message, emojis: string[]): Promise<boolean> {
        let isReactedAll: boolean = true;
        for(let emoji of emojis)
            try {
                await msg.react(emoji);
            } catch {
                isReactedAll = false;
            }
        return isReactedAll;
    }
}
