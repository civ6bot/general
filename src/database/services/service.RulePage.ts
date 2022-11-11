import {EntityRulePage} from "../entities/entity.RulePage";
import {EntityManager, Like, MoreThanOrEqual} from "typeorm";
import {outerDataSource} from "../database.datasources";

export class DatabaseServiceRulePage {
    protected outerDatabase: EntityManager = outerDataSource.manager;

    private async getMoreOrEqualPageNumber(guildID: string, pageNumber: number): Promise<EntityRulePage[]> {
        return await this.outerDatabase.find(EntityRulePage, {
            where: {
                guildID: guildID,
                pageNumber: MoreThanOrEqual(pageNumber)
            },
            order: {pageNumber: "asc"}
        })
    }

    public async getOneByPageNumber(guildID: string, pageNumber: number): Promise<EntityRulePage|null> {
        return await this.outerDatabase.findOne(EntityRulePage, { where: {
                guildID: guildID,
                pageNumber: pageNumber
            }});
    }

    public async getOneByTag(guildID: string, tag: string): Promise<EntityRulePage|null> {
        if(tag === "")
            return null;
        return await this.outerDatabase.findOne(EntityRulePage, { where: {
                guildID: guildID,
                tags: Like(`%${tag}%`)
            }});
    }

    public async getAll(guildID: string): Promise<EntityRulePage[]> {
        return await this.outerDatabase.find(EntityRulePage, {
            where: {guildID: guildID},
            order: {pageNumber: "asc"}
        });
    }

    public async getAllLength(guildID: string): Promise<number> {
        return (await this.getAll(guildID)).length;
    }

    public async insertOne(entityRulePage: EntityRulePage): Promise<EntityRulePage> {
        let shiftEntities: EntityRulePage[] = await this.getMoreOrEqualPageNumber(entityRulePage.guildID, entityRulePage.pageNumber);
        shiftEntities.forEach(entity => entity.pageNumber += 1);
        await this.update(shiftEntities);
        return (await this.update(entityRulePage))[0];
    }

    public async update(entityRulePage: EntityRulePage|EntityRulePage[]): Promise<EntityRulePage[]>{
        return await this.outerDatabase.save(
            EntityRulePage,
            Array.isArray(entityRulePage)
                ? entityRulePage
                : [entityRulePage]
        );
    }

    public async removeOne(entityRulePage: EntityRulePage): Promise<EntityRulePage|null> {
        let shiftEntities: EntityRulePage[] = await this.getMoreOrEqualPageNumber(entityRulePage.guildID, entityRulePage.pageNumber);
        let removeEntity: EntityRulePage | undefined = shiftEntities.shift();

        if(!removeEntity)
            return null;

        shiftEntities.forEach(entity => entity.pageNumber -= 1);
        await this.update(shiftEntities);
        return await this.outerDatabase.remove(removeEntity);
    }

    public async shiftLeft(entityRulePage: EntityRulePage): Promise<EntityRulePage> {
        if(entityRulePage.pageNumber === 1)
            return entityRulePage;
        let swapEntityRulePage: EntityRulePage|null = await this.getOneByPageNumber(entityRulePage.guildID, entityRulePage.pageNumber-1);
        if(swapEntityRulePage === null)
            return entityRulePage;
        entityRulePage.pageNumber -= 1;
        swapEntityRulePage.pageNumber += 1;
        await this.update([entityRulePage, swapEntityRulePage]);
        return entityRulePage;
    }

    public async shiftRight(entityRulePage: EntityRulePage): Promise<EntityRulePage> {
        if(entityRulePage.pageNumber === await this.getAllLength(entityRulePage.guildID))
            return entityRulePage;
        let swapEntityRulePage: EntityRulePage|null = await this.getOneByPageNumber(entityRulePage.guildID, entityRulePage.pageNumber+1);
        if(swapEntityRulePage === null)
            return entityRulePage;
        entityRulePage.pageNumber += 1;
        swapEntityRulePage.pageNumber -= 1;
        await this.update([entityRulePage, swapEntityRulePage]);
        return entityRulePage;
    }
}
