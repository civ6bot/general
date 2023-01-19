import {Discord, Slash, SlashOption} from "discordx";
import {FeedbackService} from "./feedback.service";
import {ApplicationCommandOptionType, CommandInteraction} from "discord.js";

@Discord()
export abstract class FeedbackInteractions{
    feedbackService: FeedbackService = new FeedbackService();

    @Slash({ name: "feedback", description: "Send suggestion or feedback to developers" })
    public async feedback(
        @SlashOption({
            name: "message",
            description: "content of your feedback",
            type: ApplicationCommandOptionType.String,
            required: true
        }) content: string,
        interaction: CommandInteraction
    ) { this.feedbackService.feedback(interaction, content); }
}
