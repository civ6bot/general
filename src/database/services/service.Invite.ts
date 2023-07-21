import { EntityManager } from "typeorm";
import { EntityInvite } from "../entities/entity.Invite";
import { outerDataSource } from "../database.datasources";

export class DatabaseServiceInvite {
    protected outerDatabase: EntityManager = outerDataSource.manager;
    
    public async insertOne(entityInvite: EntityInvite): Promise<EntityInvite> {
        return await this.outerDatabase.save(EntityInvite, entityInvite);
    }

    public async getOne(guildID: string): Promise<EntityInvite|null> {
        return await this.outerDatabase.findOne(EntityInvite, { where: {
            guildID: guildID
        }});
    }
}
