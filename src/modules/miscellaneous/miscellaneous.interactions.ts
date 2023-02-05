import {ButtonComponent, Discord, Slash, SlashOption} from "discordx";
import {ApplicationCommandOptionType, ButtonInteraction, CommandInteraction} from "discord.js";
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

    @Slash({name: "vote-secret", description: "Start secret vote - yes/no"})
    public async closeVote(
        @SlashOption({
            name: "vote-text",
            description: "subject of your vote",
            type: ApplicationCommandOptionType.String,
            required: true
        }) voteContent: string,
        @SlashOption({
            name: "include",
            description: "add players to vote",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersInclude: string = "",
        @SlashOption({
            name: "exclude",
            description: "remove players from vote",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersExclude: string = "",
        interaction: CommandInteraction
    ) { this.miscellaneousService.voteSecret(interaction, voteContent, usersInclude, usersExclude); }

    @ButtonComponent({id: /secretvote-\d+-\d+-delete/})      // `secretVote-guildID-authorID-delete
    public async voteSecretButtonDelete(
        interaction: ButtonInteraction
    ) { this.miscellaneousService.voteSecretButtonDelete(interaction); }

    @ButtonComponent({id: /secretvote-\d+-\d+-yes/})      // `secretVote-guildID-authorID-yes
    public async voteSecretButtonVoteYes(
        interaction: ButtonInteraction
    ) { this.miscellaneousService.voteSecretButtonVote(interaction, 1); }

    @ButtonComponent({id: /secretvote-\d+-\d+-abstained/})      // `secretVote-guildID-authorID-abstained
    public async voteSecretButtonVoteAbstained(
        interaction: ButtonInteraction
    ) { this.miscellaneousService.voteSecretButtonVote(interaction, 2); }

    @ButtonComponent({id: /secretvote-\d+-\d+-no/})      // `secretVote-guildID-authorID-no
    public async voteSecretButtonVoteNo(
        interaction: ButtonInteraction
    ) { this.miscellaneousService.voteSecretButtonVote(interaction, -1); }
}
