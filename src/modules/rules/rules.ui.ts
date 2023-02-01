import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputStyle, User} from "discord.js";
import {UtilsGeneratorEmbed} from "../../utils/generators/utils.generator.embed";
import {ModuleBaseUI} from "../base/base.ui";
import {UtilsGeneratorButton} from "../../utils/generators/utils.generator.button";
import {EntityRulePage} from "../../database/entities/entity.RulePage";
import {UtilsGeneratorModal} from "../../utils/generators/utils.generator.modal";

export class RulesUI extends ModuleBaseUI {
    public rulesPageEmbed(
        rulePage: EntityRulePage,
        tagTitle: string,
        author: User
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            `📕 #${rulePage.pageNumber} | ${rulePage.title}`,
            "#FF526C",
            rulePage.description,
            [{name: tagTitle, value: `\`${rulePage.tags.split(" ").join(", ")}\``}],
            author.tag,
            author.avatarURL()
        );
    }

    public rulesCoverEmbed(
        title: string,
        description: string,
        rulePages: EntityRulePage[],
        author: User
    ): EmbedBuilder[] {
        if(rulePages.length > 0) {
            description += "\n\n";
            rulePages.forEach((rulePage, index) => description += `**${index+1}** | **${rulePage.title}** | \`${rulePage.tags.split(" ").join(", ")}\`\n`);
        }
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#FF526C",
            description,
            [],
            author.tag,
            author.avatarURL()
        );
    }

    public rulesButton(
        userID: string,
        labels: string[],
        pageCurrent: number,
        pageTotal: number,
        isModerator: boolean
    ): ActionRowBuilder<ButtonBuilder>[] {
        let styleArray: ButtonStyle[] = [
            ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Danger,
            ButtonStyle.Success, ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Danger,
        ];
        let isDisabledArray: boolean[] = new Array(10).fill(false);

        let indexes: number[] = Array.from(Array(10).keys());
        let filterFunction = (value: any, index: number): boolean => (indexes.indexOf(index) !== -1);

        if(isModerator && (pageTotal === 0)) {  // && (pageCurrent === 0)
            indexes = [4, 5];
        } else if(!isModerator && (pageTotal === 0)) {  // && (pageCurrent === 0)
            indexes = [];
        } else if(isModerator && (pageTotal === 1) && (pageCurrent === 0)) {
            indexes = [1, 2, 4, 5];
            isDisabledArray[1] = true;
        } else if(!isModerator && (pageTotal === 1) && (pageCurrent === 0)) {
            indexes = [1, 2, 4];
            isDisabledArray[1] = true;
        } else if(isModerator && (pageTotal === 1) && (pageCurrent === 1)) {
            indexes = [1, 2, 4, 5, 6, 9];
            isDisabledArray[2] = true;
        } else if(!isModerator && (pageTotal === 1) && (pageCurrent === 1)) {
            indexes = [1, 2, 4];
            isDisabledArray[2] = true;
        } else if(isModerator && (pageTotal >= 2) && (pageCurrent === 0)) {
            indexes = [0, 1, 2, 3, 4, 5];
            isDisabledArray[0] = true;
            isDisabledArray[1] = true;
        } else if(!isModerator && (pageTotal >= 2) && (pageCurrent === 0)) {
            indexes = [0, 1, 2, 3, 4];
            isDisabledArray[0] = true;
            isDisabledArray[1] = true;
        } else if(isModerator && (pageTotal >= 2) && (pageCurrent === 1)) {
            // all indexes
            isDisabledArray[0] = true;
            isDisabledArray[7] = true;
        } else if(!isModerator && (pageTotal >= 2) && (pageCurrent === 1)) {
            indexes = [0, 1, 2, 3, 4];
            isDisabledArray[0] = true;
        }  else if(isModerator && (pageTotal >= 2) && (pageCurrent === pageTotal)) {
            // all indexes
            isDisabledArray[2] = true;
            isDisabledArray[3] = true;
            isDisabledArray[8] = true;
        } else if(!isModerator && (pageTotal >= 2) && (pageCurrent === pageTotal)) {
            indexes = [0, 1, 2, 3, 4];
            isDisabledArray[2] = true;
            isDisabledArray[3] = true;
        } else if(isModerator && (pageTotal >= 2) && (pageCurrent < pageTotal) && (pageCurrent > 1)) {
            // all indexes
        } else if(!isModerator && (pageTotal >= 2) && (pageCurrent < pageTotal) && (pageCurrent > 1)) {
            indexes = [0, 1, 2, 3, 4];
        }

        labels = labels.filter(filterFunction);
        let emojiArray: string[] = [
            "⏮", "◀", "▶", "⏭", "✖",    // 1я, влево, вправо, последняя, удалить сообщение
            "➕", "✏", "↩", "↪", "🗑️"       // добавить, редактировать, сдвинуть влево, сдвинуть право, удалить страницу
        ].filter(filterFunction);
        styleArray = styleArray.filter(filterFunction);
        let customIDArray: string[] = [
            `rules-button-page-${userID}-99`,                   //0 смотри rules.service.ts pageButton()
            `rules-button-page-${userID}-${pageCurrent-1}`,     //1
            `rules-button-page-${userID}-${pageCurrent+1}`,
            `rules-button-page-${userID}-100`,                  //3 смотри rules.service.ts pageButton()
            `rules-button-delete-${userID}`,
            `rules-button-add-${userID}`,                       //5
            `rules-button-edit-${userID}-${pageCurrent}`,
            `rules-button-shiftLeft-${userID}-${pageCurrent}`,  //7
            `rules-button-shiftRight-${userID}-${pageCurrent}`,
            `rules-button-remove-${userID}-${pageCurrent}`      //9
        ].filter(filterFunction);
        isDisabledArray = isDisabledArray.filter(filterFunction);

        return UtilsGeneratorButton.getList(labels, emojiArray, styleArray, customIDArray, isDisabledArray);
    }

    public rulesModal(
        title: string,
        labels: string[],
        defaultValues: string[] = [],
        pageCurrentForEdit: number = -1
    ): ModalBuilder {
        return UtilsGeneratorModal.build(
            (pageCurrentForEdit === -1) ? "rules-modal-add" : `rules-modal-edit-${pageCurrentForEdit}`,
            title,
            ["rules-modal-title", "rules-modal-description", "rules-modal-tags"],
            labels,
            defaultValues,
            [TextInputStyle.Short, TextInputStyle.Paragraph, TextInputStyle.Short]
        );
    }
}
