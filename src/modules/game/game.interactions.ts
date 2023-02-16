import {ButtonComponent, Discord, Slash, SlashGroup, SlashOption} from "discordx";
import {ApplicationCommandOptionType, ButtonInteraction, CommandInteraction} from "discord.js";
import {GameService} from "./game.service";

@Discord()
@SlashGroup({name: "new", description: "Votes for game"})
@SlashGroup("new")
export abstract class GameInteractionsGrouped {
    private gameService: GameService = new GameService();

    @Slash({ name: "ffa", description: "Vote for new FFA game" })
    public async ffa(
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
        @SlashOption({
            name: "only",
            description: "set only input players and you to the vote",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.gameService.ffa(interaction, usersInclude, usersExclude, usersOnly); }

    @Slash( { name: "teamers", description: "Vote for new Teamers game" })
    public async teamers(
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
        @SlashOption({
            name: "only",
            description: "set only input players and you to the vote",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.gameService.teamers(interaction, usersInclude, usersExclude, usersOnly); }
}

@Discord()
@SlashGroup({name: "new-short", description: "Short new game vote with draft only"})
@SlashGroup("new-short")
export abstract class DraftVoteInteractionsGrouped {
    private gameService: GameService = new GameService();

    @Slash({ name: "ffa", description: "Short vote for new FFA game" })
    public async newShortFFA(
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
        @SlashOption({
            name: "only",
            description: "set only input players and you to the vote",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.gameService.ffa(interaction, usersInclude, usersExclude, usersOnly, true); }

    @Slash( { name: "teamers", description: "Short vote for new Teamers game" })
    public async newShortTeamers(
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
        @SlashOption({
            name: "only",
            description: "set only input players and you to the vote",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.gameService.teamers(interaction, usersInclude, usersExclude, usersOnly, true); }
}

@Discord()
export abstract class GameInteractions {
    private gameService: GameService = new GameService();

    @ButtonComponent({id: "game-ready"})
    public async buttonReady(
        interaction: ButtonInteraction
    ) { this.gameService.buttonReady(interaction); }

    @ButtonComponent({id: "game-delete"})
    public async buttonDelete(
        interaction: ButtonInteraction
    ) { this.gameService.buttonDelete(interaction); }

    @ButtonComponent({id: "game-skip"})
    public async buttonSkip(
        interaction: ButtonInteraction
    ) { this.gameService.buttonSkip(interaction); }
}
