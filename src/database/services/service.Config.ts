import {DatabaseServiceBase} from "./service.base";
import {RequestsConfig} from "../../requests/requests.Config";
import {EntityConfig} from "../entities/entity.Config";

export class DatabaseServiceConfig extends DatabaseServiceBase {
    public async getOneString(guildID: string, setting: string): Promise<string> {
        let entityConfig: EntityConfig | null = await this.database.findOneBy(EntityConfig, {
            guildID: guildID,
            setting: setting,
        });
        if(entityConfig !== null)
            return entityConfig.value;

        // Если нет в основной БД, то идём во внешнюю
        let requestConfig: RequestsConfig = new RequestsConfig();
        let externalEntitiesConfig: EntityConfig[]|null = await requestConfig.get(guildID);
        if(externalEntitiesConfig !== null){
            // Если есть во внешней, то записываем во внутреннюю
            // И возвращаем нужное значение
            await this.insertAll(externalEntitiesConfig);
            entityConfig = await this.database.findOneBy(EntityConfig,  {
                guildID: guildID,
                setting: setting
            }) as EntityConfig;
            return entityConfig.value;
        }

        // Если нет во внешней, то генерируем
        // из DEFAULT настроек
        let defaultEntitiesConfig: EntityConfig[] = await this.database.findBy(EntityConfig, {
            guildID: "DEFAULT"
        }) as EntityConfig[];
        defaultEntitiesConfig.forEach(x => x.guildID = guildID);
        await this.insertAll(defaultEntitiesConfig);
        await requestConfig.put(defaultEntitiesConfig);
        // Возвращаем нужное значение
        entityConfig = await this.database.findOneBy(EntityConfig,  {
            guildID: guildID,
            setting: setting
        });
        return entityConfig?.value as string;
    }

    public async getManyString(guildID: string, settings: string[]): Promise<string[]> {
        let values: string[] = [];
        for(let i in settings)
            values.push(await this.getOneString(guildID, settings[i]));
        return values;
    }

    public async getOneNumber(guildID: string, setting: string): Promise<number> {
        return Number(await this.getOneString(guildID, setting)) || 0;
    }

    public async getManyNumber(guildID: string, settings: string[]): Promise<number[]> {
        let values: number[] = [];
        for(let i in settings)
            values.push(await this.getOneNumber(guildID, settings[i]));
        return values;
    }

    public async insertAll(entitiesConfig: EntityConfig[]): Promise<void> {
        let normalizedEntitiesConfig: EntityConfig[] = entitiesConfig.map((x: EntityConfig): EntityConfig => {
            let normalizedEntity: EntityConfig = new EntityConfig();
            normalizedEntity.guildID = x.guildID;
            normalizedEntity.setting = x.setting;
            normalizedEntity.value = x.value;
            return normalizedEntity;
        });
        await this.database.save(normalizedEntitiesConfig);
    }

    public async clearAll(): Promise<void> {
        await this.database.clear(EntityConfig);
    }
}
