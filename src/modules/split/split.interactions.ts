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
        interaction: CommandInteraction
    ) { await this.splitService.random(interaction, captain1, captain2); }

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
        interaction: CommandInteraction
    ) { await this.splitService.allLongSplits(interaction, "Classic", captain1, captain2); }

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
        interaction: CommandInteraction
    ) { await this.splitService.allLongSplits(interaction, "Double", captain1, captain2); }

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
        interaction: CommandInteraction
    ) { await this.splitService.allLongSplits(interaction, "CWC", captain1, captain2); }

    @ButtonComponent({id: "split-delete"})
    public async splitDelete(
        interaction: ButtonInteraction
    ) { await this.splitService.splitDelete(interaction); }
}
