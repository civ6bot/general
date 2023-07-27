import {EntityManager} from "typeorm";
import {EntityInvite} from "../entities/entity.Invite";
import {dataSource} from "../database.datasource";

export class DatabaseServiceInvite {
    protected database: EntityManager = dataSource.manager;
    
    public async insertOne(entityInvite: EntityInvite): Promise<EntityInvite> {
        return await this.database.save(EntityInvite, entityInvite);
    }

    public async getOne(guildID: string): Promise<EntityInvite|null> {
        return await this.database.findOne(EntityInvite, { where: {
            guildID: guildID
        }});
    }
}
