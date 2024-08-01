import {ButtonComponent, Discord, Slash, SlashGroup, SlashOption} from "discordx";
import {SplitService} from "./split.service";
import {ApplicationCommandOptionType, ButtonInteraction, CommandInteraction, GuildMember} from "discord.js";

@Discord()
@SlashGroup({name: "split", description: "Split into multiple teams"})
@SlashGroup("split")
export abstract class SplitInteractions {
    private splitService: SplitService = new SplitService();

    @Slash({name: "random", description: "Split into teams randomly"})
    public async random(
        @SlashOption({
            name: "1st-captain",
            description: "choose 1st captain",
            type: ApplicationCommandOptionType.User,
            required: true,
        }) captain1: GuildMember,
        @SlashOption({
            name: "2nd-captain",
            description: "choose 2st captain (you as default)",
            type: ApplicationCommandOptionType.User,
            required: false
        }) captain2: GuildMember | null = null,
        @SlashOption({
            name: "include",
            description: "add other players to split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersInclude: string = "",
        @SlashOption({
            name: "exclude",
            description: "remove players from split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersExclude: string = "",
        @SlashOption({
            name: "only",
            description: "set only input players, captains and you to the split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.splitService.random(interaction, captain1, captain2, usersInclude, usersExclude, usersOnly); }

    @Slash({name: "rating", description: "Split into teams by average rating"})
    public async rating(
        @SlashOption({
            name: "include",
            description: "add other players to split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersInclude: string = "",
        @SlashOption({
            name: "exclude",
            description: "remove players from split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersExclude: string = "",
        @SlashOption({
            name: "only",
            description: "set only input players, captains and you to the split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.splitService.rating(interaction, usersInclude, usersExclude, usersOnly); }

    @Slash({name: "classic", description: "Split: 1-2-1-2..."})
    public async classic(
        @SlashOption({
            name: "1st-captain",
            description: "choose 1st captain",
            type: ApplicationCommandOptionType.User,
            required: true,
        }) captain1: GuildMember,
        @SlashOption({
            name: "2nd-captain",
            description: "choose 2st captain (you as default)",
            type: ApplicationCommandOptionType.User,
            required: false
        }) captain2: GuildMember | null = null,
        @SlashOption({
            name: "include",
            description: "add other players to split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersInclude: string = "",
        @SlashOption({
            name: "exclude",
            description: "remove players from split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersExclude: string = "",
        @SlashOption({
            name: "only",
            description: "set only input players, captains and you to the split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.splitService.allLongSplits(interaction, "Classic", captain1, captain2, usersInclude, usersExclude, usersOnly); }

    @Slash({name: "double", description: "Split: 1-2-2, then 1-2-1-2..."})
    public async double(
        @SlashOption({
            name: "1st-captain",
            description: "choose 1st captain",
            type: ApplicationCommandOptionType.User,
            required: true,
        }) captain1: GuildMember,
        @SlashOption({
            name: "2nd-captain",
            description: "choose 2st captain (you as default)",
            type: ApplicationCommandOptionType.User,
            required: false
        }) captain2: GuildMember | null = null,
        @SlashOption({
            name: "include",
            description: "add other players to split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersInclude: string = "",
        @SlashOption({
            name: "exclude",
            description: "remove players from split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersExclude: string = "",
        @SlashOption({
            name: "only",
            description: "set only input players, captains and you to the split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.splitService.allLongSplits(interaction, "Double", captain1, captain2, usersInclude, usersExclude, usersOnly); }

    @Slash({name: "cwc", description: "Split CWC-like"})
    public async cwc(
        @SlashOption({
            name: "1st-captain",
            description: "choose 1st captain",
            type: ApplicationCommandOptionType.User,
            required: true,
        }) captain1: GuildMember,
        @SlashOption({
            name: "2nd-captain",
            description: "choose 2st captain (you as default)",
            type: ApplicationCommandOptionType.User,
            required: false
        }) captain2: GuildMember | null = null,
        @SlashOption({
            name: "include",
            description: "add other players to split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersInclude: string = "",
        @SlashOption({
            name: "exclude",
            description: "remove players from split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersExclude: string = "",
        @SlashOption({
            name: "only",
            description: "set only input players, captains and you to the split",
            type: ApplicationCommandOptionType.String,
            required: false,
        }) usersOnly: string = "",
        interaction: CommandInteraction
    ) { this.splitService.allLongSplits(interaction, "CWC", captain1, captain2, usersInclude, usersExclude, usersOnly); }

    @ButtonComponent({id: "split-delete"})
    public async splitDeleteButton(
        interaction: ButtonInteraction
    ) { this.splitService.splitDeleteButton(interaction); }

    @ButtonComponent({id: "split-restart"})
    public async splitRestartButton(
        interaction: ButtonInteraction
    ) { this.splitService.splitRestartButton(interaction); }

    @ButtonComponent({id: "split-continue"})
    public async splitContinueButton(
        interaction: ButtonInteraction
    ) { this.splitService.splitContinueButton(interaction); }

    @ButtonComponent({id: "split-skip"})
    public async splitSkipButton(
        interaction: ButtonInteraction
    ) { this.splitService.splitSkipButton(interaction); }

    @ButtonComponent({id: "split-undo"})
    public async splitUndoButton(
        interaction: ButtonInteraction
    ) { this.splitService.splitUndoButton(interaction); }
}
