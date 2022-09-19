import {Discord, Slash, SlashOption} from "discordx";
import {ApplicationCommandOptionType, CommandInteraction} from "discord.js";
import {MiscellaneousService} from "./miscellaneous.service";

@Discord()
export abstract class MiscellaneousInteractions {
    miscellaneousService: MiscellaneousService = new MiscellaneousService();

    @Slash("random", { description: "Random number from 1 to N" })
    public async random(
        @SlashOption("n-value", { type: ApplicationCommandOptionType.Number, description: "Max value", required: true }) n: number,
        interaction: CommandInteraction
    ) { await this.miscellaneousService.random(interaction, n); }

    @Slash("coin", {description: "Flip coin"})
    public async coin(
        interaction: CommandInteraction
    ) { await this.miscellaneousService.coin(interaction); }

    @Slash("vote", {description: "Start local vote"})
    public async vote(
        @SlashOption("vote-text", {type: ApplicationCommandOptionType.String, description: "subject of your vote", required: true}) voteContent: string,
        interaction: CommandInteraction
    ) { await this.miscellaneousService.vote(interaction, voteContent); }
}
