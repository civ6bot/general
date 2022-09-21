import {CommandInteraction, GuildChannel, GuildMember, User} from "discord.js";

export class CoreServiceUsers {
    public static getFromVoice(interaction: CommandInteraction): User[] {
        let member = interaction.member as GuildMember;
        let channel = member.voice.channel as GuildChannel;
        return channel
            ? Array.from(channel.members.values())
                .map((member: GuildMember): User =>  member.user)
                .filter(user => !user.bot)
            : [];
    }

    public static isAdmin(member: GuildMember): boolean {
        return member.permissions.has("Administrator");
    }

    // Раньше Modals не работали
    // сейчас этот метод не нужен
    public static isUserPhone(member: GuildMember): boolean {
        return Boolean(member.presence?.clientStatus?.web);
    }
}
