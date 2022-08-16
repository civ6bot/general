import {EmbedBuilder} from "discord.js";
import {CoreGeneratorEmbed} from "../../core/generators/core.generator.embed";

export class ModuleBaseUI {
    public error(title: string, description: string): EmbedBuilder[] {
        return CoreGeneratorEmbed.getSingle(title, "#FF0000", description);
    }

    public notify(title: string, description: string): EmbedBuilder[] {
        return CoreGeneratorEmbed.getSingle(title, "#55FF55", description);
    }

    public static unknownError(title: string, errorLog: string): EmbedBuilder[] {
        return CoreGeneratorEmbed.getSingle(title, "#AA0000", errorLog);
    }
}
