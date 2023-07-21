import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { UtilsGeneratorEmbed } from "../../utils/generators/utils.generator.embed";
import { ModuleBaseUI } from "../base/base.ui";
import { UtilsGeneratorButton } from "../../utils/generators/utils.generator.button";
import { UtilsGeneratorMenu } from "../../utils/generators/utils.generator.menu";

export class DiscordUI extends ModuleBaseUI {
    public onGuildCreate(
        title: string,
        color: string,
        description: string,
        thumbnailImageURL: string
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            color as ColorResolvable,
            description,
            [],
            null,
            null,
            thumbnailImageURL
        );
    }

    public guildListEmbed(
        title: string,
        description: string,
        fieldTitles: string[],
        fieldValues: string[]
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#8800FF",
            description,
            fieldTitles.map((_, index: number) => { return {name: fieldTitles[index], value: fieldValues[index]};})
        );
    }

    public guildListButtons(
        pageCurrent: number, pagesTotal: number,
        buttonDeleteLabel: string
    ): ActionRowBuilder<ButtonBuilder>[] {
        let indexes: number[] = [4];
        if(pagesTotal > 2)
            indexes.push(0, 1, 2, 3);
        else if(pagesTotal === 2)
            indexes.push(1, 2);
        let filterFunction = (value: any, index: number): boolean => (indexes.indexOf(index) !== -1);

        let labels = Array<string>(4).fill("").concat(buttonDeleteLabel).filter(filterFunction);
        let emojis = ["⏮", "◀", "▶", "⏭", "✖️"].filter(filterFunction);
        let styles = Array<ButtonStyle>(4).fill(ButtonStyle.Secondary).concat(ButtonStyle.Danger).filter(filterFunction);
        let customIDArray = [
            `discordGuilds-page-first`,
            `discordGuilds-page-${pageCurrent-1}`,
            `discordGuilds-page-${pageCurrent+1}`,
            `discordGuilds-page-last`,
            `discordGuilds-delete`,
        ].filter(filterFunction);
        let isDisabledArray = [
            (pageCurrent === 1),
            (pageCurrent === 1),
            (pageCurrent === pagesTotal),
            (pageCurrent === pagesTotal),
            false
        ].filter(filterFunction);

        return UtilsGeneratorButton.getList(
            labels, 
            emojis, 
            styles, 
            customIDArray, 
            isDisabledArray
        );
    } 

    public guildListMenu(
        pageCurrent: number,
        placeholder: string,
        labels: string[],
        guildIDArray: string[]
    ): ActionRowBuilder<StringSelectMenuBuilder>[] {
        return UtilsGeneratorMenu.build(
            "discordGuilds-menu",
            placeholder,
            labels,
            [],
            guildIDArray.map((guildID) => `discordGuilds-menu-${pageCurrent}-${guildID}`)
        );
    }

    public guildInfoEmbed(
        title: string,
        fieldTitles: string[],
        fieldValues: string[],
        thumbnailImageURL: string | null
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#8800FF",
            null,
            fieldTitles.map((_, index: number) => { return {
                name: fieldTitles[index],
                value: fieldValues[index],
                inline: true
            }}),
            null,
            null,
            thumbnailImageURL
        );
    }

    public guildInfoButtons(
        pageCurrent: number,
        guildID: string,
        buttonLabels: string[]
    ): ActionRowBuilder<ButtonBuilder>[] {
        let emojis = ["⬅", "🔄", "✖️"];
        let styles = [
            ButtonStyle.Secondary,
            ButtonStyle.Success,
            ButtonStyle.Danger
        ];
        let customIDArray = [
            `discordGuilds-page-${pageCurrent}`,
            `discordGuilds-updateLink-${pageCurrent}-${guildID}`,
            `discordGuilds-delete`,
        ];
        return UtilsGeneratorButton.getList(
            buttonLabels, 
            emojis, 
            styles, 
            customIDArray
        );
    }
}
