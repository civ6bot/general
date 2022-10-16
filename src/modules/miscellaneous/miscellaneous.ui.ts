import {EmbedBuilder} from "discord.js";
import {UtilsGeneratorEmbed} from "../../utils/generators/utils.generator.embed";
import {ModuleBaseUI} from "../base/base.ui";

export class MiscellaneousUI extends ModuleBaseUI {
    public random(title: string, result: string): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#FF526C",
            result
        );
    }

    public coin(title: string, result: boolean, resultNote: string): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            result ? "#FFB554" : "#A0A0A0",
            resultNote
        );
    }

    public vote(title: string, question: string): EmbedBuilder[] {
        return UtilsGeneratorEmbed.getSingle(
            title,
            "#80C0C0",
            question
        );
    }
}
