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
    ) { this.rulesService.rules(interaction, tag); }

    @ModalComponent({id: "rules-modal-add"})
    public async addModal(
        interaction: ModalSubmitInteraction
    ) { this.rulesService.addModal(interaction); }

    @ModalComponent({id: /rules-modal-edit-\d+/})   // currentPageID
    public async editModal(
        interaction: ModalSubmitInteraction
    ) { this.rulesService.editModal(interaction); }

    @ButtonComponent({id: /rules-button-page-\d+-\d+/}) // userID, pageID
    public async pageButton(
        interaction: ButtonInteraction
    ) { this.rulesService.pageButton(interaction); }

    public async deleteMessageButton(
        interaction: ButtonInteraction
    ) { this.rulesService.deleteMessageButton(interaction); }

    @ButtonComponent({id: /rules-button-add-\d+/})          // userID
    public async addButton(
        interaction: ButtonInteraction
    ) { this.rulesService.addButton(interaction); }

    @ButtonComponent({id: /rules-button-edit-\d+-\d+/})     // userID, currentPageID
    public async editButton(
        interaction: ButtonInteraction
    ) { this.rulesService.editButton(interaction); }

    @ButtonComponent({id: /rules-button-shiftLeft-\d+-\d+/})// userID, currentPageID
    public async shiftLeftButton(
        interaction: ButtonInteraction
    ) { this.rulesService.shiftLeftButton(interaction); }

    @ButtonComponent({id: /rules-button-shiftRight-\d+-\d+/})//userID, currentPageID
    public async shiftRightButton(
        interaction: ButtonInteraction
    ) { this.rulesService.shiftRightButton(interaction); }

    @ButtonComponent({id: /rules-button-remove-\d+-\d+/})   // userID, currentPageID
    public async removeButton(
        interaction: ButtonInteraction
    ) { this.rulesService.removeButton(interaction); }
}
