import {ModuleBaseService} from "../base/base.service";
import {CommandInteraction, User} from "discord.js";
import {SafeModuleServiceDeferReply} from "../../core/decorators/core.decorators.SaveModuleServiceDeferReply";
import {FeedbackUI} from "./feedback.ui";
import {CoreServicePM} from "../../core/services/core.service.PM";

export class FeedbackService extends ModuleBaseService {
    feedbackUI: FeedbackUI = new FeedbackUI();

    @SafeModuleServiceDeferReply(true)
    public async feedback(interaction: CommandInteraction, content: string) {
        let textStrings: string[] = await this.getManyText(interaction, [
            "FEEDBACK_FEEDBACK_TITLE", "FEEDBACK_FEEDBACK_SERVER_FIELD_TITLE",
            "FEEDBACK_FEEDBACK_SERVER_FIELD_CONTENT", "FEEDBACK_FEEDBACK_NOTIFY_DESCRIPTION",
            "BASE_NOTIFY_TITLE", "FEEDBACK_FEEDBACK_IMAGE_URL"
        ], [ null, null, [interaction.guild?.name as string, interaction.guild?.id as string] ]);
        await interaction.editReply({embeds: this.feedbackUI.notify(textStrings[4], textStrings[3])});
        let pmUserID: string = await this.getOneSettingString(interaction, "BASE_UNKNOWN_ERROR_PM_USER_ID");
        let author: User = interaction.user;

        await CoreServicePM.send(pmUserID, this.feedbackUI.feedback(
            textStrings[0],
            content,
            {name: textStrings[1], value: textStrings[2]},
            author.tag,
            author.avatarURL()
        ));
    }

    @SafeModuleServiceDeferReply()
    public async about(interaction: CommandInteraction) {
        let textStrings: string[] = await this.getManyText(interaction, [
            "FEEDBACK_ABOUT_TITLE", "FEEDBACK_ABOUT_DESCRIPTION",
            "FEEDBACK_ABOUT_IMAGE_URL"
        ]);
        await interaction.editReply({embeds: this.feedbackUI.about(textStrings[0], textStrings[1], textStrings[2])});
    }
}
