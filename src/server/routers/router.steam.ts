import {Router} from "express";
import {RequestsDiscordConnections} from "../../requests/requests.discordConnections";
import {RequestsUserSteam} from "../../requests/requests.UserSteam";
import {RequestResponseUserSteam} from "../../types/type.RequestResponseUserSteam";

export const routerSteam: Router = Router();
routerSteam.post('/', async (req, res) => {
    let getRequestResponse: Function = async (): Promise<RequestResponseUserSteam> => {
        try {
            let requestsDiscordConnections: RequestsDiscordConnections = new RequestsDiscordConnections();
            let requestsUserSteam: RequestsUserSteam = new RequestsUserSteam();
            let code: string = req.body.code;

            let authorizationToken: string | null = await requestsDiscordConnections.getDiscordAuthorizationToken(code);
            if(authorizationToken === null)
                return {status: "error_unknown", discordID: null, steamID: null};

            let discordID: string | null = await requestsDiscordConnections.getDiscordUserID(authorizationToken);
            if(discordID === null)
                return {status: "error_incorrect", discordID: null, steamID: null};

            let steamID: string | null = await requestsDiscordConnections.getDiscordConnectedSteam(authorizationToken);
            if(steamID == null)
                return {status: "error_no_steam", discordID: null, steamID: null};

            let isUserSteamExists: boolean|null = await requestsUserSteam.isExists(discordID);
            if(isUserSteamExists === null)
                isUserSteamExists = false;
            await requestsUserSteam.putOne({
                discordID: discordID,
                steamID: steamID
            });
            return {
                status: isUserSteamExists ? "success_update" : "success_add",
                discordID: discordID,
                steamID: steamID
            };
        } catch {
            return {status: "error_unknown", discordID: null, steamID: null};
        }
    }

    res.send(await getRequestResponse());
});
