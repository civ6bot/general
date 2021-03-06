import {MessageActionRow, MessageButton} from "discord.js";
import {BotlibEmojis} from "../../../botlib/botlib.emojis";

export class NewButtons{
    botlibEmojis: BotlibEmojis = new BotlibEmojis();

    newPlayersRow(){
        let rows: MessageActionRow[] = [];
        let buttonArray: MessageButton[] = [];
        buttonArray.push(
            new MessageButton()
                .setEmoji("⚡")
                .setLabel("Готов!")
                .setStyle("PRIMARY")
                .setCustomId(`new-ready`),
            new MessageButton()
                .setEmoji(this.botlibEmojis.no)
                .setLabel("Удалить (для автора)")
                .setStyle("DANGER")
                .setCustomId("new-delete")
        );
        rows.push(new MessageActionRow().addComponents(buttonArray));
        return rows;
    }
}
