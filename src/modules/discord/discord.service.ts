import { ActivityType, ButtonInteraction, ChannelType, CommandInteraction, Guild, GuildMember, Interaction, InteractionType, Message, PermissionFlagsBits, PresenceStatus, StringSelectMenuInteraction, TextChannel } from "discord.js";
import { Client } from "discordx";
import { UtilsServiceTime } from "../../utils/services/utils.service.time";
import { ModuleBaseService } from "../base/base.service";
import { DiscordUI } from "./discord.ui";
import { discordClient } from "../../client/client";
import { DatabaseServiceInvite } from "../../database/services/service.Invite";
import { EntityInvite } from "../../database/entities/entity.Invite";

export class DiscordService extends ModuleBaseService {
    private discordUI: DiscordUI = new DiscordUI();

    private databaseServiceInvite: DatabaseServiceInvite = new DatabaseServiceInvite();

    public async onInteractionCreate(interaction: Interaction, client: Client) {
        if(!interaction.isRepliable())
            return;
        let bot: GuildMember = interaction.guild?.members.cache.get(client.user?.id as string) as GuildMember;

        let isSlashCommand: boolean = (interaction.type === InteractionType.ApplicationCommand);
        let hasPermission = (bot?.permissionsIn(interaction.channel?.id as string)?.has(PermissionFlagsBits.SendMessages) || false) 
            && (bot?.permissionsIn(interaction.channel?.id as string)?.has(PermissionFlagsBits.ViewChannel) || false);
        let isGuild: boolean = interaction.inGuild();
        
        if(!isGuild && isSlashCommand){
            let textStrings: string[] = await this.getManyText("DEFAULT", [
                "BASE_ERROR_TITLE", "DISCORD_ERROR_INTERACTION_NO_GUILD"
            ]);
            return interaction.reply({embeds: this.discordUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        if(isGuild && !hasPermission) {
            let textStrings: string[] = await this.getManyText(interaction?.guild?.id as string, [
                "BASE_ERROR_TITLE", "DISCORD_ERROR_INTERACTION_NO_PERMISSION"
            ]);
            return interaction.reply({embeds: this.discordUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        return client.executeInteraction(interaction);
    }

    public async onceReady(client: Client) {
        await client.initApplicationCommands();

        setTimeout(() => setInterval(() => {
            client.user?.setActivity({
                name: "❤️ Donate for host!"
            });
        }, UtilsServiceTime.getMs(60, "s")), UtilsServiceTime.getMs(0, "s"));

        setTimeout(() => setInterval(() => {
            client.user?.setActivity({
                name: "📄 Slash (/) to check commands."
            });
        }, UtilsServiceTime.getMs(60, "s")), UtilsServiceTime.getMs(20, "s"));

        setTimeout(() => setInterval(() => {
            client.user?.setActivity({
                name: "📣 /feedback to send message."
            });
        }, UtilsServiceTime.getMs(60, "s")), UtilsServiceTime.getMs(40, "s"));
    }

    public async onGuildCreate(guild: Guild) {
        let textStrings: string[] = await this.getManyText(guild.id, [
            "DISCORD_ON_GUILD_CREATE_TITLE", "DISCORD_MESSAGE_HEX_COLOR",
            "DISCORD_ON_GUILD_CREATE_GENERAL_DESCRIPTION", "DISCORD_THUMBNAIL_IMAGE_URL"
        ]);
        for(let channel of guild.channels.cache.values()) {
            try {
                if(channel.type === ChannelType.GuildText) {
                    await (channel as TextChannel).send({
                        embeds: this.discordUI.onGuildCreate(
                            textStrings[0], textStrings[1],
                            textStrings[2], textStrings[3]
                        )
                    });
                    return;
                }
            } catch {}
        }
    }

    public async about(interaction: CommandInteraction) {
        let textStrings: string[] = await this.getManyText(interaction, [
            "DISCORD_ON_GUILD_CREATE_TITLE", "DISCORD_MESSAGE_HEX_COLOR",
            "DISCORD_ON_GUILD_CREATE_GENERAL_DESCRIPTION", "DISCORD_THUMBNAIL_IMAGE_URL"
        ]);
        interaction.reply({embeds: this.discordUI.onGuildCreate(
            textStrings[0], textStrings[1],
            textStrings[2], textStrings[3]
        )});
    }



    // Bot guild stats
    private guildsPerPage: number = 10;

    private getGuildListByPage(page: number): Guild[] {
        return discordClient.guilds.cache
            .map((value: Guild) => value)
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice((page-1)*this.guildsPerPage, page*this.guildsPerPage);
    }

    private getGuildsTotal(): number {
        return Array.from(discordClient.guilds.cache.values()).length;
    }

    private async sendGuildListMessage(pageCurrent: number, interactionOrMessage: ButtonInteraction | StringSelectMenuInteraction | Message): Promise<void> {
        let guildShortList: Guild[] = this.getGuildListByPage(pageCurrent);
        if(guildShortList.length === 0) {
            if(pageCurrent <= 1) 
                throw "discord.service.sendGuildListMessage: 0 guilds in total."; 
            return this.sendGuildListMessage(pageCurrent-1, interactionOrMessage);
        }

        let getGuildsTotal: number = this.getGuildsTotal();
        let pagesTotal: number = Math.ceil(getGuildsTotal/this.guildsPerPage);

        let title: string = await this.getOneText("English", "DISCORD_GUILDS_TITLE", pageCurrent, pagesTotal);
        let description: string = await this.getOneText("English", "DISCORD_GUILDS_DESCRIPTION", getGuildsTotal);
        let fieldTitles: string[] = await this.getManyText("English", [
            "DISCORD_GUILDS_FIELD_GUILDNAME_TITLE", "DISCORD_GUILDS_FIELD_MEMBERS_TITLE"
        ]);
        let buttonDeleteLabel: string = await this.getOneText("English", "DISCORD_GUILDS_BUTTON_DELETE");
        let selectPlaceholder: string = await this.getOneText("English", "DISCORD_GUILDS_SELECT_PLACEHOLDER");
        let fieldValues: string[] = [
            guildShortList.map((guild) => guild.name).join("\n"),
            guildShortList.map((guild) => guild.memberCount).join("\n")
        ];
        let labels: string[] = guildShortList.map((guild) => guild.name);
        let guildIDArray: string[] = guildShortList.map((guild) => guild.id);

        let msg = {
            embeds: this.discordUI.guildListEmbed(title, description, fieldTitles, fieldValues),
            components: [
                ...this.discordUI.guildListButtons(pageCurrent, pagesTotal, buttonDeleteLabel),
                ...this.discordUI.guildListMenu(pageCurrent, selectPlaceholder, labels, guildIDArray)
            ]
        };

        // @ts-ignore
        if(interactionOrMessage?.message) {
            await (interactionOrMessage as ButtonInteraction | StringSelectMenuInteraction).deferUpdate();
            (interactionOrMessage as ButtonInteraction).message.edit(msg);
        }
        else
            (interactionOrMessage as Message).channel.send(msg);
    }

    public async onMessageCreate(message: Message) {
        const commandContentList: string[] = ["!guild", "!guilds", "!server", "!servers"];
        const ownerID: string = "352051709649879053";
        if((message.channel.type === ChannelType.DM)
        && (message.author.id === ownerID)
        && (commandContentList.indexOf(message.content) !== -1))
            this.sendGuildListMessage(1, message);
    }

    public async pageButton(interaction: ButtonInteraction) {
        let pageCurrent: number = Number(interaction.customId.split("-")[2]);
        this.sendGuildListMessage(pageCurrent, interaction);
    }

    public async pageFirstButton(interaction: ButtonInteraction) {
        this.sendGuildListMessage(1, interaction);
    }

    public async pageLastButton(interaction: ButtonInteraction) {
        let getGuildsTotal: number = this.getGuildsTotal();
        let pagesTotal: number = Math.ceil(getGuildsTotal/this.guildsPerPage);
        this.sendGuildListMessage(pagesTotal, interaction);
    }

    public async deleteButton(interaction: ButtonInteraction) {
        interaction.message.delete().catch();
    }

    public async guildInfo(interaction: StringSelectMenuInteraction | ButtonInteraction, pageCurrent: number|null = null, guildID: string|null = null) {     // discordGuilds-pageID-guildID
        if((pageCurrent === null) || (guildID === null)) {
            pageCurrent = Number((interaction as StringSelectMenuInteraction).values[0].split("-")[2]);
            guildID = (interaction as StringSelectMenuInteraction).values[0].split("-")[3];
        }
        let guild: Guild|undefined = await discordClient.guilds.fetch(guildID);
        if(!guild)
            return this.sendGuildListMessage(pageCurrent, interaction);
        let invite: EntityInvite|null = await this.databaseServiceInvite.getOne(guildID);

        let title: string = await this.getOneText("English", "DISCORD_GUILDS_INFO_TITLE");
        let fieldTitles: string[] = await this.getManyText("English", [
            "DISCORD_GUILDS_INFO_FIELD_NAME_TITLE", "DISCORD_GUILDS_INFO_FIELD_JOIN_TITLE",
            "DISCORD_GUILDS_INFO_FIELD_MEMBERS_TITLE", "DISCORD_GUILDS_INFO_FIELD_LINK_TITLE"
        ]);
        let fieldValues: string[] = [
            guild.name, 
            (await guild.members.fetch(discordClient.user?.id as string))?.joinedAt?.toLocaleString() ?? "???",
            String(guild.memberCount),
            (invite) ? invite.link : await this.getOneText("English", "DISCORD_GUILDS_INFO_FIELD_LINK_VALUE_NONE")
        ];
        let avatarURL: string|null = guild.iconURL({size: 512});
        let buttonLabels: string[] = await this.getManyText("English", [
            "DISCORD_GUILDS_INFO_BUTTON_BACK", "DISCORD_GUILDS_INFO_BUTTON_UPDATE",
            "DISCORD_GUILDS_BUTTON_DELETE"
        ]);

        await interaction.deferUpdate();
        await interaction.message.edit({
            embeds: this.discordUI.guildInfoEmbed(title, fieldTitles, fieldValues, avatarURL),
            components: this.discordUI.guildInfoButtons(pageCurrent, guildID, buttonLabels)
        });
    }

    public async updateLinkButton(interaction: ButtonInteraction) {     // discordGuilds-updateLink-pageID-guildID
        let pageCurrent: number = Number(interaction.customId.split("-")[2]);
        let guildID: string = interaction.customId.split("-")[3];

        let guild: Guild|undefined = await discordClient.guilds.fetch(guildID);
        if(!guild)
            return this.sendGuildListMessage(pageCurrent, interaction);

        let inviteURL: string|undefined = (await (guild.channels.cache 
            .filter((channel) => (channel.type === ChannelType.GuildText))
            .first() as TextChannel|undefined)
            ?.createInvite({ maxAge: 0, maxUses: 0, unique: false }))
            ?.url;
        if(inviteURL === undefined) {
            let textStrings = await this.getManyText(interaction,
                ["BASE_ERROR_TITLE", "DISCORD_GUILDS_INFO_ERROR_UPDATE_LINK"],
            );
            return interaction.reply({embeds: this.discordUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        await this.databaseServiceInvite.insertOne({guildID: guildID, link: inviteURL});

        this.guildInfo(interaction, pageCurrent, guildID);
    }
}
