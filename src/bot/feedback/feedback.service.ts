import {CommandInteraction, GuildMember, User} from "discord.js";
import {FeedbackEmbeds} from "./feedback.embeds";
import {FeedbackConfig} from "./feedback.config";
import {BotlibEmbeds, signEmbed} from "../../botlib/botlib.embeds";
import {BotlibEmojis} from "../../botlib/botlib.emojis";
import {client} from "../../connection/client";

export class FeedbackService{
    feedbackEmbeds: FeedbackEmbeds = new FeedbackEmbeds();
    feedbackConfig: FeedbackConfig = new FeedbackConfig();
    botlibEmbeds: BotlibEmbeds = new BotlibEmbeds();
    botlibEmojis: BotlibEmojis = new BotlibEmojis();

    private static _instance: FeedbackService;
    private constructor() {}
    public static get Instance(){
        return this._instance || (this._instance = new this());
    }

    async about(interaction: CommandInteraction){ await interaction.reply({embeds: [this.feedbackEmbeds.about()]}) }

    // Шаблон для следующих команд
    async feedback(interaction: CommandInteraction, content: string){
        let owner: User = await client.users.fetch(this.feedbackConfig.ownerID);
        await owner.send({embeds: signEmbed(interaction, this.feedbackEmbeds.feedback(interaction.member as GuildMember, content))});
        await interaction.reply({embeds: this.botlibEmbeds.notify(`✍ Ваше сообщение было отправлено владельцу бота.`), ephemeral: true});
    }
}
