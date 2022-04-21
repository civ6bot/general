import {Discord, Slash, SlashOption} from "discordx";
import {SteamService} from "./steam.service";
import {CommandInteraction} from "discord.js";

@Discord()
export abstract class SteamCommands {
    steamService: SteamService = SteamService.Instance;

    @Slash("link", { description: "Получить ссылку на лобби" })
    async link(
        @SlashOption("описание", { required: false }) description: string = "",
        interaction: CommandInteraction
    ){ await this.steamService.getLobbyLink(interaction, description); }

    @Slash("connect", {description: "Подключить Steam к профилю"})
    async connect(interaction: CommandInteraction){ await this.steamService.getConnect(interaction); }
}
