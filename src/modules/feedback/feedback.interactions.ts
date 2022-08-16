import {Discord, Slash, SlashOption} from "discordx";
import {FeedbackService} from "./feedback.service";
import {CommandInteraction} from "discord.js";

@Discord()
export abstract class FeedbackInteractions{
    feedbackService: FeedbackService = new FeedbackService();

    @Slash("about", { description: "Справка о боте" })
    public async about(
        interaction: CommandInteraction
    ) { await this.feedbackService.about(interaction); }

    @Slash("feedback", { description: "Отправить отзыв или ошибку о работе бота" })
    public async feedback(
        @SlashOption("содержание", { required: true }) content: string,
        interaction: CommandInteraction
    ) { await this.feedbackService.feedback(interaction, content); }
}
