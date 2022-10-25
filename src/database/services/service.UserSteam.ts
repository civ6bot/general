import {EntityUserSteam} from "../entities/entity.UserSteam";
import {EntityManager} from "typeorm";
import {outerDataSource} from "../database.datasources";

export class DatabaseServiceUserSteam {
    protected outerDatabase: EntityManager = outerDataSource.manager;

    public async getOne(discordID: string): Promise<EntityUserSteam|null> {
        return await this.outerDatabase.findOne(EntityUserSteam, { where: {
            discordID: discordID
        }});
    }

    public async insertOne(userSteam: EntityUserSteam): Promise<EntityUserSteam>{
        return await this.outerDatabase.save(EntityUserSteam, userSteam);
    }

    public async isExists(discordID: string): Promise<boolean> { return Boolean(await this.getOne(discordID)); }
}
