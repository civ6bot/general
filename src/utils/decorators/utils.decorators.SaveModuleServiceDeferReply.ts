// Если первый аргумент метода типа CommandInteraction, то удерживает его в тайминге больше 5 секунд interaction.deferReply();
// оборачивает в конструкцию try-catch для избежания отключения бота.
import {CommandInteraction, EmbedBuilder} from "discord.js";
import {UtilsServicePM} from "../services/utils.service.PM";
import {DatabaseServiceConfig} from "../../database/services/service.Config";
import {ModuleBaseUI} from "../../modules/base/base.ui";
import {DatabaseServiceText} from "../../database/services/service.Text";

export function SafeModuleServiceDeferReply(isEphemeral: boolean = false): MethodDecorator {
    return (
        target: any,
        key: string | symbol,
        descriptor: PropertyDescriptor
    ) => {
        let originalMethod = descriptor.value;
        descriptor.value = async function(...args: any[]): Promise<void> {
            try {
                if(args[0].constructor.name === "ChatInputCommandInteraction") {
                    let interaction: CommandInteraction = args[0] as CommandInteraction;
                    if(!interaction.deferred)
                        await interaction.deferReply({ephemeral: isEphemeral});
                }
                await originalMethod.apply(this, args);
            } catch (e) {
                if(args[0].constructor.name === "ChatInputCommandInteraction"){
                    let interaction: CommandInteraction = args[0] as CommandInteraction;
                    let databaseServiceConfig: DatabaseServiceConfig = new DatabaseServiceConfig();
                    let databaseServiceText: DatabaseServiceText = new DatabaseServiceText();

                    let userID: string = await databaseServiceConfig.getOneString(interaction.guild?.id as string, "BASE_UNKNOWN_ERROR_PM_USER_ID");
                    let lang: string = await databaseServiceConfig.getOneString(interaction.guild?.id as string, "BASE_LANGUAGE");
                    let title: string = await databaseServiceText.getOne(lang, "BASE_UNKNOWN_ERROR_TITLE")

                    let description: string = `Command: /${originalMethod.name}\n${String(e).slice(0, 2047)}`;
                    let errorEmbed: EmbedBuilder[] = ModuleBaseUI.unknownError(title, description);
                    interaction.deferred
                        ? await interaction.editReply({embeds: errorEmbed})
                        : await interaction.reply({embeds: errorEmbed});
                    await UtilsServicePM.send(userID, errorEmbed);
                }
            }
        };
        return descriptor;
    };
}
