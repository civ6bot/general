import {Discord, Slash, SlashOption} from "discordx";
import {ApplicationCommandOptionType, CommandInteraction} from "discord.js";
import {MiscellaneousService} from "./miscellaneous.service";

@Discord()
export abstract class MiscellaneousInteractions {
    miscellaneousService: MiscellaneousService = new MiscellaneousService();

    @Slash("random", { description: "Случайное число от 1 до N" })
    public async random(
        @SlashOption("число", { type: ApplicationCommandOptionType.Number, description: "Максимальное значение", required: true }) n: number,
        interaction: CommandInteraction
    ) { await this.miscellaneousService.random(interaction, n); }

    @Slash("coin", {description: "Подбросить монетку"})
    public async coin(
        interaction: CommandInteraction
    ) { await this.miscellaneousService.coin(interaction); }

    @Slash("vote", {description: "Запустить опрос"})
    public async vote(
        @SlashOption("опрос", {type: ApplicationCommandOptionType.String, description: "содержание", required: true}) voteContent: string,
        interaction: CommandInteraction
    ) { await this.miscellaneousService.vote(interaction, voteContent); }
}
