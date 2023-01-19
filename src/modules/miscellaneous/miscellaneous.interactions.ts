import {Discord, Slash, SlashOption} from "discordx";
import {ApplicationCommandOptionType, CommandInteraction} from "discord.js";
import {MiscellaneousService} from "./miscellaneous.service";

@Discord()
export abstract class MiscellaneousInteractions {
    miscellaneousService: MiscellaneousService = new MiscellaneousService();

    @Slash({name: "random", description: "Random number from 1 to N" })
    public async random(
        @SlashOption({
            name: "max-value",
            description: "Max value",
            type: ApplicationCommandOptionType.Number,
            required: false
        }) n: number = NaN,
        interaction: CommandInteraction
    ) { this.miscellaneousService.random(interaction, n); }

    @Slash({name: "coin", description: "Flip coin"})
    public async coin(
        interaction: CommandInteraction
    ) { this.miscellaneousService.coin(interaction); }

    @Slash({name: "vote", description: "Start vote - yes/no"})
    public async vote(
        @SlashOption({
            name: "vote-text",
            description: "subject of your vote",
            type: ApplicationCommandOptionType.String,
            required: true
        }) voteContent: string,
        interaction: CommandInteraction
    ) { this.miscellaneousService.vote(interaction, voteContent); }
}
