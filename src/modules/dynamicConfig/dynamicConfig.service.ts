import {ModuleBaseService} from "../base/base.service";
import {ButtonInteraction, CommandInteraction, GuildMember, ModalSubmitInteraction, SelectMenuInteraction, TextInputStyle} from "discord.js";
import {DynamicConfigUI} from "./dynamicConfig.ui";
import {
    DynamicConfig,
    DynamicConfigEntity,
    DynamicConfigEntityBoolean,
    DynamicConfigEntityBooleanGameSetting,
    DynamicConfigEntityNumber,
    DynamicConfigEntityString, DynamicConfigEntityTeamersForbiddenPairs
} from "./dynamicConfig.models";
import {
    JSONDynamicConfigEntityBoolean, JSONDynamicConfigEntityBooleanGameSetting,
    JSONDynamicConfigEntityNumber,
    JSONDynamicConfigEntityString, JSONDynamicConfigEntityTeamersForbiddenPairs
} from "../../types/type.JSON.DynamicConfigEntities";
import {CoreServiceCivilizations} from "../../core/services/core.service.civilizations";
import {CoreServiceGameTags} from "../../core/services/core.service.gameTags";
import {CoreServiceUsers} from "../../core/services/core.service.users";

export class DynamicConfigService extends ModuleBaseService {
    private dynamicConfigUI: DynamicConfigUI = new DynamicConfigUI();

    public static dynamicConfigs: Map<string, DynamicConfig> = new Map<string, DynamicConfig>();    // guildID
    public static tagsMap: Map<string, string[]> = new Map<string, string[]>([
        ["DYNAMIC_CONFIG_TITLE", [
            "DYNAMIC_CONFIG_CATEGORY_MISCELLANEOUS", "DYNAMIC_CONFIG_CATEGORY_SPLIT",
            "DYNAMIC_CONFIG_CATEGORY_DRAFT", "DYNAMIC_CONFIG_CATEGORY_GAME"
        ]],
        ["DYNAMIC_CONFIG_CATEGORY_DRAFT", [
            "DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_CIVILIZATIONS", "DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_FFA",
            "DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_TEAMERS", "DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_BLIND",
            "DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_REDRAFT"
        ]],
        ["DYNAMIC_CONFIG_CATEGORY_GAME", [
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS"
        ]],
        ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA", [
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_MAP", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_DISASTERS",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_BONUS_RESOURCES", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_STRATEGIC_RESOURCES",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_WONDERS", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_AGE",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_GOLD_TRADING", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_STRATEGIC_TRADING",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_FRIENDS", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_MILITARY_ALLIANCE",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_CHATTING", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_DRAFT"
        ]],
        ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS", [
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_MAP", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_DISASTERS",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_BONUS_RESOURCES", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_STRATEGIC_RESOURCES",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_WONDERS", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_AGE",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_RELIC", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_REMAPS",
            "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_SPLIT"
        ]]
    ]);
    public static configsMap = new Map<string, (JSONDynamicConfigEntityNumber
        |JSONDynamicConfigEntityString
        |JSONDynamicConfigEntityBoolean
        |JSONDynamicConfigEntityTeamersForbiddenPairs
        |JSONDynamicConfigEntityBooleanGameSetting
        )[]>([
        ["DYNAMIC_CONFIG_CATEGORY_MISCELLANEOUS", [
            {
                configTag: "MISCELLANEOUS_RANDOM_MAX",
                textTag: "DYNAMIC_CONFIG_SETTING_MISCELLANEOUS_RANDOM_MAX",
                type: "Number",
                minValue: 2,
                maxValue: Math.pow(10, 6)
            }
        ]],
        ["DYNAMIC_CONFIG_CATEGORY_SPLIT", [
            {
                configTag: "SPLIT_PICK_TIME_MS",
                textTag: "DYNAMIC_CONFIG_SETTING_SPLIT_TIME",
                type: "Number",
                minValue: 20*1000,
                maxValue: 900*1000
            }
        ]],
        ["DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_CIVILIZATIONS",
            CoreServiceCivilizations.civilizationsTags.map((tag: string): JSONDynamicConfigEntityBoolean => { return {
                configTag: tag,
                textTag: tag+"_CONFIG_TEXT",
                type: "Boolean",
            }})
        ],  // DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_CIVILIZATIONS (комментарий для свёрнутого кода)
        ["DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_FFA", [
            {
                configTag: "DRAFT_FFA_MAX_CIVILIZATIONS_DEFAULT",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_FFA_MAX_CIVILIZATIONS_DEFAULT",
                type: "Number",
                minValue: 1,
                maxValue: 16
            },
            {
                configTag: "DRAFT_FFA_MIN_CIVILIZATIONS_DEFAULT",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_FFA_MIN_CIVILIZATIONS_DEFAULT",
                type: "Number",
                minValue: 1,
                maxValue: 16
            },
        ]],
        ["DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_TEAMERS", [
            {
                configTag: "DRAFT_TEAMERS_FORBIDDEN_PAIRS",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_TEAMERS_FORBIDDEN_PAIRS",
                type: "TeamersForbiddenPairs",
            },
        ]],
        ["DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_BLIND", [
            {
                configTag: "DRAFT_BLIND_MAX_CIVILIZATIONS_DEFAULT",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_BLIND_MAX_CIVILIZATIONS_DEFAULT",
                type: "Number",
                minValue: 1,
                maxValue: 16
            },
            {
                configTag: "DRAFT_BLIND_MIN_CIVILIZATIONS_DEFAULT",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_BLIND_MIN_CIVILIZATIONS_DEFAULT",
                type: "Number",
                minValue: 1,
                maxValue: 16
            },
            {
                configTag: "DRAFT_BLIND_PICK_TIME_MS",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_BLIND_TIME",
                type: "Number",
                minValue: 20*1000,
                maxValue: 900*1000
            },
        ]],
        ["DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_REDRAFT", [
            {
                configTag: "REDRAFT_FFA_THRESHOLD_PERCENT",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_REDRAFT_FFA_THRESHOLD_PERCENT",
                type: "Number",
                minValue: 33,
                maxValue: 100
            },
            {
                configTag: "REDRAFT_TEAMERS_THRESHOLD_PERCENT",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_REDRAFT_TEAMERS_THRESHOLD_PERCENT",
                type: "Number",
                minValue: 33,
                maxValue: 100
            },
            {
                configTag: "REDRAFT_BLIND_THRESHOLD_PERCENT",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_REDRAFT_BLIND_THRESHOLD_PERCENT",
                type: "Number",
                minValue: 33,
                maxValue: 100
            },
            {
                configTag: "REDRAFT_VOTE_TIME_MS",
                textTag: "DYNAMIC_CONFIG_SETTING_DRAFT_REDRAFT_TIME",
                type: "Number",
                minValue: 15*1000,
                maxValue: 900*1000
            },
        ]],
        ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL", [
            {
                configTag: "GAME_VOTE_TIME_MS",
                textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_TIME",
                type: "Number",
                minValue: 30*1000,
                maxValue: 900*1000
            }
        ]],
        ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_MAP", [
            {
                configTag: "GAME_TEAMERS_MAP",
                textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
                type: "Boolean",
            },
            ...CoreServiceGameTags.FFAOptionsConfigsStrings[0].map((tag: string): JSONDynamicConfigEntityBoolean => { return {
                configTag: tag,
                textTag: tag+"_TEXT",
                type: "BooleanGameSetting",
            }})
        ]],
    ]);

    // нельзя использовать ModalSubmitInteraction
    private async checkDynamicConfigComponent(interaction: SelectMenuInteraction | ButtonInteraction, deferUpdate: boolean = true): Promise<DynamicConfig | undefined> {
        let dynamicConfig: DynamicConfig | undefined = DynamicConfigService.dynamicConfigs.get(interaction.guild?.id as string);
        if(!dynamicConfig) {
            await interaction.message.delete();
            return undefined;
        }
        if(!CoreServiceUsers.isAdmin(interaction.member as GuildMember)) {
            await interaction.deferUpdate();
            return undefined;
        }
        if(dynamicConfig.interaction.user.id !== interaction.user.id) {
            let textStrings = await this.getManyText(
                interaction,
                ["BASE_ERROR_TITLE", "DYNAMIC_CONFIG_ERROR_NOT_OWNER"],
            );
            await interaction.reply({embeds: this.dynamicConfigUI.error(textStrings[0], textStrings[1]), ephemeral: true});
            return undefined;
        }
        if(deferUpdate)
            await interaction.deferUpdate();
        return dynamicConfig;
    }

    private async sendDynamicConfigMessage(dynamicConfig: DynamicConfig, isNewMessage: boolean = false): Promise<void> {
        let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
            dynamicConfig.getTitleTag()+"_EMOJI", dynamicConfig.getTitleTag(),
            "DYNAMIC_CONFIG_TITLE_PAGE", (dynamicConfig.isConfig)
                ? "DYNAMIC_CONFIG_CHOOSE_CONFIG_DESCRIPTION"
                : "DYNAMIC_CONFIG_CHOOSE_GROUP_DESCRIPTION"
        ]);
        let emojiStrings: string[] = await this.getManyText(dynamicConfig.interaction, dynamicConfig.getEmojiTags());
        let optionStrings: string[] = await this.getManyText(dynamicConfig.interaction, dynamicConfig.getOptionTags());
        let buttonStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
            "DYNAMIC_CONFIG_BUTTON_BACK", "DYNAMIC_CONFIG_BUTTON_FIRST",
            "DYNAMIC_CONFIG_BUTTON_PREVIOUS", "DYNAMIC_CONFIG_BUTTON_NEXT",
            "DYNAMIC_CONFIG_BUTTON_LAST", "DYNAMIC_CONFIG_BUTTON_RESET",
            "DYNAMIC_CONFIG_BUTTON_DELETE"
        ]);
        let placeholderString: string = await this.getOneText(dynamicConfig.interaction,
            (dynamicConfig.isConfig)
                ? "DYNAMIC_CONFIG_MENU_PLACEHOLDER_CONFIG"
                : "DYNAMIC_CONFIG_MENU_PLACEHOLDER_CATEGORY");
        if(isNewMessage)
            await dynamicConfig.interaction.reply({
                embeds: this.dynamicConfigUI.configEmbed(
                    dynamicConfig,
                    textStrings[0], textStrings[1], textStrings[2], textStrings[3],
                    emojiStrings,
                    optionStrings
                ),
                components: [
                    ...this.dynamicConfigUI.configButtons(dynamicConfig, buttonStrings),
                    ...this.dynamicConfigUI.configMenu(placeholderString, optionStrings, emojiStrings)
                ]
            });
        else await dynamicConfig.interaction.editReply({
                embeds: this.dynamicConfigUI.configEmbed(
                    dynamicConfig,
                    textStrings[0], textStrings[1], textStrings[2], textStrings[3],
                    emojiStrings,
                    optionStrings
                ),
                components: [
                    ...this.dynamicConfigUI.configButtons(dynamicConfig, buttonStrings),
                    ...this.dynamicConfigUI.configMenu(placeholderString, optionStrings, emojiStrings)
                ]
            });
    }

    private updateTimeout(dynamicConfig: DynamicConfig): void {
        dynamicConfig.date = new Date();
        if(dynamicConfig.setTimeoutID !== null)
            clearTimeout(dynamicConfig.setTimeoutID);
        dynamicConfig.setTimeoutID = setTimeout(DynamicConfigService.timeoutFunction, dynamicConfig.lifeTimeMs);
    }

    private async updateOneDynamicConfigEntity(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, entity: DynamicConfigEntity): Promise<void> {
        return this.updateManyDynamicConfigEntity(interaction, [entity]);
    }

    private async updateManyDynamicConfigEntity(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, entities: DynamicConfigEntity[]): Promise<void> {

    }

    private async resetManyDynamicConfigEntity(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, entities: DynamicConfigEntity[]): Promise<void> {

    }

    private async createDynamicConfigEntities(
        jsonEntities: (
            JSONDynamicConfigEntityNumber
            |JSONDynamicConfigEntityString
            |JSONDynamicConfigEntityBoolean
            |JSONDynamicConfigEntityTeamersForbiddenPairs
            |JSONDynamicConfigEntityBooleanGameSetting)[],
        dynamicConfig: DynamicConfig
    ): Promise<DynamicConfigEntity[]> {
        let dynamicConfigEntities: DynamicConfigEntity[] = [];
        for(let config of jsonEntities)
            switch (config.type) {
                case "Number":
                    dynamicConfigEntities.push(new DynamicConfigEntityNumber(
                        config as JSONDynamicConfigEntityNumber,
                        await this.getOneSettingNumber(dynamicConfig.interaction, config.configTag)
                    ));
                    break;
                case "String":
                    dynamicConfigEntities.push(new DynamicConfigEntityString(
                        config as JSONDynamicConfigEntityString,
                        await this.getOneSettingString(dynamicConfig.interaction, config.configTag)
                    ));
                    break;
                case "Boolean":
                    dynamicConfigEntities.push(new DynamicConfigEntityBoolean(
                        config as JSONDynamicConfigEntityBoolean,
                        !!(await this.getOneSettingNumber(dynamicConfig.interaction, config.configTag))
                    ));
                    break;
                case "TeamersForbiddenPairs":
                    dynamicConfigEntities.push(new DynamicConfigEntityTeamersForbiddenPairs(
                        config as JSONDynamicConfigEntityTeamersForbiddenPairs,
                        await this.getOneSettingString(dynamicConfig.interaction, config.configTag),
                        await this.getManyText(
                            dynamicConfig.interaction,
                            CoreServiceCivilizations.civilizationsTags.map(tag => tag+"_TEXT")
                        )
                    ));
                    break;
                case "BooleanGameSetting":
                    dynamicConfigEntities.push(new DynamicConfigEntityBooleanGameSetting(
                        config as JSONDynamicConfigEntityBooleanGameSetting,
                        !!(await this.getOneSettingNumber(dynamicConfig.interaction, config.configTag)),
                        dynamicConfig
                    ));
                    break;
                default:
                    break;
            }
        return dynamicConfigEntities;
    }

    //dynamicConfig-menu
    //values=numbers i
    public async config(interaction: CommandInteraction) {
        if(!CoreServiceUsers.isAdmin(interaction.member as GuildMember)) {
            let textStrings = await this.getManyText(
                interaction,
                ["BASE_ERROR_TITLE", "DYNAMIC_CONFIG_ERROR_COMMAND_NOT_ADMIN"],
            );
            return await interaction.reply({embeds: this.dynamicConfigUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        let key: string = interaction.guild?.id as string;
        let dynamicConfig: DynamicConfig | undefined = DynamicConfigService.dynamicConfigs.get(key);
        if(!dynamicConfig) {
            let entitiesPerPage: number = await this.getOneSettingNumber(interaction, "DYNAMIC_CONFIG_PAGINATION_SIZE");
            let optionsTags: string[] = DynamicConfigService.tagsMap.get("DYNAMIC_CONFIG_TITLE") || [];
            let lifeTimeMs: number = await this.getOneSettingNumber(interaction, "DYNAMIC_CONFIG_LIFE_TIME_MS");
            dynamicConfig = new DynamicConfig(interaction, entitiesPerPage, lifeTimeMs, "DYNAMIC_CONFIG_TITLE", optionsTags);
            DynamicConfigService.dynamicConfigs.set(key, dynamicConfig);
        } else {
            await dynamicConfig.interaction.deleteReply();
            dynamicConfig.interaction = interaction;
        }
        this.updateTimeout(dynamicConfig);
        await this.sendDynamicConfigMessage(dynamicConfig, true);

    }

    // dynamicConfig-modal
    // CoreGeneratorModal
    // Может вызвать другое меню (изменение сообщения)
    // или модальное окно
    public async menu(interaction: SelectMenuInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction, false);
        if(!dynamicConfig)
            return;

        let valueIndex: number = Number(interaction.values[0]);
        if(Number.isNaN(valueIndex))
            return await interaction.deferUpdate();
        let option: string | undefined = dynamicConfig.getOptionTags()[valueIndex];
        if(!option)
            return await interaction.deferUpdate();
        this.updateTimeout(dynamicConfig);

        // Новая категория
        let categories: string[] | undefined = DynamicConfigService.tagsMap.get(dynamicConfig.getOptionTags()[valueIndex]);
        if(categories) {
            await interaction.deferUpdate();
            dynamicConfig.createChild(valueIndex, categories);
            await this.sendDynamicConfigMessage(dynamicConfig);
            dynamicConfig.date = new Date();
            dynamicConfig.setTimeoutID = setTimeout(DynamicConfigService.timeoutFunction, dynamicConfig.lifeTimeMs);
            return;
        }

        // Последняя категория, получили конфигурацию
        let configs: (JSONDynamicConfigEntityNumber|
            JSONDynamicConfigEntityString|
            JSONDynamicConfigEntityBoolean)[]|
            undefined = DynamicConfigService.configsMap.get(dynamicConfig.getOptionTags()[valueIndex]);
        if(configs) {
            await interaction.deferUpdate();
            let dynamicConfigEntities: DynamicConfigEntity[] = await this.createDynamicConfigEntities(configs, dynamicConfig);
            dynamicConfig.createChild(valueIndex, [], dynamicConfigEntities);
            await this.sendDynamicConfigMessage(dynamicConfig);
            return;
        }

        let dynamicConfigEntity: DynamicConfigEntity | undefined = dynamicConfig.getLastChild().configs[valueIndex];
        if(!dynamicConfigEntity)
            return;

        // Вызов изменения конфигурации для булевых значений
        if(dynamicConfigEntity.type === "Boolean") {
            let dynamicConfigEntityBoolean: DynamicConfigEntityBoolean = dynamicConfigEntity as DynamicConfigEntityBoolean;
            dynamicConfigEntityBoolean.check(String(!dynamicConfigEntityBoolean.value));
            await this.updateOneDynamicConfigEntity(dynamicConfig.interaction, dynamicConfigEntityBoolean);
            let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                "BASE_NOTIFY_TITLE", "DYNAMIC_CONFIG_NOTIFY_CHANGE_SUCCESS"
            ]);
            await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
            await this.sendDynamicConfigMessage(dynamicConfig);
            return;
        }

        // Вызов изменения конфигурации для булевых значений настроек игры
        if(dynamicConfigEntity.type === "BooleanGameSetting") {
            let dynamicConfigEntityBooleanGameSetting: DynamicConfigEntityBooleanGameSetting = dynamicConfigEntity as DynamicConfigEntityBooleanGameSetting;
            if(dynamicConfigEntityBooleanGameSetting.check(String(!dynamicConfigEntityBooleanGameSetting.value))) {
                let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                    "BASE_ERROR_TITLE", "DYNAMIC_CONFIG_ERROR_TYPE_BOOLEAN_GAME_SETTING"
                ]);
                await interaction.reply({embeds: this.dynamicConfigUI.error(textStrings[0], textStrings[1]), ephemeral: true});
                return;
            }
            await this.updateOneDynamicConfigEntity(dynamicConfig.interaction, dynamicConfigEntityBooleanGameSetting);
            let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                "BASE_NOTIFY_TITLE", "DYNAMIC_CONFIG_NOTIFY_CHANGE_SUCCESS"
            ]);
            await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
            await this.sendDynamicConfigMessage(dynamicConfig);
            return;
        }

        // Модальные окна для изменения не-булевых значений
        if(dynamicConfigEntity.type === "Number") {
            let dynamicConfigEntityNumber: DynamicConfigEntityNumber = dynamicConfigEntity as DynamicConfigEntityNumber;
            let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                dynamicConfigEntityNumber.properties.textTag, dynamicConfigEntityNumber.properties.textTag+"_EMOJI",
                "DYNAMIC_CONFIG_MODAL_LABEL"
            ]);
            await interaction.showModal(this.dynamicConfigUI.configModal(
                `${textStrings[1] + " "}${textStrings[0]}`,
                String(valueIndex),
                textStrings[2],
                dynamicConfigEntity.stringifiedValue
            ));
            return;
        }

        if(dynamicConfigEntity.type === "String") {
            let dynamicConfigEntityString: DynamicConfigEntityString = dynamicConfigEntity as DynamicConfigEntityString;
            let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                dynamicConfigEntityString.properties.textTag, dynamicConfigEntityString.properties.textTag+"_EMOJI",
                "DYNAMIC_CONFIG_MODAL_LABEL"
            ]);
            await interaction.showModal(this.dynamicConfigUI.configModal(
                `${textStrings[1] + " "}${textStrings[0]}`,
                String(valueIndex),
                textStrings[2],
                dynamicConfigEntity.stringifiedValue
            ));
            return;
        }

        if(dynamicConfigEntity.type === "TeamersForbiddenPairs") {
            let dynamicConfigEntityEntityTeamersForbiddenPairs: DynamicConfigEntityTeamersForbiddenPairs = dynamicConfigEntity as DynamicConfigEntityTeamersForbiddenPairs;
            let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                dynamicConfigEntityEntityTeamersForbiddenPairs.properties.textTag,
                dynamicConfigEntityEntityTeamersForbiddenPairs.properties.textTag+"_EMOJI",
                "DYNAMIC_CONFIG_MODAL_LABEL"
            ]);
            await interaction.showModal(this.dynamicConfigUI.configModal(
                `${textStrings[1] + " "}${textStrings[0]}`,
                String(valueIndex),
                textStrings[2],
                dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationPairIndexes
                    .map((value: number[]): string =>
                        `${dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationTexts[value[0]]}, ${dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationTexts[value[1]]}`)
                    .join("\n")
                    .replaceAll(/<.+?>/g, "-"),     // ? - ленивый поиск
                true
            ));
            return;
        }

        // Если ничего не совпало, то ничего не делать
        await interaction.deferUpdate();
    }

    public async modalSetting(interaction: ModalSubmitInteraction) {
        let index: number = Number(Array.from(interaction.fields.fields.keys())[0]),
            value: string = Array.from(interaction.fields.fields.values())[0].value;

        let dynamicConfig: DynamicConfig | undefined = DynamicConfigService.dynamicConfigs.get(interaction.guild?.id as string);
        let dynamicConfigEntity: DynamicConfigEntity | undefined = dynamicConfig?.getLastChild().configs[index];
        if(!dynamicConfig || !dynamicConfigEntity) {
            let textStrings: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", "DYNAMIC_CONFIG_ERROR_FAIL_TIMEOUT"
            ]);
            return await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
        }
        this.updateTimeout(dynamicConfig);

        if(dynamicConfigEntity.type === "Number") {
            let dynamicConfigEntityNumber: DynamicConfigEntityNumber = dynamicConfigEntity as DynamicConfigEntityNumber;
            if(!dynamicConfigEntityNumber.check(value)) {
                let textStrings: string[] = await this.getManyText(interaction, [
                    "BASE_ERROR_TITLE", "DYNAMIC_CONFIG_ERROR_TYPE_NUMBER"], [
                        null, [dynamicConfigEntityNumber.properties.minValue, dynamicConfigEntityNumber.properties.maxValue]
                ]);
                return await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
            }
            await this.updateOneDynamicConfigEntity(interaction, dynamicConfigEntityNumber);
            let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                "BASE_NOTIFY_TITLE", "DYNAMIC_CONFIG_NOTIFY_CHANGE_SUCCESS"
            ]);
            await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
            await this.sendDynamicConfigMessage(dynamicConfig);
            return;
        }

        if(dynamicConfigEntity.type === "String") {
            let dynamicConfigEntityString: DynamicConfigEntityString = dynamicConfigEntity as DynamicConfigEntityString;
            if(!dynamicConfigEntityString.check(value)) {
                let textStrings: string[] = await this.getManyText(interaction, [
                    "BASE_ERROR_TITLE", "DYNAMIC_CONFIG_ERROR_TYPE_STRING"]);
                return await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
            }
            let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                "BASE_NOTIFY_TITLE", "DYNAMIC_CONFIG_NOTIFY_CHANGE_SUCCESS"
            ]);
            await this.updateOneDynamicConfigEntity(interaction, dynamicConfigEntityString);
            await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
            await this.sendDynamicConfigMessage(dynamicConfig);
            return;
        }

        if(dynamicConfigEntity.type === "TeamersForbiddenPairs") {
            let dynamicConfigEntityEntityTeamersForbiddenPairs: DynamicConfigEntityTeamersForbiddenPairs = dynamicConfigEntity as DynamicConfigEntityTeamersForbiddenPairs;
            if(!dynamicConfigEntityEntityTeamersForbiddenPairs.check(value)) {
                let textStrings: string[] = [await this.getOneText(interaction, "BASE_ERROR_TITLE")];
                if(dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationErrorIndexes.length === 1)
                    textStrings.push(await this.getOneText(interaction, "DYNAMIC_CONFIG_ERROR_TYPE_TEAMERS_FORBIDDEN_PAIRS_SAME",
                        dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationTexts[dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationErrorIndexes[0]])
                    );
                else if(dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationErrorIndexes.length === 3)
                    textStrings.push(await this.getOneText(interaction, "DYNAMIC_CONFIG_ERROR_TYPE_TEAMERS_FORBIDDEN_PAIRS_SAME",
                        dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationErrorIndexes.map((value: number): string =>
                            dynamicConfigEntityEntityTeamersForbiddenPairs.civilizationTexts[value]).join("\n")
                        )
                    );
                else textStrings.push(await this.getOneText(interaction, "DYNAMIC_CONFIG_ERROR_TYPE_TEAMERS_FORBIDDEN_PAIRS_PARSE"));
                return await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
            }
            await this.updateOneDynamicConfigEntity(interaction, dynamicConfigEntityEntityTeamersForbiddenPairs);
            let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
                "BASE_NOTIFY_TITLE", "DYNAMIC_CONFIG_NOTIFY_CHANGE_SUCCESS"
            ]);
            await interaction.reply({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
            await this.sendDynamicConfigMessage(dynamicConfig);
            return;
        }

        // Если ничего не совпало, то ничего не делать
        await interaction.reply(`Modal is not implemented. Index=${index}, value=${value}.`);
    }

    public async deleteButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        DynamicConfigService.dynamicConfigs.delete(dynamicConfig.guildID);
        if(dynamicConfig.setTimeoutID !== null)
            clearTimeout(dynamicConfig.setTimeoutID);
        await dynamicConfig.interaction.deleteReply();
    }

    public async resetButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        this.updateTimeout(dynamicConfig);
        let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
            "DYNAMIC_CONFIG_RESET_TITLE", "DYNAMIC_CONFIG_RESET_DESCRIPTION"
        ]);
        let labels: string[] = await this.getManyText(dynamicConfig.interaction, [
            "DYNAMIC_CONFIG_RESET_BUTTON_CONFIRM", "DYNAMIC_CONFIG_RESET_BUTTON_CANCEL"
        ]);
        await dynamicConfig.interaction.editReply({
            embeds: this.dynamicConfigUI.configResetEmbed(dynamicConfig, textStrings[0], textStrings[1]),
            components: this.dynamicConfigUI.configResetButtons(labels)
        });
    }

    public async firstPageButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        this.updateTimeout(dynamicConfig);
        dynamicConfig.toFirstPage();
        await this.sendDynamicConfigMessage(dynamicConfig);
    }

    public async previousPageButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        this.updateTimeout(dynamicConfig);
        dynamicConfig.toPreviousPage();
        await this.sendDynamicConfigMessage(dynamicConfig);
    }

    public async nextPageButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        this.updateTimeout(dynamicConfig);
        dynamicConfig.toNextPage();
        await this.sendDynamicConfigMessage(dynamicConfig);
    }

    public async lastPageButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        this.updateTimeout(dynamicConfig);
        dynamicConfig.toLastPage();
        await this.sendDynamicConfigMessage(dynamicConfig);
    }

    public async resetConfirmButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        this.updateTimeout(dynamicConfig);

        let categories: string[] = dynamicConfig.optionTags.slice();
        for(let i: number = 0; i < categories.length; i++) {
            categories.concat(DynamicConfigService.tagsMap.get(categories[i]) || [])
        }
        categories = categories.filter(category => (DynamicConfigService.tagsMap.get(category) === undefined));
        let configs: DynamicConfigEntity[] = await this.createDynamicConfigEntities(
            categories
                .map((category: string) => DynamicConfigService.configsMap.get(category) || [])
                .reduce((a, b) => a.concat(b), []),
            dynamicConfig
        );
        await this.resetManyDynamicConfigEntity(interaction, configs);
        if(dynamicConfig.isConfig) {
            let configs: (JSONDynamicConfigEntityNumber|
                JSONDynamicConfigEntityString|
                JSONDynamicConfigEntityBoolean)[]|
                undefined = DynamicConfigService.configsMap.get(dynamicConfig.getTitleTag());
            if(configs)
                dynamicConfig.updateConfigs(await this.createDynamicConfigEntities(configs, dynamicConfig));
        }
        let textStrings: string[] = await this.getManyText(dynamicConfig.interaction, [
            "BASE_NOTIFY_TITLE", "DYNAMIC_CONFIG_NOTIFY_RESET_SUCCESS"
        ]);
        await dynamicConfig.interaction.followUp({embeds: this.dynamicConfigUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
        await this.sendDynamicConfigMessage(dynamicConfig);
    }

    public async resetDenyButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        this.updateTimeout(dynamicConfig);
        await this.sendDynamicConfigMessage(dynamicConfig);
    }

    public async backButton(interaction: ButtonInteraction) {
        let dynamicConfig: DynamicConfig | undefined = await this.checkDynamicConfigComponent(interaction);
        if(!dynamicConfig)
            return;
        this.updateTimeout(dynamicConfig);
        dynamicConfig.deleteLastChild();
        await this.sendDynamicConfigMessage(dynamicConfig);
    }

    public static async timeoutFunction() {
        let dynamicConfigs: DynamicConfig[] = Array.from(DynamicConfigService.dynamicConfigs.values())
            .filter(dynamicConfig => (Date.now()-dynamicConfig.date.getTime() >= dynamicConfig.lifeTimeMs));
        dynamicConfigs.forEach(dynamicConfig => DynamicConfigService.dynamicConfigs.delete(dynamicConfig.guildID));
        for(let i in dynamicConfigs)
            try { await dynamicConfigs[i].interaction.deleteReply(); } catch {}
    }
}
