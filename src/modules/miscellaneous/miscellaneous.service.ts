import {CommandInteraction, Message} from "discord.js";
import {ModuleBaseService} from "../base/base.service";
import {MiscellaneousUI} from "./miscellaneous.ui";
import {UtilsServiceEmojis} from "../../utils/services/utils.service.emojis";

export class MiscellaneousService extends ModuleBaseService {
    private miscellaneousUI: MiscellaneousUI = new MiscellaneousUI();

    public async random(interaction: CommandInteraction, n: number) {
        let randomMax: number = (await this.getOneSettingNumber(interaction, "MISCELLANEOUS_RANDOM_MAX"));
        if(isNaN(n))
            n = randomMax;
        let randomValue: number = 1+Math.floor(Math.random()*n);
        let textStrings: string[] = await this.getManyText(
            interaction,
            ["MISCELLANEOUS_RANDOM_TITLE", "MISCELLANEOUS_RANDOM_BEST_DESCRIPTION",
                "MISCELLANEOUS_RANDOM_DESCRIPTION", "BASE_ERROR_TITLE", "MISCELLANEOUS_RANDOM_ERROR_BOUNDS"],
            [[n], [randomValue], [randomValue], null, [randomMax]]
        );
        if(n <= 1 || n > randomMax)
            return interaction.reply({embeds: this.miscellaneousUI.error(textStrings[3], textStrings[4]), ephemeral: true});
        interaction.reply({embeds: this.miscellaneousUI.random(textStrings[0], (randomValue === n) ? textStrings[1] : textStrings[2])});
    }

    public async coin(interaction: CommandInteraction) {
        let randomValue: boolean = Math.random() >= 0.5;
        let textStrings: string[] = await this.getManyText(
            interaction,
            ["MISCELLANEOUS_COIN_TITLE", "MISCELLANEOUS_COIN_HEADS_DESCRIPTION",
                "MISCELLANEOUS_COIN_TAILS_DESCRIPTION"]
        );
        interaction.reply({embeds: this.miscellaneousUI.coin(
            textStrings[0],
                randomValue,
                randomValue ? textStrings[1] : textStrings[2]
            )});
    }

    public async vote(interaction: CommandInteraction, voteContent: string) {
        let emojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];
        let textString: string = await this.getOneText(interaction, "MISCELLANEOUS_VOTE_TITLE");

        if(interaction.inCachedGuild()){
            let msg: Message = await interaction.reply({embeds: this.miscellaneousUI.vote(textString, voteContent), fetchReply: true});
            UtilsServiceEmojis.reactOrder(msg, emojis);
        }
    }
}
