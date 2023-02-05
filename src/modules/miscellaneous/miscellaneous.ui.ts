import {ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, Guild, GuildMember, User} from "discord.js";
import { UtilsGeneratorButton } from "../../utils/generators/utils.generator.button";
import {UtilsGeneratorEmbed} from "../../utils/generators/utils.generator.embed";
import {ModuleBaseUI} from "../base/base.ui";
import { VoteSecret } from "./miscellaneous.models";

export class MiscellaneousUI extends ModuleBaseUI {
    public random(title: string, result: string): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#FF526C",
            result
        );
    }

    public coin(title: string, result: boolean, resultNote: string): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            result ? "#FFB554" : "#A0A0A0",
            resultNote
        );
    }

    public vote(title: string, question: string): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#80C0C0",
            question
        );
    }



    public voteSecretProcessingEmbed(
        author: User,
        voteSecret: VoteSecret,
        title: string, 
        description: string,
        fields: string[]
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#FFFFFF",
            description,
            [
                {name: fields[0], value: voteSecret.users.map(user => `<@${user.id}>`).join("\n")},
                {name: fields[1], value: voteSecret.votes.map(vote => vote ? "<:Yes:808418109710794843>" : "<:No:808418109319938099>").join("\n")}
            ],
            author.tag,
            author.avatarURL()
        );
    }

    public voteSecretProcessingButtons(
        interaction: CommandInteraction,
        label: string
    ): ActionRowBuilder<ButtonBuilder>[] {
        return UtilsGeneratorButton.getSingle(
            label, 
            "✖️", 
            ButtonStyle.Danger,
            `secretvote-${interaction.guild?.id as string}-${interaction.user.id}-delete`
        );
    }

    public voteSecretPMProcessingEmbed(
        guild: Guild,
        title: string,
        description: string
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#FFFFFF",
            description,
            [],
            guild.name,
            guild.iconURL()
        );
    }

    public voteSecretPMButtons(
        interaction: CommandInteraction,
        isAbstained: boolean,
        labels: string[]
    ): ActionRowBuilder<ButtonBuilder>[] {
        let indexes: number[] = (isAbstained) ? [0, 1, 2] : [0, 2];
        let filterFunction = (value: any, index: number): boolean => (indexes.indexOf(index) !== -1);

        labels = labels.filter(filterFunction);
        let emojis: string[] = ["<:Yes:808418109710794843>", "🤔", "<:No:808418109319938099>"].filter(filterFunction);
        let styles: ButtonStyle[] = [ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Secondary].filter(filterFunction);
        let customIDArray: string[] = [
            `secretvote-${interaction.guild?.id as string}-${interaction.user.id}-yes`,
            `secretvote-${interaction.guild?.id as string}-${interaction.user.id}-abstained`,
            `secretvote-${interaction.guild?.id as string}-${interaction.user.id}-no`,
        ].filter(filterFunction);
        return UtilsGeneratorButton.getList(
            labels,
            emojis,
            styles,
            customIDArray
        );
    }

    public voteSecretPMResultEmbed(
        guild: Guild,
        isTimeout: boolean,
        title: string,
        description: string
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            (isTimeout) ? "#FFAA00" : "#80C0C0",
            description,
            [],
            guild.name,
            guild.iconURL()
        );
    }

    public voteSecretResultEmbed(
        author: User,
        voteSecret: VoteSecret,
        isTimeout: boolean,
        title: string,
        description: string,
        fields: string[]
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            (isTimeout) ? "#FFAA00" : "#80C0C0",
            description,
            [
                {name: fields[0], value: String(voteSecret.votes.filter(vote => vote === 1).length)},
                {name: fields[1], value: String(voteSecret.votes.filter(vote => vote === 2).length)},
                {name: fields[2], value: String(voteSecret.votes.filter(vote => vote === -1).length)},
            ].filter((value, index) => (index !== 1) || voteSecret.isAbstained),
            author.tag,
            author.avatarURL()
        );
    }
}
