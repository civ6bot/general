import {EntityUserSteam} from "../entities/entity.UserSteam";
import {EntityManager} from "typeorm";
import {dataSource} from "../database.datasource";

export class DatabaseServiceUserSteam {
    protected database: EntityManager = dataSource.manager;

    public async getOne(discordID: string): Promise<EntityUserSteam|null> {
        return await this.database.findOne(EntityUserSteam, { where: {
            discordID: discordID
        }});
    }

    public async insertOne(userSteam: EntityUserSteam): Promise<EntityUserSteam>{
        return await this.database.save(EntityUserSteam, userSteam);
    }

    public async isExists(discordID: string): Promise<boolean> { 
        return Boolean(await this.getOne(discordID)); 
    }
}
