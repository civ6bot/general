import {CommandInteraction, Message, MessageEmbed} from "discord.js";
import {MiscellaneousEmbeds } from "./miscellaneous.embeds";
import {BotlibEmbeds, signEmbed} from "../../botlib/botlib.embeds";
import {MiscellaneousConfig} from "./miscellaneous.config";
import {BotlibEmojis} from "../../botlib/botlib.emojis";

export class MiscellaneousService {
    miscellaneousEmbeds: MiscellaneousEmbeds = new MiscellaneousEmbeds();
    miscellaneousConfig: MiscellaneousConfig = new MiscellaneousConfig();
    botlibEmbeds: BotlibEmbeds = new BotlibEmbeds();
    botlibEmojis: BotlibEmojis = new BotlibEmojis();

    private static _instance: MiscellaneousService;
    private constructor() {}
    public static get Instance(){
        return this._instance || (this._instance = new this());
    }

    async getRandom(interaction: CommandInteraction, n: number){
        if(n < this.miscellaneousConfig.randomMin || n > this.miscellaneousConfig.randomMax)
            return await interaction.reply({embeds: this.botlibEmbeds.error(`Введите целое число от ${this.miscellaneousConfig.randomMin} до ${this.miscellaneousConfig.randomMax}.`)});
        return await interaction.reply({
            embeds: signEmbed(interaction, this.miscellaneousEmbeds.random(n, 1+Math.floor(Math.random()*n)))
        });
    }

    async flipCoin(interaction: CommandInteraction){
        let msg: MessageEmbed = Math.random() >= 0.5 ? this.miscellaneousEmbeds.heads() : this.miscellaneousEmbeds.tails() as MessageEmbed;
        return await interaction.reply({
            embeds: signEmbed(interaction, msg)
        });
    }

    async getVote(interaction: CommandInteraction, voteContent: string){
        let msg = await interaction.reply({
            embeds: signEmbed(interaction, this.miscellaneousEmbeds.vote(voteContent)),
            fetchReply: true
        }) as Message;
        await msg.react(this.botlibEmojis.yes);
        await msg.react(this.botlibEmojis.no);
    }
}
