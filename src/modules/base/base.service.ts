import {DatabaseServiceConfig} from "../../database/services/service.Config";
import {DatabaseServiceText} from "../../database/services/service.Text";
import {ButtonInteraction, CommandInteraction} from "discord.js";

export class ModuleBaseService {
    protected databaseServiceConfig: DatabaseServiceConfig = new DatabaseServiceConfig();
    protected databaseServiceText: DatabaseServiceText = new DatabaseServiceText();

    protected async getOneSettingString(interaction: CommandInteraction | ButtonInteraction, setting: string): Promise<string> {
        return await this.databaseServiceConfig.getOneString(interaction.guild?.id as string, setting);
    }

    protected async getManySettingString(interaction: CommandInteraction | ButtonInteraction, ...settings: string[]): Promise<string[]> {
        return await this.databaseServiceConfig.getManyString(interaction.guild?.id as string, settings);
    }

    protected async getOneSettingNumber(interaction: CommandInteraction | ButtonInteraction, setting: string): Promise<number> {
        return await this.databaseServiceConfig.getOneNumber(interaction?.guild?.id as string, setting);
    }

    protected async getManySettingNumber(interaction: CommandInteraction | ButtonInteraction, ...settings: string[]): Promise<number[]> {
        return await this.databaseServiceConfig.getManyNumber(interaction.guild?.id as string, settings);
    }

    protected async getOneText(interaction_lang: CommandInteraction | ButtonInteraction | string, tag: string, ...args: (string|number)[]): Promise<string> {
        return await this.databaseServiceText.getOne(
            (typeof interaction_lang === 'string')
                ? interaction_lang as string
                : (await this.getOneSettingString(interaction_lang, "BASE_LANGUAGE")),
            tag, args
        );
    }

    protected async getManyText(interaction: CommandInteraction | ButtonInteraction, tags: string[], args: (((string|number)[])|null)[] = []): Promise<string[]> {
        let lang: string = await this.getOneSettingString(interaction, "BASE_LANGUAGE");
        return this.databaseServiceText.getMany(lang, tags, args);
    }
}
