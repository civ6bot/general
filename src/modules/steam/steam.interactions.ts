import {Discord, Slash, SlashOption} from "discordx";
import {SteamService} from "./steam.service";
import {ApplicationCommandOptionType, CommandInteraction} from "discord.js";

@Discord()
export abstract class SteamInteractions {
    steamService: SteamService = new SteamService();

    @Slash("link", { description: "Get your lobby link" })
    async link(
        @SlashOption("описание", { required: false }) description: string = "",
        interaction: CommandInteraction
    ){ await this.steamService.link(interaction, description); }

    @Slash("connect", {description: "Connect your Steam to civ6bot"})
    async connect(interaction: CommandInteraction){ await this.steamService.connect(interaction); }
}
