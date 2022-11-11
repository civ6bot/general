import {Discord, Slash, SlashOption, ButtonComponent, ModalComponent} from "discordx";
import {ApplicationCommandOptionType, ButtonInteraction, CommandInteraction, ModalSubmitInteraction} from "discord.js";
import {RulesService} from "./rules.service";

@Discord()
export abstract class RulesInteractions {
    rulesService: RulesService = new RulesService();

    @Slash({name: "rules", description: "Get rules by tag or page number"})
    public async rules(
        @SlashOption({
            name: "tag-or-page",
            description: "tag to find rule or page number",
            type: ApplicationCommandOptionType.String,
            required: false
        }) tag: string = "",
        interaction: CommandInteraction
    ) { await this.rulesService.rules(interaction, tag); }

    @ModalComponent({id: "rules-modal-add"})
    public async addModal(
        interaction: ModalSubmitInteraction
    ) { await this.rulesService.addModal(interaction); }

    @ModalComponent({id: /rules-modal-edit-\d+/})   // currentPageID
    public async editModal(
        interaction: ModalSubmitInteraction
    ) { await this.rulesService.editModal(interaction); }

    @ButtonComponent({id: /rules-button-first-\d+/ })
    public async firstPageButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.firstPageButton(interaction); }

    @ButtonComponent({id: /rules-button-previous-\d+-\d+/}) // userID, currentPageID
    public async previousPageButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.previousPageButton(interaction); }

    @ButtonComponent({id: /rules-button-next-\d+-\d+/})     // userID, currentPageID
    public async nextPageButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.nextPageButton(interaction); }

    @ButtonComponent({id: /rules-button-last-\d+/})
    public async lastPageButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.lastPageButton(interaction); }

    @ButtonComponent({id: /rules-button-delete-\d+/})
    public async deleteMessageButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.deleteMessageButton(interaction); }

    @ButtonComponent({id: /rules-button-add-\d+/})          // userID
    public async addButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.addButton(interaction); }

    @ButtonComponent({id: /rules-button-edit-\d+-\d+/})     // userID, currentPageID
    public async editButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.editButton(interaction); }

    @ButtonComponent({id: /rules-button-shiftLeft-\d+-\d+/})// userID, currentPageID
    public async shiftLeftButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.shiftLeftButton(interaction); }

    @ButtonComponent({id: /rules-button-shiftRight-\d+-\d+/})//userID, currentPageID
    public async shiftRightButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.shiftRightButton(interaction); }

    @ButtonComponent({id: /rules-button-remove-\d+-\d+/})   // userID, currentPageID
    public async removeButton(
        interaction: ButtonInteraction
    ) { await this.rulesService.removeButton(interaction); }
}
