import axios from "axios";
import {UserSteam} from "../../dto/userSteam";
import {GetUserSteam} from "../../dto/getUserSteam";
import * as dotenv from "dotenv";

dotenv.config({path: ".env"});

export class RequestsUserSteam {
    private dbURL = `http://${process.env.DATABASE_HOSTNAME}:${process.env.DATABASE_PORT}`;

    async getOne(id: string): Promise<UserSteam> {
        let getData: GetUserSteam = {id: id};
        let {data, status} = await axios.get<UserSteam>(
            this.dbURL + `/steam`,
            {data: getData}
        );
        return data;
    }

    // Формат объекта слишком большой для описания,
    // поэтому используется тип any.
    // Steam Web API гарантирует объекты
    // с необходимыми свойствами.
    async getDataSteamAPI(url: string): Promise<any>{
        let {data, status} = await axios.get<UserSteam>(url);
        return data;
    }
}
