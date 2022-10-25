import {Router} from "express";
import {DatabaseServiceUserSteam} from "../../database/services/service.UserSteam";
import {RequestsDiscordConnections} from "../../requests/requests.discordConnections";

// Возвращает объект типа RequestResponseUserSteam
export const routerSteam: Router = Router();
routerSteam.post('/', async (req, res) => {
    let requestsDiscordConnections: RequestsDiscordConnections = new RequestsDiscordConnections();
    let databaseServiceUserSteam: DatabaseServiceUserSteam = new DatabaseServiceUserSteam();
    let code: string = req?.body?.code || "";

    let authorizationToken: string | null = await requestsDiscordConnections.getDiscordAuthorizationToken(code);
    if(authorizationToken === null)
        return res.send({status: "error_unknown", discordID: null, steamID: null});

    let discordID: string | null = await requestsDiscordConnections.getDiscordUserID(authorizationToken);
    if(discordID === null)
        return res.send({status: "error_incorrect", discordID: null, steamID: null});

    let steamID: string | null = await requestsDiscordConnections.getDiscordConnectedSteam(authorizationToken);
    if(steamID == null)
        return res.send({status: "error_no_steam", discordID: null, steamID: null});

    let isUserSteamExists: boolean = await databaseServiceUserSteam.isExists(discordID);
    await databaseServiceUserSteam.insertOne({
        discordID: discordID,
        steamID: steamID
    });
    return res.send(
        {status: isUserSteamExists ? "success_update" : "success_add", discordID: discordID, steamID: steamID}
    );
});
