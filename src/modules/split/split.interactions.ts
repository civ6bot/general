import {ButtonComponent, Discord, Slash, SlashGroup, SlashOption} from "discordx";
import {SplitService} from "./split.service";
import {ApplicationCommandOptionType, ButtonInteraction, CommandInteraction, GuildMember} from "discord.js";

@Discord()
@SlashGroup({name: "split"})
@SlashGroup("split")
export abstract class SplitInteractions {
    private splitService: SplitService = new SplitService();

    @Slash("random", {description: "Разделение случайным образом"})
    public async random(
        @SlashOption("1й-капитан", { required: true, type: ApplicationCommandOptionType.User }) captain1: GuildMember,
        @SlashOption("2й-капитан", { required: false, type: ApplicationCommandOptionType.User }) captain2: GuildMember | null = null,
        interaction: CommandInteraction
    ) { await this.splitService.random(interaction, captain1, captain2); }

    @Slash("classic", {description: "Разделение 1-2-1-2..."})
    public async classic(
        @SlashOption("1й-капитан", { required: true, type: ApplicationCommandOptionType.User }) captain1: GuildMember,
        @SlashOption("2й-капитан", { required: false, type: ApplicationCommandOptionType.User }) captain2: GuildMember | null = null,
        interaction: CommandInteraction
    ) { await this.splitService.allLongSplits(interaction, "Classic", captain1, captain2); }

    @Slash("double", {description: "Разделение по командам: 1-2-2, затем 1-2-1-2..."})
    public async double(
        @SlashOption("1й-капитан", { required: true, type: ApplicationCommandOptionType.User }) captain1: GuildMember,
        @SlashOption("2й-капитан", { required: false, type: ApplicationCommandOptionType.User }) captain2: GuildMember | null = null,
        interaction: CommandInteraction
    ) { await this.splitService.allLongSplits(interaction, "Double", captain1, captain2); }

    @Slash("cwc", {description: "Разделение, подобное формату драфта CWC"})
    public async cwc(
        @SlashOption("1й-капитан", { required: true, type: ApplicationCommandOptionType.User }) captain1: GuildMember,
        @SlashOption("2й-капитан", { required: false, type: ApplicationCommandOptionType.User }) captain2: GuildMember | null = null,
        interaction: CommandInteraction
    ) { await this.splitService.allLongSplits(interaction, "CWC", captain1, captain2); }

    @ButtonComponent(/split-delete/)
    public async splitDelete(
        interaction: ButtonInteraction
    ) { await this.splitService.splitDelete(interaction); }
}
