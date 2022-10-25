import axios from "axios";
import {DecorateAll} from "decorate-all";
import {SafeRequest} from "../utils/decorators/utils.decorators.SafeRequest";
import * as dotenv from "dotenv";
dotenv.config({path: 'general.env'});

@DecorateAll(SafeRequest)
export class RequestsDiscordConnections {
    private discordAuthorizationTokenUrl: string = 'https://discord.com/api/oauth2/token';
    private discordUserIDUrl: string = 'https://discord.com/api/users/@me';
    private discordUserConnectionsUrl: string = 'https://discord.com/api/users/@me/connections';

    public async getDiscordAuthorizationToken(specialCode: string): Promise<string|null> {
        let discordSendData = {
            client_id: process.env.OAUTH2_BOT_CLIENT_ID as string,
            client_secret: process.env.OAUTH2_BOT_SECRET as string,
            grant_type: 'authorization_code',
            code: specialCode,
            redirect_uri: process.env.OAUTH2_REDIRECT_URI_FOR_TOKEN as string,
            scope: 'identify',
        };
        let {data, status} = await axios.post<any>(
            this.discordAuthorizationTokenUrl,
            new URLSearchParams(discordSendData),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
        );
        return `${data?.token_type} ${data?.access_token}` || null;
    }

    public async getDiscordUserID(authorizationToken: string): Promise<string|null> {
        let {data, status} = await axios.get<any>(this.discordUserIDUrl, {headers: {authorization: authorizationToken}});
        return data?.id || null;
    }

    public async getDiscordConnectedSteam(authorizationToken: string): Promise<string|null> {
        let {data, status} = await axios.get<any>(this.discordUserConnectionsUrl, {headers: {authorization: authorizationToken}});
        return data.filter( (x: any) => {return x.type == 'steam'} )[0].id || null;
    }
}
