import {ModuleBaseUI} from "../base/base.ui";
import {ActionRowBuilder, ButtonBuilder, EmbedBuilder} from "discord.js";
import {CoreGeneratorEmbed} from "../../core/generators/core.generator.embed";
import {CoreGeneratorButton} from "../../core/generators/core.generator.button";

export class SteamUI extends ModuleBaseUI {
    public connectEmbed(title: string, description: string): EmbedBuilder[] {
        return CoreGeneratorEmbed.getSingle(
            title,
            "#3B88C3",
            description
        )
    }

    public connectButton(label: string, emoji: string, url: string): ActionRowBuilder<ButtonBuilder>[] {
        return CoreGeneratorButton.getSingleLink(label, url, emoji);
    }

    public link(title: string, description: string, fieldTitle: string, fieldDescription: string): EmbedBuilder[] {
        return  CoreGeneratorEmbed.getSingle(
            title,
            "#3B88C3",
            description,
            [{ name: fieldTitle, value: fieldDescription }]
        );
    }
}
