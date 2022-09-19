import {ButtonComponent, Discord, Slash, SlashGroup} from "discordx";
import {ButtonInteraction, CommandInteraction} from "discord.js";
import {GameService} from "./game.service";

@Discord()
@SlashGroup({name: "new"})
@SlashGroup("new")
export abstract class GameInteractionsGrouped {
    private gameService: GameService = new GameService();

    @Slash("ffa", { description: "Vote for new FFA game" })
    public async ffa(
        interaction: CommandInteraction
    ) { await this.gameService.ffa(interaction); }

    @Slash("teamers", { description: "Vote for new Teamers game" })
    public async teamers(
        interaction: CommandInteraction
    ) { await this.gameService.teamers(interaction); }
}

@Discord()
export abstract class GameInteractions {
    private gameService: GameService = new GameService();

    @ButtonComponent(/game-ready/)
    public async buttonReady(
        interaction: ButtonInteraction
    ) { await this.gameService.buttonReady(interaction); }

    @ButtonComponent(/game-delete/)
    public async buttonDelete(
        interaction: ButtonInteraction
    ) { await this.gameService.buttonDelete(interaction); }
}
