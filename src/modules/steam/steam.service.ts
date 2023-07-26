import {ModuleBaseService} from "../base/base.service";
import {CommandInteraction} from "discord.js";
import {SteamUI} from "./steam.ui";
import {SteamAPIData} from "../../types/type.SteamAPIData";
import {DatabaseServiceUserSteam} from "../../database/services/service.UserSteam";
import {UserSteam} from "../../types/type.UserSteam";
import {RequestsSteam} from "../../requests/requests.steam";
import * as dotenv from "dotenv";
dotenv.config({path: 'general.env'});

export class SteamService extends ModuleBaseService {
    private steamUI: SteamUI = new SteamUI();
    private databaseServiceUserSteam: DatabaseServiceUserSteam = new DatabaseServiceUserSteam();
    private requestsSteam: RequestsSteam = new RequestsSteam();

    async link(interaction: CommandInteraction, customDescription: string) {
        let gameIDArray: string[] = ["289070", "480"];
        let textStringsError: string[] = await this.getManyText(interaction,
            ["BASE_ERROR_TITLE", "STEAM_LINK_ERROR_NO_STEAM_DATA",
            "STEAM_LINK_ERROR_WRONG_GAME"]
        );

        let discordID: string = interaction.user.id;
        let userSteam: UserSteam | null = await this.databaseServiceUserSteam.getOne(discordID);
        if(userSteam === null)
            return this.connect(interaction);
        let steamAPIData: SteamAPIData | null = await this.requestsSteam.getSteamLinkData(userSteam.steamID);
        if((steamAPIData === null) || (steamAPIData.gameID === undefined))
            return interaction.reply({embeds: this.steamUI.error(textStringsError[0], textStringsError[1]), ephemeral: true});
        if(gameIDArray.indexOf(steamAPIData.gameID as string) === -1)
            return interaction.reply({embeds: this.steamUI.error(textStringsError[0], textStringsError[2]), ephemeral: true});
        let link: string = `http://51.68.123.207:31612/join/${steamAPIData.gameID}/${steamAPIData.lobbySteamID}/${steamAPIData.steamID}`;

        let textStrings: string[] = await this.getManyText(interaction, [
            "STEAM_LINK_TITLE", "STEAM_LINK_DESCRIPTION_BASE",
            "STEAM_LINK_DESCRIPTION_PIRATE", "STEAM_LINK_FIELD_TITLE",
        ]);;
        let description: string = `**[${textStrings[1]}](${link})**`;
        if(steamAPIData.gameID === gameIDArray[1])
            description += ("\n" + textStrings[2]);

        interaction.reply({ embeds: [this.steamUI.link(
            textStrings[0],
            description,
            textStrings[3],
            customDescription,
            interaction.user
        )[0].setURL(link)]});
    }

    async connect(interaction: CommandInteraction) {
        let textStrings: string[] = await this.getManyText(interaction, [
            "STEAM_CONNECT_TITLE", "STEAM_CONNECT_DESCRIPTION",
            "STEAM_CONNECT_BUTTON_LABEL", "STEAM_CONNECT_BUTTON_EMOJI"
        ]);

        interaction.reply({
            embeds: this.steamUI.connectEmbed(textStrings[0], textStrings[1]),
            components: this.steamUI.connectButton(textStrings[2], textStrings[3], process.env.OAUTH2_REDIRECT_LINK as string),
            ephemeral: true
        });
    }
}
