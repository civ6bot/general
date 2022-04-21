import {Discord, Slash, SlashOption} from "discordx";
import {CommandInteraction} from "discord.js";
import {MiscellaneousService} from "./miscellaneous.service";

@Discord()
export abstract class MiscellaneousCommands {
    miscellaneousService: MiscellaneousService = MiscellaneousService.Instance;

    @Slash("random", { description: "Случайное число от 1 до N" })
    async random(
        @SlashOption("число", { type: "INTEGER", description: "Верхняя граница", required: true }) n: number,
        interaction: CommandInteraction
    ) { await this.miscellaneousService.getRandom(interaction, n); }

    @Slash("flip", { description: "Подбросить монетку"})
    async coin(interaction: CommandInteraction){ await this.miscellaneousService.flipCoin(interaction); }

    @Slash("vote", {description: "Запустить опрос"})
    async vote(
        @SlashOption("опрос", {type: "STRING", description: "содержание", required: true}) voteContent: string,
        interaction: CommandInteraction
    ) { await this.miscellaneousService.getVote(interaction, voteContent) }
}
