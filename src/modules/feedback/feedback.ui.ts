import {ModuleBaseUI} from "../base/base.ui";
import {APIEmbedField, EmbedBuilder} from "discord.js";
import {CoreGeneratorEmbed} from "../../core/generators/core.generator.embed";

export class FeedbackUI extends ModuleBaseUI {
    public about(title: string, description: string, imageURL: string): EmbedBuilder[] {
        return CoreGeneratorEmbed.getSingle(
            title,
            "#FD91FF",
            description,
            [],
            null,
            undefined,
            null,
            imageURL
        );
    }

    public feedback(title: string, description: string, field: APIEmbedField, signBottomText: string, signBottomImageUrl: string|null): EmbedBuilder[] {
        return CoreGeneratorEmbed.getSingle(
            title,
            "#FD91FF",
            description,
            [field],
            signBottomText,
            signBottomImageUrl
        );
    }
}
