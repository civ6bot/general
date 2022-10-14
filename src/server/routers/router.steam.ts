import {Router} from "express";
import {DatabaseServiceUserSteam} from "../../database/services/service.UserSteam";
import {RequestsDiscordConnections} from "../../requests/requests.discordConnections";
import {RequestResponseUserSteam} from "../../types/type.RequestResponseUserSteam";

// Этот маршрут необходим, чтобы сайт посылал сюда запрос и возвращал
// пользователю ответ. Вообще, необходимо это переделать на PHP со стороны сайта.
export const routerSteam: Router = Router();
routerSteam.post('/', async (req, res) => {
    let getRequestResponse: Function = async (): Promise<RequestResponseUserSteam> => {
        try {
            let requestsDiscordConnections: RequestsDiscordConnections = new RequestsDiscordConnections();
            let databaseServiceUserSteam: DatabaseServiceUserSteam = new DatabaseServiceUserSteam();
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

            let isUserSteamExists: boolean|null = await databaseServiceUserSteam.isExists(discordID);
            if(isUserSteamExists === null)
                isUserSteamExists = false;
            await databaseServiceUserSteam.insertOne({
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
