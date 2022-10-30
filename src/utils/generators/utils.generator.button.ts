import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from "discord.js";

export class UtilsGeneratorButton {
    private static maxButtonsPerRow: number = 5;
    private static maxRows: number = 5;

    private static formData<T>(data: T[], elementPerRow: number): T[][] {
        let formedData: T[][] = [];
        while(data.length > 0)
            formedData.push(data.splice(0, elementPerRow));
        return formedData;
    }

    public static getSingle(
        label: string,
        emoji: string = "",
        style: ButtonStyle = ButtonStyle.Secondary,
        customID: string = "",
        isDisabled: boolean = false
    ): ActionRowBuilder<ButtonBuilder>[] {
        return this.getList(
            [label],
            [emoji],
            [style],
            [customID],
            [isDisabled]
        );
    }

    public static getSingleLink(
        label: string,
        url: string,
        emoji: string = "",
    ): ActionRowBuilder<ButtonBuilder>[] {
        return [
            new ActionRowBuilder<ButtonBuilder>().addComponents([new ButtonBuilder()
                .setLabel(label)
                .setEmoji(emoji || "")
                .setStyle(ButtonStyle.Link)
                .setURL(url)
            ])];
    }

    public static getList(
        labelArray: string[],
        emojiArray: string[] = [],
        styleArray: ButtonStyle[] = [],
        customIDArray: string[] = [],
        isDisabledArray: boolean[] = [],
        buttonsPerRow: number = this.maxButtonsPerRow
    ): ActionRowBuilder<ButtonBuilder>[] {
        buttonsPerRow = (buttonsPerRow > this.maxButtonsPerRow) ? this.maxButtonsPerRow : buttonsPerRow;
        return this.getFormedList(
            this.formData(labelArray, buttonsPerRow),
            this.formData(emojiArray, buttonsPerRow),
            this.formData(styleArray, buttonsPerRow),
            this.formData(customIDArray, buttonsPerRow),
            this.formData(isDisabledArray, buttonsPerRow)
        );
    }

    public static getFormedList(
        formedLabelArray: string[][],
        formedEmojiArray: string[][],
        formedStyleArray: ButtonStyle[][],
        formedCustomIDArray: string[][],
        formedIsDisabledArray: boolean[][]
    ): ActionRowBuilder<ButtonBuilder>[] {
        let rows: ActionRowBuilder<ButtonBuilder>[] = [];
        for(let i in formedLabelArray) {
            let buttonArray: ButtonBuilder[] = []
            for (let j in formedLabelArray[i])
                buttonArray.push(
                    new ButtonBuilder()
                        .setLabel(formedLabelArray?.[i]?.[j] || "")
                        .setEmoji(formedEmojiArray?.[i]?.[j] || "")
                        .setStyle(formedStyleArray?.[i]?.[j] || ButtonStyle.Secondary) // grey button
                        .setCustomId(formedCustomIDArray?.[i]?.[j] || "")
                        .setDisabled(formedIsDisabledArray?.[i]?.[j] || false)
                );
            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttonArray));
        }
        rows.splice(this.maxRows+1);
        return rows;
    }
}
