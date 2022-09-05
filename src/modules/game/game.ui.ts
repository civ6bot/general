import {ModuleBaseUI} from "../base/base.ui";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, User} from "discord.js";
import {CoreGeneratorButton} from "../../core/generators/core.generator.button";
import {Game, GameEntityReady, GameTeamers} from "./game.models";
import {CoreGeneratorEmbed} from "../../core/generators/core.generator.embed";

export class GameUI extends ModuleBaseUI {
    public readyEmbed(gameEntityReady: GameEntityReady): EmbedBuilder[] {
        return CoreGeneratorEmbed.getSingle(
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
        return CoreGeneratorEmbed.getSingle(
            gameEntityReady.header,
            "#5865F2",
            gameEntityReady.descriptions[0],
            [],
            gameEntityReady.author.tag,
            gameEntityReady.author.avatarURL()
        );
    }

    public resultEmbed(
        game: Game, title: string,
        unknownResultDescription: string,
        isTimeout: boolean, timeoutDescription: string
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
            description += "\n" + gameTeamers.entityCaptains.getContent();
        }

        return CoreGeneratorEmbed.getSingle(
            title,
            (isTimeout) ? "#FFFFFF" : "#5865F2",
            description,
            [],
            game.interaction.user.tag,
            game.interaction.user.avatarURL()
        );
    }

    public gameReadyButton(labels: string[]): ActionRowBuilder<ButtonBuilder>[] {
        return CoreGeneratorButton.getList(
            labels,
            ["⚡", "✖️"],
            [ButtonStyle.Primary, ButtonStyle.Danger],
            ["game-ready", "game-delete"]
        );
    }
}
