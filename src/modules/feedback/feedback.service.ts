import {ModuleBaseService} from "../base/base.service";
import {CommandInteraction, User} from "discord.js";
import {FeedbackUI} from "./feedback.ui";
import {UtilsServicePM} from "../../utils/services/utils.service.PM";

export class FeedbackService extends ModuleBaseService {
    feedbackUI: FeedbackUI = new FeedbackUI();

    public async feedback(interaction: CommandInteraction, content: string) {
        let textStrings: string[] = await this.getManyText(interaction, [
            "FEEDBACK_FEEDBACK_TITLE", "FEEDBACK_FEEDBACK_SERVER_FIELD_TITLE",
            "FEEDBACK_FEEDBACK_SERVER_FIELD_CONTENT", "FEEDBACK_FEEDBACK_NOTIFY_DESCRIPTION",
            "BASE_NOTIFY_TITLE", "FEEDBACK_FEEDBACK_IMAGE_URL"
        ], [ null, null, [interaction.guild?.name as string, interaction.guild?.id as string] ]);
        await interaction.reply({embeds: this.feedbackUI.notify(textStrings[4], textStrings[3]), ephemeral: true});
        let pmUserID: string = await this.getOneSettingString(interaction, "BASE_UNKNOWN_ERROR_PM_USER_ID");
        let author: User = interaction.user;

        await UtilsServicePM.send(pmUserID, this.feedbackUI.feedback(
            textStrings[0],
            content,
            {name: textStrings[1], value: textStrings[2]},
            author.tag,
            author.avatarURL()
        ));
    }

    public async about(interaction: CommandInteraction) {
        let textStrings: string[] = await this.getManyText(interaction, [
            "FEEDBACK_ABOUT_TITLE", "FEEDBACK_ABOUT_DESCRIPTION",
            "FEEDBACK_ABOUT_IMAGE_URL"
        ]);
        await interaction.reply({embeds: this.feedbackUI.about(textStrings[0], textStrings[1], textStrings[2])});
    }
}
