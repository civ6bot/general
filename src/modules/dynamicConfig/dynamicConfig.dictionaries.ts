import {
    JSONDynamicConfigEntityBoolean, JSONDynamicConfigEntityBooleanGameSetting, JSONDynamicConfigEntityChannelMany,
    JSONDynamicConfigEntityNumber, JSONDynamicConfigEntityNumberMany, JSONDynamicConfigEntityRoleMany,
    JSONDynamicConfigEntityString, JSONDynamicConfigEntityTeamersForbiddenPairs
} from "../../types/type.JSON.DynamicConfigEntities";
import {UtilsServiceCivilizations} from "../../utils/services/utils.service.civilizations";
import {UtilsServiceGameTags} from "../../utils/services/utils.service.gameTags";

export const tagsMap: Map<string, string[]> = new Map<string, string[]>([
    ["DYNAMIC_CONFIG_TITLE", [
        "DYNAMIC_CONFIG_CATEGORY_MISCELLANEOUS", "DYNAMIC_CONFIG_CATEGORY_SPLIT",
        "DYNAMIC_CONFIG_CATEGORY_DRAFT", "DYNAMIC_CONFIG_CATEGORY_GAME",
        "DYNAMIC_CONFIG_MODERATION", "DYNAMIC_CONFIG_LANGUAGE"
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
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_THERMONUCLEAR_DEVICE", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_GREAT_PEOPLE_PASS",
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_MONOPOLY", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_BARBARIAN_CLANS",
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_SHUFFLE",

        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_GOLD_TRADING", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_STRATEGIC_TRADING",
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_FRIENDS", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_MILITARY_ALLIANCE",
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_CHATTING", 
        
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_DRAFT", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_BANS_THRESHOLD"
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS", [
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_MAP", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_DISASTERS",
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_BONUS_RESOURCES", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_STRATEGIC_RESOURCES",
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_WONDERS", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_AGE",
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_RELIC", "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_REMAPS",
        "DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_SPLIT", "DYNAMIC_CONFIG_SETTING_GAME_TEAMERS_BANS_THRESHOLD"
    ]]
]);
export const configsMap = new Map<string, (JSONDynamicConfigEntityNumber
    |JSONDynamicConfigEntityString
    |JSONDynamicConfigEntityBoolean
    |JSONDynamicConfigEntityTeamersForbiddenPairs
    |JSONDynamicConfigEntityBooleanGameSetting
    |JSONDynamicConfigEntityNumberMany
    |JSONDynamicConfigEntityRoleMany
    |JSONDynamicConfigEntityChannelMany
    )[]>([
    ["DYNAMIC_CONFIG_LANGUAGE", []],
    ["DYNAMIC_CONFIG_MODERATION", [
        {
            configTag: "MODERATION_ROLE_MODERATORS_ID",
            textTag: "DYNAMIC_CONFIG_MODERATION_ROLE_MODERATORS_ID",
            type: "RoleMany",
            minAmount: 0,
            maxAmount: 10
        }
    ]],
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
            type: "NumberTimeSeconds",
            minValue: 20,
            maxValue: 900
        },
        {
            configTag: "SPLIT_SEND_PM_NOTIFICATION",
            textTag: "DYNAMIC_CONFIG_SETTING_SPLIT_SEND_PM_NOTIFICATION",
            type: "Boolean"
        },
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_DRAFT_CIVILIZATIONS",
        UtilsServiceCivilizations.civilizationsTags.map((tag: string): JSONDynamicConfigEntityBoolean => { return {
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
            type: "NumberTimeSeconds",
            minValue: 20,
            maxValue: 900
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
            type: "NumberTimeSeconds",
            minValue: 15,
            maxValue: 900
        },
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL", [
        {
            configTag: "GAME_VOTE_TIME_MS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_TIME",
            type: "NumberTimeSeconds",
            minValue: 30,
            maxValue: 900
        },
        {
            configTag: "GAME_THREAD",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_THREAD",
            type: "Boolean"
        },
        {
            configTag: "GAME_SEND_PM_NOTIFICATION",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_SEND_PM_NOTIFICATION",
            type: "Boolean"
        },
        {
            configTag: "GAME_MOVE_TO_VOICE_CHANNELS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_MOVE_TO_VOICE_CHANNELS",
            type: "Boolean"
        },
        {
            configTag: "GAME_FFA_HOME_VOICE_CHANNELS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_FFA_HOME_VOICE_CHANNELS",
            type: "ChannelMany",
            minAmount: 0,
            maxAmount: 16
        },
        {
            configTag: "GAME_FFA_VOICE_CHANNELS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_FFA_VOICE_CHANNELS",
            type: "ChannelMany",
            minAmount: 0,
            maxAmount: 16
        },
        {
            configTag: "GAME_TEAMERS_HOME_VOICE_CHANNELS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_TEAMERS_HOME_VOICE_CHANNELS",
            type: "ChannelMany",
            minAmount: 0,
            maxAmount: 16
        },
        {
            configTag: "GAME_TEAMERS_VOICE_CHANNELS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_GENERAL_TEAMERS_VOICE_CHANNELS",
            type: "ChannelMany",
            minAmount: 0,
            maxAmount: 16
        },
    ]],

    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_MAP", [
        {
            configTag: "GAME_FFA_MAP",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[0].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_DISASTERS", [
        {
            configTag: "GAME_FFA_DISASTERS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[1].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_BONUS_RESOURCES", [
        {
            configTag: "GAME_FFA_BONUS_RESOURCES",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[2].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_STRATEGIC_RESOURCES", [
        {
            configTag: "GAME_FFA_STRATEGIC_RESOURCES",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[3].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_WONDERS", [
        {
            configTag: "GAME_FFA_WONDERS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[4].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_AGE", [
        {
            configTag: "GAME_FFA_AGE",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[5].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_THERMONUCLEAR_DEVICE", [
        {
            configTag: "GAME_FFA_THERMONUCLEAR_DEVICE",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[6].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_GREAT_PEOPLE_PASS", [
        {
            configTag: "GAME_FFA_GREAT_PEOPLE_PASS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[7].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_MONOPOLY", [
        {
            configTag: "GAME_FFA_MONOPOLY",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[8].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_BARBARIAN_CLANS", [
        {
            configTag: "GAME_FFA_BARBARIAN_CLANS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[9].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_SHUFFLE", [
        {
            configTag: "GAME_FFA_SHUFFLE",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[10].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],


    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_GOLD_TRADING", [
        {
            configTag: "GAME_FFA_GOLD_TRADING",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[11].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_STRATEGIC_TRADING", [
        {
            configTag: "GAME_FFA_STRATEGIC_TRADING",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[12].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_FRIENDS", [
        {
            configTag: "GAME_FFA_FRIENDS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[13].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_MILITARY_ALLIANCE", [
        {
            configTag: "GAME_FFA_MILITARY_ALLIANCE",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[14].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_CHATTING", [
        {
            configTag: "GAME_FFA_CHATTING",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[15].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_DRAFT", [
        {
            configTag: "GAME_FFA_DRAFT",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.FFAOptionsConfigsStrings[16].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_FFA_BANS_THRESHOLD", [
        {
            configTag: "GAME_FFA_DRAFT_BAN_THRESHOLD_PERCENT",
            textTag: "DYNAMIC_CONFIG_SETTING_GAME_FFA_BANS_THRESHOLD",
            type: "Number",
            minValue: 1,
            maxValue: 100
        }
    ]],

    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_MAP", [
        {
            configTag: "GAME_TEAMERS_MAP",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[0].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_DISASTERS", [
        {
            configTag: "GAME_TEAMERS_DISASTERS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[1].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_BONUS_RESOURCES", [
        {
            configTag: "GAME_TEAMERS_BONUS_RESOURCES",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[2].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_STRATEGIC_RESOURCES", [
        {
            configTag: "GAME_TEAMERS_STRATEGIC_RESOURCES",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[3].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_WONDERS", [
        {
            configTag: "GAME_TEAMERS_WONDERS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[4].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_AGE", [
        {
            configTag: "GAME_TEAMERS_AGE",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[5].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_RELIC", [
        {
            configTag: "GAME_TEAMERS_RELIC",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[6].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_REMAPS", [
        {
            configTag: "GAME_TEAMERS_REMAPS",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[7].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_SPLIT", [
        {
            configTag: "GAME_TEAMERS_SPLIT",
            textTag: "DYNAMIC_CONFIG_SUBCATEGORY_GAME_ADD",
            type: "Boolean",
        },
        ...UtilsServiceGameTags.teamersOptionsConfigsStrings[8].map((tag: string): JSONDynamicConfigEntityBooleanGameSetting => { return {
            configTag: tag,
            textTag: tag,
            type: "BooleanGameSetting",
        }})
    ]],
    ["DYNAMIC_CONFIG_SUBCATEGORY_GAME_TEAMERS_BANS_THRESHOLD", [
        {
            configTag: "GAME_TEAMERS_DRAFT_BAN_THRESHOLD_PERCENT",
            textTag: "DYNAMIC_CONFIG_SETTING_GAME_TEAMERS_BANS_THRESHOLD",
            type: "Number",
            minValue: 1,
            maxValue: 100
        }
    ]],
]);
