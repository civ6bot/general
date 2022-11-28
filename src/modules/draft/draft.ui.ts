import {ModuleBaseUI} from "../base/base.ui";
import {ActionRowBuilder, APIEmbedField, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, User} from "discord.js";
import {UtilsGeneratorEmbed} from "../../utils/generators/utils.generator.embed";
import {UtilsServiceRandom} from "../../utils/services/utils.service.random";
import {Draft, DraftBlind, DraftFFA, DraftTeamers} from "./draft.models";
import {UtilsGeneratorButton} from "../../utils/generators/utils.generator.button";

export class DraftUI extends ModuleBaseUI {
    public draftFFAEmbed(
        title: string, bansHeader: string,
        errorsHeader: string, draft: DraftFFA
    ): EmbedBuilder[] {
        let description: string = "";
        if(draft.bans.length > 0)
            description += (bansHeader + "\n" + draft.getBansText().join("\n") + "\n\n");
        if(draft.errors.length > 0)
            description += (errorsHeader + "\n" + draft.errors.join(", ") + "\n\n");

        if(draft.thread || (draft.interaction.channel?.type === ChannelType.PublicThread)) {
            description += draft.getPoolsText()
                .map((value: string[], index: number): string => `**${draft.users[index].tag}** (${draft.users[index].toString()})\n` + value.join("\n"))
                .join("\n\n");

            return UtilsGeneratorEmbed.getSingle(
                title,
                UtilsServiceRandom.getBrightColor(),
                description,
                [],
                draft.interaction.user.tag,
                draft.interaction.user.avatarURL()
            );
        } else {
            let fields: APIEmbedField[] = draft.getPoolsText()
                .map((value: string[], index: number): APIEmbedField => { return {
                    name: `**${draft.users[index].tag}**`,
                    value: value.join("\n")
                }
            });
            let tempFields: APIEmbedField[] = [];
            for(let i: number = 0; i < fields.length; i++) {
                tempFields.push(fields[i]);
                if((i%2 === 0))
                    tempFields.push({name: "​", value: "​"});
            }
            fields = tempFields;

            return UtilsGeneratorEmbed.getSingle(
                title,
                UtilsServiceRandom.getBrightColor(),
                description,
                fields,
                draft.interaction.user.tag,
                draft.interaction.user.avatarURL()
            );
        }
    }

    public draftTeamersEmbed(
        title: string, teamDescriptionHeaders: string[],
        bansHeader: string, errorsHeader: string,
        draft: DraftTeamers
    ): EmbedBuilder[] {
        if(draft.thread || (draft.interaction.channel?.type === ChannelType.PublicThread)) {
            let descriptions: string[] = draft.getPoolsText().map( (value: string[], index: number): string => teamDescriptionHeaders[index] + "\n" + value.join("\n"));
            if(draft.errors.length > 0)
                descriptions[0] = errorsHeader + "\n" + draft.errors.join(", ") + "\n\n" + descriptions[0];
            if(draft.bans.length > 0)
                descriptions[0] = bansHeader + "\n" + draft.getBansText().join("\n") + "\n\n" + descriptions[0];
    
            let teamersThumbnailsURL: string[] = [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Antu_flag-red.svg/768px-Antu_flag-red.svg.png",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Antu_flag-blue.svg/768px-Antu_flag-blue.svg.png",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Antu_flag-green.svg/768px-Antu_flag-green.svg.png",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Antu_flag-yellow.svg/768px-Antu_flag-yellow.svg.png",
                "https://media.discordapp.net/attachments/698295115063492758/837417222732644372/768px-Antu_flag-purple.svg.png?width=599&height=599",
                "https://cdn.discordapp.com/attachments/698295115063492758/838985443642310666/768px-Antu_flag-grey.svg.png",
            ];
            return UtilsGeneratorEmbed.getList(
                [title],
                new Array(teamDescriptionHeaders.length).fill(UtilsServiceRandom.getBrightColor()),
                descriptions,
                [],
                draft.interaction.user.tag,
                draft.interaction.user.avatarURL(),
                teamersThumbnailsURL
            );
        } else {
            let description: string = "";
            if(draft.bans.length > 0)
                description += (bansHeader + "\n" + draft.getBansText().join("\n") + "\n\n");
            if(draft.errors.length > 0)
                description += (errorsHeader + "\n" + draft.errors.join(", ") + "\n\n");


            let poolText: string[][] = draft.getPoolsText();
            let fields: APIEmbedField[] = [];

            if(poolText[0].length > 20) {
                let thirdLength: number = Math.ceil(poolText[0].length/3);
                for(let i: number = 0; i < poolText.length-poolText.length%2; i+=2) 
                fields.push(
                    {name: `**${teamDescriptionHeaders[i]}**`, value: poolText[i].slice(0, thirdLength).join("\n")},
                    {name: "​", value: "​"},
                    {name: `**${teamDescriptionHeaders[i+1]}**`, value: poolText[i+1].slice(0, thirdLength).join("\n")},

                    {name: "​", value: poolText[i].slice(thirdLength, 2*thirdLength).join("\n")},
                    {name: "​", value: "​"},
                    {name: "​", value: poolText[i+1].slice(thirdLength, 2*thirdLength).join("\n")},

                    {name: "​", value: poolText[i].slice(2*thirdLength).join("\n") },
                    {name: "​", value: "​"},
                    {name: "​", value: poolText[i+1].slice(2*thirdLength).join("\n") + (i+2 < poolText.length ? "\n​" : "")},
                );
                if(poolText.length%2)
                    fields.push(
                        {name: `**${teamDescriptionHeaders[teamDescriptionHeaders.length-1]}**`, value: poolText[poolText.length-1].slice(0, thirdLength).join("\n")},
                        {name: "​", value: "​"},
                        {name: "​", value: "​"},
                        
                        {name: "​", value: poolText[poolText.length-1].slice(thirdLength, 2*thirdLength).join("\n")},
                        {name: "​", value: "​"},
                        {name: "​", value: "​"},

                        {name: "​", value: poolText[poolText.length-1].slice(2*thirdLength).join("\n")},
                        {name: "​", value: "​"},
                        {name: "​", value: "​"}
                    );
            } else {
                let halfLength: number = Math.ceil(poolText[0].length/2);
                for(let i: number = 0; i < poolText.length-poolText.length%2; i+=2) 
                fields.push(
                    {name: `**${teamDescriptionHeaders[i]}**`, value: poolText[i].slice(0, halfLength).join("\n")},
                    {name: "​", value: "​"},
                    {name: `**${teamDescriptionHeaders[i+1]}**`, value: poolText[i+1].slice(0, halfLength).join("\n")},

                    {name: "​", value: poolText[i].slice(halfLength).join("\n")},
                    {name: "​", value: "​"},
                    {name: "​", value: poolText[i+1].slice(halfLength).join("\n") + (i+2 < poolText.length ? "\n​" : "")},
                );
                if(poolText.length%2)
                    fields.push(
                        {name: `**${teamDescriptionHeaders[teamDescriptionHeaders.length-1]}**`, value: poolText[poolText.length-1].slice(0, halfLength).join("\n")},
                        {name: "​", value: "​"},
                        {name: "​", value: "​"},
                        
                        {name: "​", value: poolText[poolText.length-1].slice(halfLength).join("\n")},
                        {name: "​", value: "​"},
                        {name: "​", value: "​"},
                    );
            }

            return UtilsGeneratorEmbed.getSingle(
                title,
                UtilsServiceRandom.getBrightColor(),
                description,
                fields,
                draft.interaction.user.tag,
                draft.interaction.user.avatarURL()
            );
        }

        
    }

    public draftBlindEmbed(
        title: string, description: string,
        bansHeader: string, errorsHeader: string,
        playersHeader: string, readyHeader: string,
        emojis: string[], draft: DraftBlind,
    ): EmbedBuilder[] {
        if(draft.errors.length > 0)
            description = errorsHeader + "\n" + draft.errors.join(", ") + "\n\n" + description;
        if(draft.bans.length > 0)
            description = bansHeader + "\n" + draft.getBansText().join("\n") + "\n\n" + description;

        return UtilsGeneratorEmbed.getSingle(
            title,
            draft.isProcessing ? "#FFFFFF" : UtilsServiceRandom.getBrightColor(),      // белый, если в процессе; случайный яркий, если готово
            description,
            [{name: playersHeader, value: draft.users.map((user: User): string => user.toString()).join("\n")},
            {name: readyHeader, value:
                emojis.length > 0
                    ? draft.civilizationsPool.map((pool: number[]): string => pool.length === 1 ? emojis[0] : emojis[1]).join("\n")
                    : draft.getPoolsText().map((pool: string[]): string => pool[0].slice(pool[0].indexOf("<"))).join("\n")
            }],
            draft.interaction.user.tag,
            draft.interaction.user.avatarURL()
        );
    }

    public draftBlindPMEmbed(
        title: string, description: string,
        draft: DraftBlind
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            draft.isProcessing ? "#FFFFFF" : "#FFAA00",
            description,
            [],
            draft.interaction.guild?.name,
            draft.interaction.guild?.iconURL()
        );
    }

    public draftBlindPMCivilizationsButtons(draft: Draft, index: number): ActionRowBuilder<ButtonBuilder>[] {
        return UtilsGeneratorButton.getList(
            draft.getPoolsText()[index].map(text => text.slice(0, text.indexOf("<")) + " – " + text.slice(text.indexOf(">") + 1)),
            draft.getPoolsText()[index].map(text => text.slice(text.indexOf("<"), text.indexOf(">") + 1)),
            [],
            draft.getPoolsText()[index]
                .map((text: string): number => draft.civilizationsTexts.indexOf(text))
                .map(civilizationID => `blindButton-pick-${draft.interaction.guild?.id as string}-${civilizationID}`)
        );
    }

    public draftBlindDeleteButton(label: string,): ActionRowBuilder<ButtonBuilder>[] {
        return UtilsGeneratorButton.getSingle(
            label,
            "✖️",
            ButtonStyle.Danger,
            "blindButton-delete"
        );
    }

    public redraftEmbed(
        title: string, description: string,
        yesHeader: string, unknownHeader: string, noHeader: string,
        zeroUsersValue: string, draft: Draft
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#AAAAAA",
            description,
            [
                {name: yesHeader, value: draft.users.filter((user: User, index: number) => draft.redraftStatus[index] === 1).map((user: User): string => user.toString()).join("\n") || zeroUsersValue},
                {name: unknownHeader, value: draft.users.filter((user: User, index: number) => draft.redraftStatus[index] === -1).map((user: User): string => user.toString()).join("\n") || zeroUsersValue},
                {name: noHeader, value: draft.users.filter((user: User, index: number) => draft.redraftStatus[index] === 0).map((user: User): string => user.toString()).join("\n") || zeroUsersValue},
            ]
        );
    }

    public redraftButtons(labels: string[], emojis: string[]) {
        return UtilsGeneratorButton.getList(
            labels,
            emojis,
            [ButtonStyle.Success, ButtonStyle.Danger],
            ["redraftButton-yes", "redraftButton-no"]
        );
    }
}
