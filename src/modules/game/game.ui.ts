import {ModuleBaseUI} from "../base/base.ui";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, User} from "discord.js";
import {UtilsGeneratorButton} from "../../utils/generators/utils.generator.button";
import {Game, GameEntityReady, GameTeamers} from "./game.models";
import {UtilsGeneratorEmbed} from "../../utils/generators/utils.generator.embed";

export class GameUI extends ModuleBaseUI {
    public readyEmbed(gameEntityReady: GameEntityReady): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            gameEntityReady.header,
            "#5865F2",
            gameEntityReady.descriptions[0],
            [
                {name: gameEntityReady.fieldTitles[0], value: gameEntityReady.users.map((user: User): string => user.toString()).join("\n")},
                {name: gameEntityReady.fieldTitles[1], value: gameEntityReady.usersReadyStatus.map((status: number): string => status ? gameEntityReady.emojis[0] : gameEntityReady.emojis[1]).join("\n")}
            ],
            gameEntityReady.author.tag,
            gameEntityReady.author.avatarURL()
        );
    }

    public readyAllFinishedEmbed(gameEntityReady: GameEntityReady): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            gameEntityReady.header,
            (gameEntityReady.descriptions.length === 1) ? "#5865F2" : "#2D7D46",
            gameEntityReady.descriptions[0],
            [],
            gameEntityReady.author.tag,
            gameEntityReady.author.avatarURL()
        );
    }

    public resultEmbed(
        game: Game, title: string,
        unknownResultDescription: string,
        isTimeout: boolean, timeoutDescription: string,
        draftTeamersEmptyBans: string = ""
    ): EmbedBuilder[] {
        let description: string = "";
        for(let i: number = 0; i < game.entities.length; i++){
            description += game.entities[i].getContent();
            if(game.entities[i].errorFlag)
                description += unknownResultDescription;
            description += (i % 5 === 0) && (i !== game.entities.length-1) ? "\n\n" : "\n";
        }
        if(isTimeout)
            description = timeoutDescription + "\n\n" + description;
        if(game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            description += "\n" + gameTeamers.entityCaptains.getContent() + "\n\n" + gameTeamers.entityDraft.getContent();
            if(gameTeamers.entityDraft.banStrings.length === 0)
                description += ` ${draftTeamersEmptyBans}`
        }

        return UtilsGeneratorEmbed.getSingle(
            title,
            (isTimeout) ? "#FFFFFF" : "#5865F2",
            description,
            [],
            game.interaction.user.tag,
            game.interaction.user.avatarURL()
        );
    }

    public gameReadyButton(labels: string[]): ActionRowBuilder<ButtonBuilder>[] {
        return UtilsGeneratorButton.getList(
            labels,
            ["⚡", "⏭️", "✖️"],
            [ButtonStyle.Primary, ButtonStyle.Success, ButtonStyle.Danger],
            ["game-ready", "game-skip", "game-delete"]
        );
    }

    public notificationFFAPMEmbed(
        title: string,
        description: string,
        messageURL: string,
        guildName: string,
        guildAvatarURL: string | null
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#389fff",
            `${description}\n${messageURL}`,
            [],
            guildName,
            guildAvatarURL,
        );
    }

    public notificationTeamersPMEmbed(
        title: string,
        description: string,
        messageURL: string,
        guildName: string,
        guildAvatarURL: string | null
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#00ff40",
            `${description}\n${messageURL}`,
            [],
            guildName,
            guildAvatarURL,
        );
    }
}
