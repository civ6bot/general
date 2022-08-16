import axios from "axios";
import {RequestsBase} from "./requests.base";
import {UserSteam} from "../types/type.UserSteam";
import {DecorateAll} from "decorate-all";
import {SafeRequest} from "../core/decorators/core.decorators.SafeRequest";

// noinspection HttpUrlsUsage
@DecorateAll(SafeRequest)
export class RequestsUserSteam extends RequestsBase {
    override requestPath = `http://${process.env.DATABASE_HOSTNAME}:${process.env.DATABASE_PORT}/steam`; // external database

    public async getOne(discordID: string): Promise<UserSteam|null> {
        let {data, status} = await axios.get<UserSteam>(
            this.requestPath,
            {data: { discordID: discordID}}
        );
        return data || null;
    }

    public async isExists(discordID: string): Promise<boolean|null> { return Boolean(this.getOne(discordID)); }

    public async putOne(userSteam: UserSteam): Promise<UserSteam> {
        let {data, status} = await axios.put<UserSteam>(
            this.requestPath,
            { data: userSteam }
        );
        return data;
    }
}
