import {CommandInteraction} from "discord.js";
import {BotlibEmbeds, signEmbed} from "../../botlib/botlib.embeds";
import {SteamEmbeds} from "./steam.embeds";
import {SteamButtons} from "./buttons/steam.buttons";
import {SteamConfig} from "./steam.config";
import {RequestsUserSteam} from "../../connection/requests/requests.userSteam";
import {UserSteam} from "../../dto/userSteam";

export class SteamService {
    botlibEmbeds: BotlibEmbeds = new BotlibEmbeds();
    steamEmbeds: SteamEmbeds = new SteamEmbeds();
    steamConfig: SteamConfig = new SteamConfig();
    steamButtons: SteamButtons = new SteamButtons();
    requestsUserSteam: RequestsUserSteam = new RequestsUserSteam();

    private static _instance: SteamService;
    private constructor() {}
    public static get Instance(){
        return this._instance || (this._instance = new this());
    }

    private getSteamAPIURL(steamID: string): string {
        return `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_KEY}&format=json&steamids=${steamID}`;
    }

    private getLobbyLinkURL(gameID: string, lobbyID: string, steamID: string): string {
        return `steam://joinlobby/${gameID}/${lobbyID}/${steamID}`;
    }

    // 1) Нужно проверять игру 480 / 289070
    // 2) не поддерживает URI steam://, придётся использовать components: this.connectionButtons.linkButton(steamLobbyURL, isLicense)
    async getLobbyLink(interaction: CommandInteraction, description: string){
        let userData: UserSteam = await this.requestsUserSteam.getOne(interaction.user.id);

        if(userData.steamID == null)
            return this.getConnect(interaction);

        let steamAPIURL = this.getSteamAPIURL(userData.steamID);
        let steamData = await this.requestsUserSteam.getDataSteamAPI(steamAPIURL);
        steamData = steamData.response.players[0];

        if(!steamData.lobbysteamid)
            return await interaction.reply({embeds: this.botlibEmbeds.error(`Ошибка при получении ссылки на лобби. Возможные причины:
            - вы не создали игровое лобби;
            - ваш профиль Steam "не в сети";
            - настройки приватности профиля Steam не позволяют получить ссылку на лобби.
            `), ephemeral: true});
        if(!(steamData.gameid == this.steamConfig.headerPirate || steamData.gameid == this.steamConfig.headerLicense))
            return await interaction.reply({embeds: this.botlibEmbeds.error("Вы играете в неподходящую игру для генерации ссылки."), ephemeral: true});
        let isLicense: boolean = (steamData.gameid == this.steamConfig.headerLicense);

        let steamLobbyURL: string = this.getLobbyLinkURL(steamData.gameid, steamData.lobbysteamid, steamData.steamid);
        await interaction.reply({embeds: signEmbed(interaction, this.steamEmbeds.link(steamLobbyURL, isLicense, description)),});
    }

    async getConnect(interaction: CommandInteraction){
        await interaction.reply({
            embeds: [this.steamEmbeds.connect()],
            components: this.steamButtons.connectButton(process.env.OAUTH2_REDIRECT_LINK as string),
            ephemeral: true
        });
    }
}
