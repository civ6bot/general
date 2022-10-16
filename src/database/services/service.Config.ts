import {EntityConfig} from "../entities/entity.Config";
import {EntityManager} from "typeorm";
import {localDataSource, outerDataSource} from "../database.datasources";
import {loadDefaultConfigs} from "../../utils/loaders/utils.loader.config";

export class DatabaseServiceConfig {
    protected database: EntityManager = localDataSource.manager;
    protected outerDatabase: EntityManager = outerDataSource.manager;

    public async getOneString(guildID: string, setting: string): Promise<string> {
        // Ищем значение в локальной базе данных
        let entityConfig: EntityConfig | null = await this.database.findOneBy(EntityConfig, {
            guildID: guildID,
            setting: setting,
        });
        if(entityConfig !== null)
            return entityConfig.value;

        // Если в локальной нет значения,
        // то импортируем внешнюю в локальную
        // и затем ищем в локальной
        let localDefaultConfigSettings: string[] = loadDefaultConfigs().map(defaultEntityConfig => defaultEntityConfig.setting);

        let entitiesConfig: EntityConfig[] = (await this.outerDatabase.findBy(EntityConfig, {
            guildID: guildID
        })) || [];
        entitiesConfig.filter(entityConfig => localDefaultConfigSettings.indexOf(entityConfig.setting) !== -1)
        await this.insertAll(entitiesConfig);
        entityConfig = await this.database.findOneBy(EntityConfig, {
            guildID: guildID,
            setting: setting,
        });
        if(entityConfig !== null)
            return entityConfig.value;

        // Если во внешней нет значения,
        // то генерируем данные из DEFAULT для нужной GuildID,
        // затем возвращаем значение
        let defaultEntitiesConfig: EntityConfig[] = await this.outerDatabase.findBy(EntityConfig, {
            guildID: "DEFAULT"
        }) as EntityConfig[];
        defaultEntitiesConfig
            .filter(defaultEntityConfig => localDefaultConfigSettings.indexOf(defaultEntityConfig.setting) !== -1)
            .forEach(x => x.guildID = guildID);
        await this.insertAll(defaultEntitiesConfig);
        await this.outerDatabase.save(defaultEntitiesConfig);
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

    // Можно использовать для обновления конфигурации
    // Метод database.save позволяет перезаписать
    public async insertAll(entitiesConfig: EntityConfig[]): Promise<boolean> {
        let normalizedEntitiesConfig: EntityConfig[] = entitiesConfig.map((x: EntityConfig): EntityConfig => {
            let normalizedEntity: EntityConfig = new EntityConfig();
            normalizedEntity.guildID = x.guildID;
            normalizedEntity.setting = x.setting;
            normalizedEntity.value = x.value;
            return normalizedEntity;
        });
        return !!(await this.database.save(normalizedEntitiesConfig, { chunk: 750 }))
            && !!(await this.outerDatabase.save(normalizedEntitiesConfig, { chunk: 750 }));
    }

    // используется каждый раз при включении/перезапуске
    // для очистки локальной базы данных
    public async clearAll(): Promise<void> {
        await this.database.clear(EntityConfig);
    }
}
