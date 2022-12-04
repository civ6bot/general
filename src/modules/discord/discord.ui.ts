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
            "#920000",
            description,
            [],
            null,
            null,
            "https://media.discordapp.net/attachments/795265098159357953/1048989911241461831/general.png?width=494&height=494"
        );
    }
}
