import {GuildMember, MessageEmbed} from "discord.js";
import {FeedbackConfig} from "./feedback.config";

export class FeedbackEmbeds{
    feedbackConfig: FeedbackConfig = new FeedbackConfig();

    about(): MessageEmbed{
        return new MessageEmbed()
            .setColor("#FD91FF")
            .setTitle("ℹ️ Справка")
            .setDescription(`— Все команды бота и их описание перечислены при написании символа \"/\" (слеш)
            — [ссылка на проект GitHub](${this.feedbackConfig.botGitHubURL})
            — для отзывов используйте команду \"/feedback\"
            — если вы хотите поддержать проект, вы можете задонатить на содержание бота
            — для связи в Discord: **ZhenjaMax#3594**`)
            .setImage(this.feedbackConfig.botImageURL)
    }

    feedback(member: GuildMember, content: string): MessageEmbed{
        return new MessageEmbed()
            .setTitle("✍ Обратная связь")
            .setColor("#FD91FF")
            .addField("🏰 Сервер", member.guild.name, true)
            .addField("🏰 ID сервера", `${member.guild.id}`, true)
            .setDescription(content);
    }
}
