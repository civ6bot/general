import {ModuleBaseUI} from "../base/base.ui";
import {ActionRowBuilder, APIEmbedField, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";
import {Split} from "./split.models";
import {UtilsGeneratorEmbed} from "../../utils/generators/utils.generator.embed";
import {UtilsGeneratorButton} from "../../utils/generators/utils.generator.button";

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
        return UtilsGeneratorEmbed.getSingle(
            title,
            split.currentCaptainIndex === -1 ? "#00ff40" : "#008221",
            description,
            teamHeaders.map((teamHeader: string, index: number): APIEmbedField => {return {name: teamHeader, value: teamValues[index]}}),
            split.interaction.user.username,
            split.interaction.user.avatarURL()
        );
    }

    public splitProcessingButtons(labels: string[], isFirstStep: boolean): ActionRowBuilder<ButtonBuilder>[] {
        let emojis: string[] = ["⬅️", "✖️"];
        let styles: ButtonStyle[] = [ButtonStyle.Secondary, ButtonStyle.Danger];
        let ids: string[] = ["split-undo", "split-delete"];
        if(isFirstStep) {
            labels.splice(0, 1);
            emojis.splice(0, 1);
            styles.splice(0, 1);
            ids.splice(0, 1);
        }
        return UtilsGeneratorButton.getList(labels, emojis, styles, ids);
    }

    public splitFailedButtons(labels: string[], hasSkipToDraft: boolean = false): ActionRowBuilder<ButtonBuilder>[] {
        if(!hasSkipToDraft)
            labels.splice(2, 1);
        return hasSkipToDraft 
            ? UtilsGeneratorButton.getList(
                labels,
                ["▶️", "🔄", "⏩", "✖️"],
                [ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Danger],
                ["split-restart", "split-continue", "split-skip", "split-delete"]
            )
            : UtilsGeneratorButton.getList(
                labels,
                ["▶️", "🔄", "✖️"],
                [ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Danger],
                ["split-restart", "split-continue", "split-delete"]
            );
    }

    public notificationSplitPMEmbed(
        title: string, 
        description: string,
        messageURL: string,
        guildName: string,
        guildAvatarURL: string | null
        ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#008221",
            `${description}\n${messageURL}`,
            [],
            guildName,
            guildAvatarURL
        );
    }
}