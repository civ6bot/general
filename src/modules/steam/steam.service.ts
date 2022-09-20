import {ModuleBaseService} from "../base/base.service";
import {CommandInteraction} from "discord.js";
import {SteamUI} from "./steam.ui";
import {SafeModuleServiceDeferReply} from "../../core/decorators/core.decorators.SaveModuleServiceDeferReply";
import {RequestsSteam} from "../../requests/requests.steam";
import {SteamAPIData} from "../../types/type.SteamAPIData";
import {RequestsUserSteam} from "../../requests/requests.UserSteam";
import {UserSteam} from "../../types/type.UserSteam";

export class SteamService extends ModuleBaseService {
    private steamUI: SteamUI = new SteamUI();
    private requestsUserSteam: RequestsUserSteam = new RequestsUserSteam();
    private requestsSteam: RequestsSteam = new RequestsSteam();

    @SafeModuleServiceDeferReply()
    async link(interaction: CommandInteraction, description: string) {
        let gameIDArray: string[] = ["289070", "480"];
        let textStringsError: string[] = await this.getManyText(interaction,
            ["BASE_ERROR_TITLE", "STEAM_LINK_ERROR_NO_STEAM_DATA",
            "STEAM_LINK_ERROR_WRONG_GAME"]
        );

        let discordID: string = interaction.user.id;
        let userSteam: UserSteam | null = await this.requestsUserSteam.getOne(discordID);
        if(userSteam === null)
            return this.connect(interaction);
        let steamAPIData: SteamAPIData | null = await this.requestsSteam.getSteamLinkData(userSteam.steamID);
        if((steamAPIData === null))
            return interaction.editReply({embeds: this.steamUI.error(textStringsError[0], textStringsError[1])});
        if(steamAPIData.gameID === undefined)
            return interaction.editReply({embeds: this.steamUI.error(textStringsError[0], textStringsError[1])});
        if(gameIDArray.indexOf(steamAPIData.gameID as string) === -1)
            return interaction.editReply({embeds: this.steamUI.error(textStringsError[0], textStringsError[2])});
        let link: string = `steam://joinlobby/${steamAPIData.gameID}/${steamAPIData.lobbySteamID}/${steamAPIData.steamID}`;

        let textStrings: string[] = await this.getManyText(interaction, [
            "STEAM_LINK_TITLE", "STEAM_LINK_DESCRIPTION_LICENSE",
            "STEAM_LINK_DESCRIPTION_PIRATE", "STEAM_LINK_FIELD_TITLE",
        ], [null, [link], [link]]);
        await interaction.editReply({ embeds: this.steamUI.link(
            textStrings[0],
                steamAPIData.gameID === gameIDArray[0]
                ? textStrings[1]
                    : textStrings[2],
                textStrings[3],
                description
            )});
    }

    async connect(interaction: CommandInteraction) {
        let textStrings: string[] = await this.getManyText(interaction, [
            "STEAM_CONNECT_TITLE", "STEAM_CONNECT_DESCRIPTION",
            "STEAM_CONNECT_BUTTON_LABEL", "STEAM_CONNECT_BUTTON_EMOJI"
        ]);

        await interaction.reply({
            embeds: this.steamUI.connectEmbed(textStrings[0], textStrings[1]),
            components: this.steamUI.connectButton(textStrings[2], textStrings[3], process.env.OAUTH2_REDIRECT_LINK as string)
        });
    }
}
