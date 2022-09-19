import {ButtonComponent, Discord, Slash, SlashGroup, SlashOption} from "discordx";
import {ButtonInteraction, CommandInteraction} from "discord.js";
import {DraftService} from "./draft.service";

@Discord()
@SlashGroup({name: "draft"})
@SlashGroup("draft")
export abstract class DraftInteractionsGrouped {
    private draftService: DraftService = new DraftService();

    @Slash("ffa", { description: "Draft for FFA game" })
    public async ffa(
        @SlashOption("civilizations-amount", { required: false }) civAmount: number = 0,
        @SlashOption("bans", { required: false }) bans: string = "",
        interaction: CommandInteraction
    ) { await this.draftService.ffa(interaction, civAmount, bans); }

    @Slash("teamers", { description: "Draft for Teamers game" })
    public async teamers(
        @SlashOption("teams-amount", { required: false }) teamAmount: number = 2,
        @SlashOption("bans", { required: false }) bans: string = "",
        interaction: CommandInteraction
    ) { await this.draftService.teamers(interaction, teamAmount, bans); }

    @Slash("blind", { description: "Draft for FFA game (blind mode)" })
    public async blind(
        @SlashOption("civilizations-amount", { required: false }) civAmount: number = 0,
        @SlashOption("bans", { required: false }) bans: string = "",
        interaction: CommandInteraction
    ) { await this.draftService.blind(interaction, civAmount, bans); }
}

@Discord()
export abstract class DraftInteractions {
    private draftService: DraftService = new DraftService();

    @Slash("redraft", { description: "Redraft vote for last draft" })
    public async redraft(
        interaction: CommandInteraction
    ){ await this.draftService.redraft(interaction); }

    @ButtonComponent(/redraftButton-yes/)
    public async redraftButtonYes(
        interaction: ButtonInteraction
    ) { await this.draftService.redraftButton(interaction, true); }

    @ButtonComponent(/redraftButton-no/)
    public async redraftButtonNo(
        interaction: ButtonInteraction
    ) { await this.draftService.redraftButton(interaction, false); }

    // -guildID-civID
    @ButtonComponent(/blindButton-pick-\d+-\d+/)
    public async blindButtonPick(
        interaction: ButtonInteraction
    ) { await this.draftService.blindButtonPick(interaction); }

    @ButtonComponent(/blindButton-delete/)
    public async blindButtonDelete(
        interaction: ButtonInteraction
    ) { await this.draftService.blindButtonDelete(interaction); }
}
