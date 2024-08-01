import axios from "axios";
import {SafeRequest} from "../utils/decorators/utils.decorators.SafeRequest";
import { RequestResponseSplit } from "../types/type.RequestResponseSplit";

export class RequestsSplit {
    private serverURL: string = "http://localhost:3002/split"

    @SafeRequest
    public async getRatings(guildID: string, usersID: string[]): Promise<number[]>{
        let {data, status} = await axios.post<RequestResponseSplit>(this.serverURL, {
            guildID: guildID,
            usersID: usersID
        });
        return data.ratings || [];
    }
}
