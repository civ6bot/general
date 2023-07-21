import {ModuleBaseService} from "../base/base.service";
import {CommandInteraction, User} from "discord.js";
import {FeedbackUI} from "./feedback.ui";
import {UtilsServicePM} from "../../utils/services/utils.service.PM";

export class FeedbackService extends ModuleBaseService {
    private pmUserID: string = "352051709649879053";

    feedbackUI: FeedbackUI = new FeedbackUI();

    public async feedback(interaction: CommandInteraction, content: string) {
        let textStrings: string[] = await this.getManyText(interaction, [
            "FEEDBACK_FEEDBACK_TITLE", "FEEDBACK_FEEDBACK_SERVER_FIELD_TITLE",
            "FEEDBACK_FEEDBACK_SERVER_FIELD_CONTENT", "FEEDBACK_FEEDBACK_NOTIFY_DESCRIPTION",
            "BASE_NOTIFY_TITLE", "FEEDBACK_FEEDBACK_IMAGE_URL"
        ], [ null, null, [interaction.guild?.name as string, interaction.guild?.id as string] ]);
        interaction.reply({embeds: this.feedbackUI.notify(textStrings[4], textStrings[3]), ephemeral: true});
        let author: User = interaction.user;

        UtilsServicePM.send(this.pmUserID, this.feedbackUI.feedback(
            textStrings[0],
            content,
            {name: textStrings[1], value: textStrings[2]},
            author.username,
            author.avatarURL()
        ));
    }
}
