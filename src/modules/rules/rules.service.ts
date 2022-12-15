import {
    ActionRowBuilder, ButtonBuilder,
    ButtonInteraction,
    CommandInteraction,
    GuildMember,
    ModalSubmitInteraction,
    InteractionType,
    TextInputComponent
} from "discord.js";
import {ModuleBaseService} from "../base/base.service";
import {RulesUI} from "./rules.ui";
import {UtilsServiceUsers} from "../../utils/services/utils.service.users";
import {DatabaseServiceRulePage} from "../../database/services/service.RulePage";
import {EntityRulePage} from "../../database/entities/entity.RulePage";

export class RulesService extends ModuleBaseService {
    private rulesUI: RulesUI = new RulesUI();
    private databaseServiceRulePage: DatabaseServiceRulePage = new DatabaseServiceRulePage();
    private pageTotalMax: number = 20;

    private async isModerator(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction): Promise<boolean> {
        let member: GuildMember = interaction.member as GuildMember;
        if(UtilsServiceUsers.isAdmin(member))
            return true;
        let moderationRolesID: string[] = (await this.getOneSettingString(
            interaction, "MODERATION_ROLE_MODERATORS_ID"
        )).split(" ");
        return member.roles.cache.some((value, key) => (moderationRolesID.indexOf(key) !== -1));
    }

    private async getButtonsComponent(
        interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, 
        pageCurrent: number, 
        pageTotal: number, 
        isModerator: boolean
    ): Promise<ActionRowBuilder<ButtonBuilder>[]> {
        let buttonLabels: string[] = await this.getManyText(interaction, [
            "RULES_BUTTON_FIRST", "RULES_BUTTON_PREVIOUS",
            "RULES_BUTTON_NEXT", "RULES_BUTTON_LAST",
            "RULES_BUTTON_DELETE_MESSAGE", "RULES_BUTTON_ADD",
            "RULES_BUTTON_EDIT", "RULES_BUTTON_SHIFT_LEFT",
            "RULES_BUTTON_SHIFT_RIGHT", "RULES_BUTTON_REMOVE"
        ]);

        return this.rulesUI.rulesButton(
            interaction.user.id,
            buttonLabels,
            pageCurrent,
            pageTotal,
            isModerator
        );
    }

    private async replyCover(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, isModerator: boolean): Promise<void> {
        let entitiesPageRules: EntityRulePage[] = await this.databaseServiceRulePage.getAll(interaction.guild?.id as string);
        let pageTotal: number = entitiesPageRules.length;
        let textStrings: string[] = await this.getManyText(interaction, [
            "RULES_COVER_TITLE", (pageTotal === 0) ? "RULES_COVER_DESCRIPTION_HEADER_ZERO" : "RULES_COVER_DESCRIPTION_HEADER"
        ]);

        (interaction.type === InteractionType.ApplicationCommand)
            ? await (interaction as CommandInteraction).reply({
                embeds: this.rulesUI.rulesCoverEmbed(textStrings[0], textStrings[1], entitiesPageRules, interaction.user),
                components: await this.getButtonsComponent(interaction, 0, pageTotal, isModerator),
                ephemeral: (pageTotal === 0) && !isModerator
            })
            : await (interaction as ButtonInteraction).message.edit({
                embeds: this.rulesUI.rulesCoverEmbed(textStrings[0], textStrings[1], entitiesPageRules, interaction.user),
                components: await this.getButtonsComponent(interaction, 0, pageTotal, isModerator)
            });
    }

    private async replyPage(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, page: EntityRulePage, isModerator: boolean): Promise<void> {
        let tagTitle: string = await this.getOneText(interaction, "RULES_FIELD_TAGS_TITLE");
        let pageTotal: number = await this.databaseServiceRulePage.getAllLength(interaction.guild?.id as string);

        (interaction.type === InteractionType.ApplicationCommand)
            ? await (interaction as CommandInteraction).reply({
                embeds: this.rulesUI.rulesPageEmbed(page, tagTitle, interaction.user),
                components: await this.getButtonsComponent(interaction, page.pageNumber, pageTotal, isModerator)
            })
            : await (interaction as ButtonInteraction|ModalSubmitInteraction).message?.edit({
                embeds: this.rulesUI.rulesPageEmbed(page, tagTitle, interaction.user),
                components: await this.getButtonsComponent(interaction, page.pageNumber, pageTotal, isModerator)
            });
    }

    private async isOwner(interaction: ButtonInteraction): Promise<boolean> {
        let ownerID: string = interaction.customId.split("-")[3] || "";
        return (interaction.user.id === ownerID);
    }

    public async rules(interaction: CommandInteraction, tag: string) {
        let isModerator: boolean = await this.isModerator(interaction);
        let pageNumber: number = Number(tag);
        let page: EntityRulePage | null = (pageNumber > 0)
            ? await this.databaseServiceRulePage.getOneByPageNumber(interaction.guild?.id as string, pageNumber)
            : await this.databaseServiceRulePage.getOneByTag(interaction.guild?.id as string, tag);
        (page === null)
            ? await this.replyCover(interaction, isModerator)
            : await this.replyPage(interaction, page, isModerator);
    }

    //rules-modal-add
    public async addModal(interaction: ModalSubmitInteraction) {
        let isModerator: boolean = await this.isModerator(interaction);
        let currentPage: number = (await this.databaseServiceRulePage.getAllLength(interaction.guild?.id as string))+1;
        let values: string[] = Array.from(interaction.fields.fields.values()).map((component: TextInputComponent): string => component.value);
        
        let page: EntityRulePage = new EntityRulePage();
        page.guildID = interaction.guild?.id as string;
        page.pageNumber = currentPage;
        page.title = values[0].trim();
        page.description = values[1].trim();
        page.tags = values[2].replaceAll(",", " ").split(" ").filter(str => str !== "").join(" ");
        
        if((page.title.length === 0) || (page.description.length === 0) || (page.tags.length === 0)) {
            let textStrings: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", "RULES_ERROR_EMPTY_INPUT"
            ], [null, [this.pageTotalMax]]);
            return interaction.reply({
                embeds: this.rulesUI.error(textStrings[0], textStrings[1]),
                ephemeral: true
            });
        }

        await this.databaseServiceRulePage.insertOne(page);
        await this.replyPage(interaction, page, isModerator);
        await interaction.deferUpdate();
    }

    //rules-modal-edit
    public async editModal(interaction: ModalSubmitInteraction) {
        let isModerator: boolean = await this.isModerator(interaction);
        let pageCurrent: number = Number(interaction.customId.split("-")[3]);
        let values: string[] = Array.from(interaction.fields.fields.values()).map((component: TextInputComponent): string => component.value);
        let page: EntityRulePage|null = await this.databaseServiceRulePage.getOneByPageNumber(interaction.guild?.id as string, pageCurrent);
        if(page === null)
            return await interaction.deferUpdate();
        
        page.title = values[0].trim();
        page.description = values[1].trim();
        page.tags = values[2].replaceAll(",", " ").split(" ").filter(str => str !== "").join(" ");
        
        if((page.title.length === 0) || (page.description.length === 0) || (page.tags.length === 0)) {
            let textStrings: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", "RULES_ERROR_EMPTY_INPUT"
            ], [null, [this.pageTotalMax]]);
            return interaction.reply({
                embeds: this.rulesUI.error(textStrings[0], textStrings[1]),
                ephemeral: true
            });
        }

        await this.databaseServiceRulePage.update(page);
        await this.replyPage(interaction, page, isModerator);
        await interaction.deferUpdate();
    }

    // rules-button-page-userID-pageID
    public async pageButton(interaction: ButtonInteraction) {
        if(!await this.isOwner(interaction))
            return await interaction.deferUpdate();
        let pageTotal: number = await this.databaseServiceRulePage.getAllLength(interaction.guild?.id as string);
        
        let pageCurrent: number = Number(interaction.customId.split("-")[4]);
        switch(pageCurrent) {
            case 99:                            // нельзя использовать одинаковые ID кнопок
                pageCurrent = 1; break;         // поэтому чтобы избежать повторений, было сделано это
            case 100:
                pageCurrent = pageTotal; break;
            default:
                pageCurrent = Math.min(Math.max(pageCurrent, 0), pageTotal); break;
        }
            
        let isModerator: boolean = await this.isModerator(interaction);
        let page: EntityRulePage|null = (pageCurrent === 0)
            ? null
            : await this.databaseServiceRulePage.getOneByPageNumber(interaction.guild?.id as string, pageCurrent);
        (page === null)
            ? await this.replyCover(interaction, isModerator)
            : await this.replyPage(interaction, page, isModerator);
        await interaction.deferUpdate();
    }

    //rules-button-delete
    public async deleteMessageButton(interaction: ButtonInteraction) {
        (await this.isOwner(interaction))
            ? await interaction.message.delete()
            : await interaction.deferUpdate();
    }

    //rules-button-add
    public async addButton(interaction: ButtonInteraction) {
        if(!await this.isOwner(interaction) || !await this.isModerator(interaction))
            return await interaction.deferUpdate();
        let pageTotal: number = await this.databaseServiceRulePage.getAllLength(interaction.guild?.id as string);
        if(pageTotal >= this.pageTotalMax) {
            let textStrings: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", "RULES_ERROR_MAX_PAGES"
            ], [null, [this.pageTotalMax]]);
            return await interaction.reply({
                embeds: this.rulesUI.error(textStrings[0], textStrings[1]),
                ephemeral: true
            });
        }
        let title: string = await this.getOneText(interaction, "RULES_BUTTON_MODAL_ADD");
        let labels: string[] = await this.getManyText(interaction, [
            "RULES_MODAL_TITLE", "RULES_MODAL_TEXT",
            "RULES_MODAL_TAGS"
        ]);
        await interaction.showModal(this.rulesUI.rulesModal(title, labels));
    }

    //rules-button-edit
    public async editButton(interaction: ButtonInteraction) {
        if(!await this.isOwner(interaction) || !await this.isModerator(interaction))
            return await interaction.deferUpdate();

        let pageCurrent: number = Number(interaction.customId.split("-")[4]);
        let page: EntityRulePage|null = await this.databaseServiceRulePage.getOneByPageNumber(interaction.guild?.id as string, pageCurrent);
        if(page === null)
            return await interaction.deferUpdate();
        let title: string = await this.getOneText(interaction, "RULES_BUTTON_MODAL_EDIT");
        let labels: string[] = await this.getManyText(interaction, [
            "RULES_MODAL_TITLE", "RULES_MODAL_TEXT",
            "RULES_MODAL_TAGS"
        ]);
        await interaction.showModal(this.rulesUI.rulesModal(
            title,
            labels,
            [page.title, page.description, page.tags],
            pageCurrent
        ));
    }

    //rules-button-shiftLeft
    public async shiftLeftButton(interaction: ButtonInteraction) {
        let isModerator: boolean = await this.isModerator(interaction);
        if(!await this.isOwner(interaction) || !isModerator)
            return await interaction.deferUpdate();
        
        let pageCurrent: number = Number(interaction.customId.split("-")[4]);
        if(!(pageCurrent > 0))
            return await interaction.deferUpdate();

        let page: EntityRulePage|null = await this.databaseServiceRulePage.getOneByPageNumber(interaction.guild?.id as string, pageCurrent);
        if(page !== null) {
            page = await this.databaseServiceRulePage.shiftLeft(page);
            await this.replyPage(interaction, page, isModerator);
        }
        await interaction.deferUpdate();
    }

    //rules-button-shiftRight
    public async shiftRightButton(interaction: ButtonInteraction) {
        let isModerator: boolean = await this.isModerator(interaction);
        if(!await this.isOwner(interaction) || !isModerator)
            return await interaction.deferUpdate();
        
        let pageCurrent: number = Number(interaction.customId.split("-")[4]);
        let pageTotal: number = await this.databaseServiceRulePage.getAllLength(interaction.guild?.id as string);
        if(!(pageCurrent < pageTotal))
            return await interaction.deferUpdate();

        let page: EntityRulePage|null = await this.databaseServiceRulePage.getOneByPageNumber(interaction.guild?.id as string, pageCurrent);
        if(page !== null) {
            page = await this.databaseServiceRulePage.shiftRight(page);
            await this.replyPage(interaction, page, isModerator);
        }
        await interaction.deferUpdate();
    }

    //rules-button-remove
    public async removeButton(interaction: ButtonInteraction) {
        let isModerator: boolean = await this.isModerator(interaction);
        if(!await this.isOwner(interaction) || !isModerator)
            return await interaction.deferUpdate();
        
        let pageCurrent: number = Number(interaction.customId.split("-")[4]);
        let pageTotal: number = await this.databaseServiceRulePage.getAllLength(interaction.guild?.id as string);
        let page: EntityRulePage|null = await this.databaseServiceRulePage.getOneByPageNumber(interaction.guild?.id as string, pageCurrent);
        if(page === null)
            return await interaction.deferUpdate();
        await this.databaseServiceRulePage.removeOne(page);
        
        pageCurrent = Math.max(pageTotal, pageCurrent);
        page = await this.databaseServiceRulePage.getOneByPageNumber(interaction.guild?.id as string, pageCurrent);
        (page === null)
            ? await this.replyCover(interaction, isModerator)
            : await this.replyPage(interaction, page, isModerator);
        await interaction.deferUpdate();
    }
}
