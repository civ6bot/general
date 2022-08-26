import {ModuleBaseUI} from "../base/base.ui";
import {ActionRowBuilder, APIEmbedField, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";
import {Split} from "./split.models";
import {CoreGeneratorEmbed} from "../../core/generators/core.generator.embed";
import {CoreGeneratorButton} from "../../core/generators/core.generator.button";

export class SplitUI extends ModuleBaseUI {
    public splitEmbed(
        title: string,
        description: string | null,
        teamHeaders: string[],
        split: Split
    ): EmbedBuilder[] {
        let teamValues: string[] = split.getTeamsText();
        if(teamValues.length < teamHeaders.length)
            teamHeaders.shift();
        return CoreGeneratorEmbed.getSingle(
            title,
            split.currentCaptainIndex === -1 ? "#00ff40" : "#008221",
            description,
            teamHeaders.map((teamHeader: string, index: number): APIEmbedField => {return {name: teamHeader, value: teamValues[index]}}),
            split.interaction.user.tag,
            split.interaction.user.avatarURL()
        );
    }

    public splitDeleteButton(label: string): ActionRowBuilder<ButtonBuilder>[] {
        return CoreGeneratorButton.getSingle(
            label,
            "✖️",
            ButtonStyle.Danger,
            "split-delete"
        );
    }
}