import axios from "axios";
import {RequestsBase} from "./requests.base";
import {EntityConfig} from "../database/entities/entity.Config";
import {DecorateAll} from "decorate-all";
import {SafeRequest} from "../core/decorators/core.decorators.SafeRequest";

@DecorateAll(SafeRequest)
export class RequestsConfig extends RequestsBase {
    override requestPath = this.dbURL + "/config";

    public async get(guildID: string): Promise<EntityConfig[]|null> {
        let {data, status} = await axios.get<EntityConfig[]|null>(
            this.requestPath,
            {data: { guildID: guildID }}     // не нужно создавать тип с 1 полем?
        );
        return data as EntityConfig[] || null;
    }

    public async put(entitiesConfig: EntityConfig[]): Promise<EntityConfig[]|null> {
        let {data, status} = await axios.put<EntityConfig[]>(
            this.requestPath,
            {data: entitiesConfig}
        );
        return data || null;
    }
}
