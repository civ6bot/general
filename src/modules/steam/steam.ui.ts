import {ModuleBaseUI} from "../base/base.ui";
import {ActionRowBuilder, ButtonBuilder, EmbedBuilder, User} from "discord.js";
import {UtilsGeneratorEmbed} from "../../utils/generators/utils.generator.embed";
import {UtilsGeneratorButton} from "../../utils/generators/utils.generator.button";

export class SteamUI extends ModuleBaseUI {
    public connectEmbed(title: string, description: string): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#3B88C3",
            description
        )
    }

    public connectButton(label: string, emoji: string, url: string): ActionRowBuilder<ButtonBuilder>[] {
        return UtilsGeneratorButton.getSingleLink(label, url, emoji);
    }

    public link(
        title: string,
        description: string,
        fieldTitle: string,
        fieldDescription: string,
        author: User
    ): EmbedBuilder[] {
        return  UtilsGeneratorEmbed.getSingle(
            title,
            "#3B88C3",
            description,
            [{ name: fieldTitle, value: fieldDescription }],
            author.tag,
            author.avatarURL()
        );
    }
}
