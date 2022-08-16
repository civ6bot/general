import {DatabaseServiceBase} from "./service.base";
import {EntityText} from "../entities/entity.Text";

export class DatabaseServiceText extends DatabaseServiceBase {
    public async getOne(lang: string, tag: string, args: (string|number)[] = []): Promise<string> {

        let entityText: EntityText | null = await this.database.findOneBy(EntityText, {
            tag: tag,
            lang: lang
        });
        let text: string | undefined = entityText?.value;
        if(text === undefined)
            return tag;
        if(args.length > 0)
            text = text.replaceAll(
                /\[[^\[\]]*]/g,
                substring => String(args.splice(0, 1)[0]) || substring
            );
        return text;
    }

    public async getMany(lang: string, tags: string[], args: (((string|number)[])|null)[] = []): Promise<string[]> {
        let values: string[] = [];
        for(let i in tags)
            if((args[i] === null) || (args[i] === undefined))
                values.push(await this.getOne(lang, tags[i]));
            else
                values.push(await this.getOne(lang, tags[i], args[i] as (string|number)[]));
        return values;
    }

    public async insertAll(entitiesText: EntityText[]): Promise<EntityText[]> {
        return await this.database.save(EntityText, entitiesText);
    }

    public async clearAll(): Promise<void> {
        await this.database.clear(EntityText);
    }
}
