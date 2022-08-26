import {ModuleBaseService} from "../base/base.service";
import {ButtonInteraction, CommandInteraction, GuildChannel, GuildMember, MessageReaction, User} from "discord.js";
import {SplitUI} from "./split.ui";
import {Split, SplitClassic, SplitCWC, SplitDouble, SplitRandom} from "./split.models";
import {DecorateAll} from "decorate-all";
import {SafeModuleService} from "../../core/decorators/core.decorators.SaveModuleService";
import {CoreGeneratorTimestamp} from "../../core/generators/core.generator.timestamp";

//@DecorateAll(SafeModuleService)
export class SplitService extends ModuleBaseService {
    private splitUI: SplitUI = new SplitUI();

    public static splits: Map<string, Split> = new Map<string, Split>();    // guildID

    private getUsersFromVoice(interaction: CommandInteraction): User[] {
        let member = interaction.member as GuildMember;
        let channel = member.voice.channel as GuildChannel;
        return channel
            ? Array.from(channel.members.values()).map((member: GuildMember): User =>  member.user) //.filter(user => !user.bot)
            : [];
    }

    private checkSplit(split: Split): void {
        if(split.errorReturnTag !== "")
            return;
        let key: string = split.guildID;
        let currentSplit: Split | undefined = SplitService.splits.get(key);
        if(currentSplit?.isProcessing)
            split.errorReturnTag = "SPLIT_ERROR_PROCESSING";
    }

    public async random(interaction: CommandInteraction, captain1: GuildMember, captain2: GuildMember | null = null, users: User[] = []) {
        await interaction.deferReply();
        if(users.length === 0)
            users = this.getUsersFromVoice(interaction);
        //console.log("Before constructor: ", users);
        let split: SplitRandom = new SplitRandom(interaction, [captain1.user, captain2?.user || null], users);
        this.checkSplit(split);
        if(split.errorReturnTag !== ""){
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", split.errorReturnTag]);
            return await interaction.editReply({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])});
        }

        let title: string = await this.getOneText(split.interaction, "SPLIT_RANDOM_TITLE");
        let fieldHeaders: string[] = [await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_USERS_NOT_PICKED")];
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_TEAM", i+1));

        await interaction.editReply({embeds: this.splitUI.splitEmbed(
            title,
                null,
                fieldHeaders,
                split
            )});
    }

    public async allLongSplits(interaction: CommandInteraction, type: string, captain1: GuildMember, captain2: GuildMember | null = null, users: User[] = []) {
        await interaction.deferReply();
        if(users.length === 0)
            users = this.getUsersFromVoice(interaction);
        let split: Split;
        switch(type) {
            case "Classic":
                split = new SplitClassic(interaction, [captain1.user, captain2?.user || null], users);
                break;
            case "Double":
                split = new SplitDouble(interaction, [captain1.user, captain2?.user || null], users);
                break;
            case "CWC":
            default:
                split = new SplitCWC(interaction, [captain1.user, captain2?.user || null], users);
                break;
        }
        this.checkSplit(split);
        if(split.errorReturnTag !== ""){
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", split.errorReturnTag]);
            return await interaction.editReply({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])});
        }
        SplitService.splits.set(split.guildID, split);

        split.pickTimeMs = await this.getOneSettingNumber(split.interaction, "SPLIT_PICK_TIME_MS");
        let textStrings: string[] = [];
        switch (type) {
            case "Classic":
                textStrings.push(await this.getOneText(split.interaction,
                    "SPLIT_CLASSIC_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
            case "Double":
                textStrings.push(await this.getOneText(split.interaction,
                    "SPLIT_DOUBLE_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
            case "CWC":
                textStrings.push(await this.getOneText(split.interaction,
                    "SPLIT_CWC_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
        }

        textStrings.push(...await this.getManyText(split.interaction, [
            "SPLIT_DESCRIPTION_START", "SPLIT_BUTTON_DELETE"
        ], [
            [split.captains[split.currentCaptainIndex].toString(), CoreGeneratorTimestamp.getRelativeTime(split.pickTimeMs)]
        ]));
        let fieldHeaders: string[] = [await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_USERS")];
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_TEAM", i+1));

        split.message = await interaction.editReply({embeds: this.splitUI.splitEmbed(
                textStrings[0],
                textStrings[1],
                fieldHeaders,
                split
            ), components: this.splitUI.splitDeleteButton(textStrings[2])});

        split.setTimeoutID = setTimeout(this.timeoutFunction, split.pickTimeMs, split);
        split.reactionCollector = split.message?.createReactionCollector({time: 16*split.pickTimeMs});  // максимальное число игроков
        split.reactionCollector.on("collect", async (reaction: MessageReaction, user: User) => SplitService.reactionCollectorFunction(reaction, user));
        try {   // если оно будет удалено до выставления всех эмодзи
            for(let i in split.emojis)
                await split.message.react(split.emojis[i]);
        } catch {
            SplitService.splits.delete(split.guildID);
        }
    }

    public static async reactionCollectorFunction(reaction: MessageReaction, user: User): Promise<void> {
        if(user.bot)
            return;
        let key: string = reaction.message.guild?.id as string;
        let split: Split | undefined = SplitService.splits.get(key);
        if(!split) {
            await reaction.message.delete();    // удалить сообщение
            return;
        }
        await reaction.message.reactions.resolve(reaction).users.remove(user);      // удалить реакцию пользователя
        if(user.id !== split.captains[split.currentCaptainIndex].id)
            return;

        if(split.setTimeoutID !== null) {
            clearTimeout(split.setTimeoutID);
            split.setTimeoutID = null;
        }
        await reaction.message.reactions.cache.get(
            split.pickPlayer(split.emojis.indexOf(reaction.emoji.toString()))
        )?.remove();    // удалить последнюю реакцию в списке

        let splitService: SplitService = new SplitService();
        let textStrings: string[] = [], fieldHeaders: string[] = [];
        switch(split.type) {
            case "Classic":
                textStrings.push(await splitService.getOneText(split.interaction,
                    (split.currentCaptainIndex === -1)
                        ? "SPLIT_CLASSIC_TITLE_FINISH"
                        : "SPLIT_CLASSIC_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
            case "Double":
                textStrings.push(await splitService.getOneText(split.interaction,
                    (split.currentCaptainIndex === -1)
                        ? "SPLIT_DOUBLE_TITLE_FINISH"
                        : "SPLIT_DOUBLE_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
            case "CWC":
                textStrings.push(await splitService.getOneText(split.interaction,
                    (split.currentCaptainIndex === -1)
                        ? "SPLIT_CWC_TITLE_FINISH"
                        : "SPLIT_CWC_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
        }
        textStrings.push(await splitService.getOneText(split.interaction,
            (split.currentCaptainIndex === -1)
                ? "SPLIT_DESCRIPTION_FINISH"
                : "SPLIT_DESCRIPTION_PROCESSING",
            split.currentCaptainIndex+1, split.captains[split.currentCaptainIndex]?.toString() || "",   // если -1, то всё равно выполнится
            CoreGeneratorTimestamp.getRelativeTime(split.pickTimeMs)
        ));
        fieldHeaders.push(await splitService.getOneText(split.interaction,
            (split.currentCaptainIndex === -1)
                ? "SPLIT_FIELD_TITLE_USERS_NOT_PICKED"
                : "SPLIT_FIELD_TITLE_USERS"
        ));
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await splitService.getOneText(split.interaction,
                "SPLIT_FIELD_TITLE_TEAM",
                i+1
            ));

        await reaction.message.edit({embeds: splitService.splitUI.splitEmbed(
            textStrings[0],
                textStrings[1],
                fieldHeaders,
                split
            )});
        if(split.currentCaptainIndex === -1) {
            await reaction.message.edit({components: []});
            split.reactionCollector?.stop();
            split.isProcessing = false;
            await reaction.message.reactions.removeAll();
        } else {
            split.setTimeoutID = await setTimeout(splitService.timeoutFunction, split.pickTimeMs, split);
        }
    }

    private async timeoutFunction(split: Split): Promise<void> {
        split.isProcessing = false;
        split.reactionCollector?.stop();
        let splitService: SplitService = new SplitService();
        let textStrings: string[] = [];
        switch(split.type) {
            case "Classic":
                textStrings.push(await splitService.getOneText(split.interaction, "SPLIT_CLASSIC_TITLE_FINISH"));
                break;
            case "Double":
                textStrings.push(await splitService.getOneText(split.interaction, "SPLIT_DOUBLE_TITLE_FINISH"));
                break;
            case "CWC":
                textStrings.push(await splitService.getOneText(split.interaction, "SPLIT_CWC_TITLE_FINISH"));
                break;
        }
        textStrings.push(...await splitService.getManyText(split.interaction, [
            "SPLIT_DESCRIPTION_TIMEOUT", "SPLIT_FIELD_TITLE_USERS_NOT_PICKED"
        ]));
        let fieldHeaders: string[] = [await splitService.getOneText(split.interaction, "SPLIT_FIELD_TITLE_USERS")];
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await splitService.getOneText(split.interaction, "SPLIT_FIELD_TITLE_TEAM", i+1));
        await split.interaction.editReply({components: [], embeds: splitService.splitUI.splitEmbed(
            textStrings[0],
                textStrings[1],
                fieldHeaders,
                split
            )});
        await split.message?.reactions.removeAll();
    }

    public async splitDelete(interaction: ButtonInteraction) {
        let key: string = interaction.guild?.id as string;
        let split: Split | undefined = SplitService.splits.get(key);
        if(!split)
            return await interaction.message.delete();

        if((interaction.user.id !== split.interaction.user.id) && (split.captains.map((captain: User): string => captain.id).indexOf(interaction.user.id) === -1)) {
            let textStrings = await this.getManyText(
                split.interaction,
                ["BASE_ERROR_TITLE", "SPLIT_ERROR_DELETE_BUTTON_NOT_OWNER_OR_CAPTAIN"]
            );
            return await interaction.reply({embeds: this.splitUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }

        if(split.setTimeoutID !== null) {
            clearTimeout(split.setTimeoutID);
            split.setTimeoutID = null;
        }
        split.reactionCollector?.stop();
        SplitService.splits.delete(key);
        let textStrings = await this.getManyText(
            interaction,
            ["BASE_NOTIFY_TITLE", "SPLIT_NOTIFY_DELETED"]
        );
        await interaction.reply({embeds: this.splitUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
        await interaction.message.delete();
    }
}
