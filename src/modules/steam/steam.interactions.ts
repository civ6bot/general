import {Discord, Slash, SlashOption} from "discordx";
import {SteamService} from "./steam.service";
import {ApplicationCommandOptionType, CommandInteraction} from "discord.js";

@Discord()
export abstract class SteamInteractions {
    steamService: SteamService = new SteamService();

    @Slash( { name: "link", description: "Get your lobby link" })
    async link(
        @SlashOption({
            name: "description",
            description: "additional info for your link",
            type: ApplicationCommandOptionType.String,
            required: false
        }) description: string = "",
        interaction: CommandInteraction
    ){ this.steamService.link(interaction, description); }

    @Slash({name: "connect", description: "Connect your Steam to Civ6bot"})
    async connect(
        interaction: CommandInteraction
    ){ this.steamService.connect(interaction); }
}
