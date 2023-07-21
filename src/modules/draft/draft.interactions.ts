import {ButtonComponent, Discord, Slash, SlashGroup, SlashOption} from "discordx";
import {ApplicationCommandOptionType, ButtonInteraction, CommandInteraction} from "discord.js";
import {DraftService} from "./draft.service";

@Discord()
@SlashGroup({name: "draft", description: "Get civilizations for players"})
@SlashGroup("draft")
export abstract class DraftGeneratorInteractions {
    private draftService: DraftService = new DraftService();

    @Slash( { name: "ffa", description: "Draft for FFA game" })
    public async ffa(
        @SlashOption({
            name: "civilizations-amount",
            description: "required civilizations amount for player",
            type: ApplicationCommandOptionType.Number,
            required: false
        }) civAmount: number = 0,
        @SlashOption({
            name: "bans",
            description: "write forbidden civilizations",
            type: ApplicationCommandOptionType.String,
            required: false }) bans: string = "",
        interaction: CommandInteraction
    ) { this.draftService.ffa(interaction, civAmount, bans); }

    @Slash( { name: "teamers", description: "Draft for Teamers game" })
    public async teamers(
        @SlashOption( {
            name: "teams-amount",
            description: "required amount of teams",
            type: ApplicationCommandOptionType.Number,
            required: false
        }) teamAmount: number = 2,
        @SlashOption( {
            name: "bans",
            description: "write forbidden civilizations",
            type: ApplicationCommandOptionType.String,
            required: false
        }) bans: string = "",
        interaction: CommandInteraction
    ) { this.draftService.teamers(interaction, teamAmount, bans); }

    @Slash({ name: "blind", description: "Draft for FFA game (blind mode)" })
    public async blind(
        @SlashOption({
            name: "civilizations-amount",
            description: "required civilizations amount for player",
            type: ApplicationCommandOptionType.Number,
            required: false
        }) civAmount: number = 0,
        @SlashOption( {
            name: "bans",
            description: "write forbidden civilizations",
            type: ApplicationCommandOptionType.String,
            required: false
        }) bans: string = "",
        interaction: CommandInteraction
    ) { this.draftService.blind(interaction, civAmount, bans); }

    @Slash({ name: "red-death", description: "Draft for Red Death gamemode" })
    public async redDeath(
        @SlashOption({
            name: "factions-amount",
            description: "required factions amount for player",
            type: ApplicationCommandOptionType.Number,
            required: false
        }) factionsAmount: number = 0,
        @SlashOption( {
            name: "duplicates",
            description: "are duplicates allowed?",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }) haveDuplicates: boolean = false,
        @SlashOption( {
            name: "rd-mod-factions",
            description: "are RD-mod factions allowed?",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }) isRDModEnabled: boolean = false,
        @SlashOption( {
            name: "bans",
            description: "write forbidden factions",
            type: ApplicationCommandOptionType.String,
            required: false
        }) bans: string = "",
        interaction: CommandInteraction
    ) { this.draftService.redDeath(interaction, factionsAmount, haveDuplicates, isRDModEnabled, bans); }
}

@Discord()
export abstract class DraftInteractions {
    private draftService: DraftService = new DraftService();

    @Slash( { name: "redraft", description: "Redraft vote for last draft" })
    public async redraft(
        interaction: CommandInteraction
    ){ this.draftService.redraft(interaction); }

    @ButtonComponent({id: /redraftButton-yes/})
    public async redraftButtonYes(
        interaction: ButtonInteraction
    ) { this.draftService.redraftButton(interaction, true); }

    @ButtonComponent({id: /redraftButton-no/})
    public async redraftButtonNo(
        interaction: ButtonInteraction
    ) { this.draftService.redraftButton(interaction, false); }

    // -guildID-civID
    @ButtonComponent({id: /blindButton-pick-\d+-\d+/})
    public async blindButtonPick(
        interaction: ButtonInteraction
    ) { this.draftService.blindButtonPick(interaction); }

    @ButtonComponent({id: /blindButton-delete/})
    public async blindButtonDelete(
        interaction: ButtonInteraction
    ) { this.draftService.blindButtonDelete(interaction); }
}
