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
        interaction: CommandInteraction
    ) { await this.gameService.ffa(interaction, usersInclude, usersExclude); }

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
        interaction: CommandInteraction
    ) { await this.gameService.teamers(interaction, usersInclude, usersExclude); }
}

@Discord()
export abstract class GameInteractions {
    private gameService: GameService = new GameService();

    @ButtonComponent({id: "game-ready"})
    public async buttonReady(
        interaction: ButtonInteraction
    ) { await this.gameService.buttonReady(interaction); }

    @ButtonComponent({id: "game-delete"})
    public async buttonDelete(
        interaction: ButtonInteraction
    ) { await this.gameService.buttonDelete(interaction); }

    @ButtonComponent({id: "game-skip"})
    public async buttonSkip(
        interaction: ButtonInteraction
    ) { await this.gameService.buttonSkip(interaction); }
}
