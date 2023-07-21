import { ButtonInteraction, CommandInteraction, StringSelectMenuInteraction } from "discord.js";
import {ArgsOf, ButtonComponent, Client, Discord, On, Once, SelectMenuComponent, Slash} from "discordx";
import {DiscordService} from "./discord.service";

@Discord()
export abstract class DiscordEvents {
    private discordService: DiscordService = new DiscordService();

    @On({event: "interactionCreate"})
    public async onInteractionCreate([interaction]: ArgsOf<"interactionCreate">, client: Client) {
        this.discordService.onInteractionCreate(interaction, client);
    }

    @Slash({ name: "about", description: "Bot information" })
    public async about(
        interaction: CommandInteraction
    ) { this.discordService.about(interaction); }

    @Once({event: "ready"})
    public async onceReady([clientArg]: ArgsOf<"ready">, client: Client) {
        this.discordService.onceReady(client);
    }

    @On({event: "guildCreate"})
    public async onGuildCreate([guild]: ArgsOf<"guildCreate">, client: Client) {
        this.discordService.onGuildCreate(guild);
    }

    @On({event: "messageCreate"})
    public async onMessageCreate([message]: ArgsOf<"messageCreate">, client: Client) {
        this.discordService.onMessageCreate(message);
    }

    @ButtonComponent({id: /discordGuilds-page-\d+/})
    public async pageButton(
        interaction: ButtonInteraction
    ) { await this.discordService.pageButton(interaction); }

    @ButtonComponent({id: "discordGuilds-page-first"})
    public async pageFirstButton(
        interaction: ButtonInteraction
    ) { await this.discordService.pageFirstButton(interaction); }

    @ButtonComponent({id: "discordGuilds-page-last"})
    public async pageLastButton(
        interaction: ButtonInteraction
    ) { await this.discordService.pageLastButton(interaction); }

    @ButtonComponent({id: "discordGuilds-delete"})
    public async deleteButton(
        interaction: ButtonInteraction
    ) { await this.discordService.deleteButton(interaction); }

    @SelectMenuComponent({id: "discordGuilds-menu"})     // discordGuilds-pageID-guildID
    public async guildInfo(
        interaction: StringSelectMenuInteraction
    ) { await this.discordService.guildInfo(interaction); }

    @ButtonComponent({id: /discordGuilds-updateLink-\d+-\d+/})  // discordGuilds-updateLink-pageID-guildID
    public async updateLinkButton(
        interaction: ButtonInteraction
    ) { await this.discordService.updateLinkButton(interaction); }
}
