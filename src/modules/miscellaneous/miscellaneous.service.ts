import {DecorateAll} from "decorate-all";
import {SafeModuleServiceDeferReply} from "../../core/decorators/core.decorators.SaveModuleServiceDeferReply";
import {CommandInteraction, Message} from "discord.js";
import {ModuleBaseService} from "../base/base.service";
import {MiscellaneousUI} from "./miscellaneous.ui";
import {CoreServiceEmojis} from "../../core/services/core.service.emojis";

@DecorateAll(SafeModuleServiceDeferReply())
export class MiscellaneousService extends ModuleBaseService {
    private miscellaneousUI: MiscellaneousUI = new MiscellaneousUI();

    public async random(interaction: CommandInteraction, n: number) {
        let randomValue: number = 1+Math.floor(Math.random()*n);
        let randomMax: number = (await this.getOneSettingNumber(interaction, "MISCELLANEOUS_RANDOM_MAX"));
        let textStrings: string[] = await this.getManyText(
            interaction,
            ["MISCELLANEOUS_RANDOM_TITLE", "MISCELLANEOUS_RANDOM_BEST_DESCRIPTION",
                "MISCELLANEOUS_RANDOM_DESCRIPTION", "BASE_ERROR_TITLE", "MISCELLANEOUS_RANDOM_ERROR_BOUNDS"],
            [[n], [randomValue], [randomValue], null, [randomMax]]
        );
        if(n <= 1 || n > randomMax)
            return await interaction.editReply({embeds: this.miscellaneousUI.error(textStrings[3], textStrings[4])});
        await interaction.editReply({embeds: this.miscellaneousUI.random(textStrings[0], (randomValue === n) ? textStrings[1] : textStrings[2])});
    }

    public async coin(interaction: CommandInteraction) {
        let randomValue: boolean = Math.random() >= 0.5;
        let textStrings: string[] = await this.getManyText(
            interaction,
            ["MISCELLANEOUS_COIN_TITLE", "MISCELLANEOUS_COIN_HEADS_DESCRIPTION",
                "MISCELLANEOUS_COIN_TAILS_DESCRIPTION"]
        );
        await interaction.editReply({embeds: this.miscellaneousUI.coin(
            textStrings[0],
                randomValue,
                randomValue ? textStrings[1] : textStrings[2]
            )});
    }

    public async vote(interaction: CommandInteraction, voteContent: string) {
        let emojis: string[] = await this.getManySettingString(interaction, "BASE_EMOJI_YES", "BASE_EMOJI_NO");
        let textString: string = await this.getOneText(interaction, "MISCELLANEOUS_VOTE_TITLE");

        if(interaction.inCachedGuild()){
            let msg: Message = await interaction.editReply({embeds: this.miscellaneousUI.vote(textString, voteContent)});
            await CoreServiceEmojis.reactOrder(msg, emojis);
        }
    }
}
