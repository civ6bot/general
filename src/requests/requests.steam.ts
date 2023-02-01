import axios from "axios";
import {SteamAPIData} from "../types/type.SteamAPIData";
import {SafeRequest} from "../utils/decorators/utils.decorators.SafeRequest";

export class RequestsSteam {
    private steamAPIUrl_NoSteamID = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_KEY}&format=json&steamids=`;
    // Формат объекта слишком большой для описания (Steam API Docs),
    // поэтому выбираются отдельные свойства объекта типа any.
    // Steam Web API гарантирует объекты с необходимыми свойствами.
    @SafeRequest
    public async getSteamLinkData(steamID: string): Promise<SteamAPIData|null>{
        let {data, status} = await axios.get<any>(this.steamAPIUrl_NoSteamID + steamID);
        return {
            steamID: data.response.players[0].steamid as string,            // as string
            lobbySteamID: data.response.players[0].lobbysteamid as string,  // из-за неопределённого типа,
            gameID: data.response.players[0].gameid as string               // возвращаемого из API
        }
    }
}
