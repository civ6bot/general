import {Discord, Slash, SlashOption} from "discordx";
import {FeedbackService} from "./feedback.service";
import {CommandInteraction} from "discord.js";

@Discord()
export abstract class FeedbackInteractions{
    feedbackService: FeedbackService = new FeedbackService();

    @Slash("about", { description: "Bot information" })
    public async about(
        interaction: CommandInteraction
    ) { await this.feedbackService.about(interaction); }

    @Slash("feedback", { description: "Send suggestion or feedback to developers" })
    public async feedback(
        @SlashOption("содержание", { required: true }) content: string,
        interaction: CommandInteraction
    ) { await this.feedbackService.feedback(interaction, content); }
}
