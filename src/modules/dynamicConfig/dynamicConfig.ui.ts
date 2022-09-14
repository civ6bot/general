import {ModuleBaseUI} from "../base/base.ui";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, SelectMenuBuilder} from "discord.js";
import {DynamicConfig} from "./dynamicConfig.models";
import {CoreGeneratorEmbed} from "../../core/generators/core.generator.embed";
import {CoreGeneratorMenu} from "../../core/generators/core.generator.menu";
import {CoreGeneratorButton} from "../../core/generators/core.generator.button";
import {CoreGeneratorModal} from "../../core/generators/core.generator.modal";

export class DynamicConfigUI extends ModuleBaseUI {
    public configEmbed(
        dynamicConfig: DynamicConfig,
        titleEmoji: string, title: string, titlePage: string,
        description: string,
        emojis: string[], options: string[]
    ): EmbedBuilder[] {
        let values: string[] = dynamicConfig.getStringifiedValues();
        return CoreGeneratorEmbed.getSingle(
            (dynamicConfig.pageTotal > 1)
                ? `${titleEmoji} ${title}, ${titlePage} ${dynamicConfig.pageCurrent}/${dynamicConfig.pageTotal}`
                : `${titleEmoji} ${title}`,
            "#F4900C",
            description + "\n\n" + emojis.map((value: string, index: number): string => (values[index])
                ? `${emojis[index]} ${options[index]}: ${values[index]}`
                : `${emojis[index]} ${options[index]}`).join("\n") + "\n" + "⠀",    // невидимый пробел для следующей строки
            [],
            dynamicConfig.interaction.user.tag,
            dynamicConfig.interaction.user.avatarURL()
        );
    }

    public configMenu(
        placeholder: string,
        labels: string[],
        emojis: string[],
        descriptions: string[] = []
    ): ActionRowBuilder<SelectMenuBuilder>[] {
        return CoreGeneratorMenu.build(
            "dynamicConfig-menu",
            placeholder,
            labels,
            emojis,
            Array.from(new Array(labels.length).keys()).map((value: number): string => String(value)),
            descriptions
        );
    }

    public configButtons(
        dynamicConfig: DynamicConfig,
        labels: string[]        // back, navigation, reset, delete
    ): ActionRowBuilder<ButtonBuilder>[] {
        let indexes: number[] = Array.from(Array(labels.length).keys());
        if(dynamicConfig.pageTotal === 1)
            indexes.splice(1, 4);
        else if (dynamicConfig.pageTotal === 2) {
            indexes.splice(4, 1);
            indexes.splice(1, 1);
        }
        if(!dynamicConfig.hasAnyChild())
            indexes.splice(0, 1);
        let filterFunction = (value: any, index: number): boolean => (indexes.indexOf(index) !== -1);

        labels = labels.filter(filterFunction);
        let emojis: string[] = ["⬅", "⏮", "◀", "▶", "⏭", "🔄", "✖️"].filter(filterFunction);
        let customIDArray: string[] = [
            "dynamicConfig-button-back",
            "dynamicConfig-button-first",
            "dynamicConfig-button-previous",
            "dynamicConfig-button-next",
            "dynamicConfig-button-last",
            "dynamicConfig-button-reset",
            "dynamicConfig-button-delete",
        ].filter(filterFunction);
        let styles: ButtonStyle[] = [
            ButtonStyle.Primary,
            ButtonStyle.Secondary,
            ButtonStyle.Secondary,
            ButtonStyle.Secondary,
            ButtonStyle.Secondary,
            ButtonStyle.Danger,
            ButtonStyle.Danger
        ].filter(filterFunction);

        return CoreGeneratorButton.getList(labels, emojis, styles, customIDArray);
    }

    public configModal(
        title: string,
        configTag: string,
        label: string,
    ): ModalBuilder {
        return CoreGeneratorModal.build(
            "dynamicConfig-modal",
            title,
            [configTag],
            [label]
        );
    };

    public configResetEmbed(
        dynamicConfig: DynamicConfig,
        title: string,
        description: string
    ): EmbedBuilder[] {
        return CoreGeneratorEmbed.getSingle(
            title,
            "#F4900C",
            description,
            [],
            dynamicConfig.interaction.user.tag,
            dynamicConfig.interaction.user.avatarURL()
        );
    }

    public configResetButtons(labels: string[]): ActionRowBuilder<ButtonBuilder>[] {
        let styles: ButtonStyle[] = [ButtonStyle.Success, ButtonStyle.Danger];
        let emojis: string[] = ["🔄", "✖️"];
        let customIDs: string[] = ["dynamicConfig-button-reset-confirm", "dynamicConfig-button-reset-deny"];
        return CoreGeneratorButton.getList(labels, emojis, styles, customIDs);
    }
}
