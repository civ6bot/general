import { EmbedBuilder } from "discord.js";
import { UtilsGeneratorEmbed } from "../../utils/generators/utils.generator.embed";
import { ModuleBaseUI } from "../base/base.ui";

export class DiscordUI extends ModuleBaseUI {
    public onGuildCreate(
        title: string,
        description: string
    ): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#FF0000",
            description,
            [],
            null,
            null,
            "https://media.discordapp.net/attachments/1022446755532525608/1040630186015739975/general-neon-circled.png"
        );
    }
}
