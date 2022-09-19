import {Discord, Slash, SelectMenuComponent, ModalComponent, ButtonComponent} from "discordx";
import {ButtonInteraction, CommandInteraction, ModalSubmitInteraction, SelectMenuInteraction} from "discord.js";
import {DynamicConfigService} from "./dynamicConfig.service";

@Discord()
export abstract class DynamicConfigInteractions {
    private dynamicConfigService: DynamicConfigService = new DynamicConfigService();

    @Slash("config", { description: "Edit server settings" })
    public async config(
        interaction: CommandInteraction
    ) { await this.dynamicConfigService.config(interaction); }

    @SelectMenuComponent("dynamicConfig-menu")
    public async menu(
        interaction: SelectMenuInteraction
    ) { await this.dynamicConfigService.menu(interaction); }

    @ModalComponent("dynamicConfig-modal")
    public async modalSetting(
        interaction: ModalSubmitInteraction
    ) { await this.dynamicConfigService.modalSetting(interaction); }

    @ButtonComponent("dynamicConfig-button-reset")
    public async resetButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.resetButton(interaction); }

    @ButtonComponent("dynamicConfig-button-delete")
    public async deleteButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.deleteButton(interaction); }

    @ButtonComponent("dynamicConfig-button-first")
    public async firstPageButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.firstPageButton(interaction); }

    @ButtonComponent("dynamicConfig-button-previous")
    public async previousPageButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.previousPageButton(interaction); }

    @ButtonComponent("dynamicConfig-button-next")
    public async nextPageButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.nextPageButton(interaction); }

    @ButtonComponent("dynamicConfig-button-last")
    public async lastPageButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.lastPageButton(interaction); }

    @ButtonComponent("dynamicConfig-button-back")
    public async backButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.backButton(interaction); }

    @ButtonComponent("dynamicConfig-button-reset-confirm")
    public async resetConfirmButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.resetConfirmButton(interaction); }

    @ButtonComponent("dynamicConfig-button-reset-deny")
    public async resetDenyButton(
        interaction: ButtonInteraction
    ) { await this.dynamicConfigService.resetDenyButton(interaction); }
}
