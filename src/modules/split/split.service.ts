import {ModuleBaseService} from "../base/base.service";
import {ButtonInteraction, ChannelType, CommandInteraction, GuildMember, MessageReaction, User, VoiceChannel} from "discord.js";
import {SplitUI} from "./split.ui";
import {Split, SplitClassic, SplitCWC, SplitDouble, SplitRandom} from "./split.models";
import {UtilsGeneratorTimestamp} from "../../utils/generators/utils.generator.timestamp";
import {UtilsServiceEmojis} from "../../utils/services/utils.service.emojis";
import {UtilsServiceUsers} from "../../utils/services/utils.service.users";
import {SplitAdapter} from "./split.adapter";
import {UtilsServicePM} from "../../utils/services/utils.service.PM";
import {UtilsServiceLetters} from "../../utils/services/utils.service.letters";

export class SplitService extends ModuleBaseService {
    private splitUI: SplitUI = new SplitUI();
    public splitAdapter: SplitAdapter = new SplitAdapter();

    public static splits: Map<string, Split> = new Map<string, Split>();    // guildID

    private async checkButtonPermission(interaction: ButtonInteraction, split: Split): Promise<boolean> {
        if((interaction.user.id === split.interaction.user.id) || (split.captains.map((captain: User): string => captain.id).indexOf(interaction.user.id) !== -1)) 
            return true;
        
        let textStrings = await this.getManyText(
            split.interaction,
            ["BASE_ERROR_TITLE", "SPLIT_ERROR_DELETE_BUTTON_NOT_OWNER_OR_CAPTAIN"]
        );
        await interaction.reply({embeds: this.splitUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        return false;
    }

    private checkSplit(split: Split): void {
        if(split.errorReturnTag !== "")
            return;
        let key: string = split.guildID;
        let currentSplit: Split | undefined = SplitService.splits.get(key);
        if(currentSplit?.isProcessing)
            split.errorReturnTag = "SPLIT_ERROR_PROCESSING";
    }

    public async random(
        interaction: CommandInteraction,
        captain1: GuildMember, captain2: GuildMember | null = null,
        users: User[] = [],
        outerSplit: SplitRandom | null = null
    ) {
        let split: SplitRandom;
        if(outerSplit)
            split = outerSplit;
        else {
            if(users.length === 0)
                users = UtilsServiceUsers.getFromVoice(interaction);
            split = new SplitRandom(interaction, [captain1.user, captain2?.user || null], users);
        }
        this.checkSplit(split);
        if(split.errorReturnTag !== ""){
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", split.errorReturnTag]);
            if(outerSplit) {
                (split.thread)
                    ? await split.thread.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
                    : await interaction.channel?.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
            } else
                await interaction.reply({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])});
            return;
        }

        let title: string = await this.getOneText(split.interaction, "SPLIT_RANDOM_TITLE");
        let fieldHeaders: string[] = [await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_USERS_NOT_PICKED")];
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_TEAM", i+1));

        if (outerSplit) {
            if(split.thread)
                await split.thread.send({embeds: this.splitUI.splitEmbed(
                        title,
                        null,
                        fieldHeaders,
                        split
                    )});
            else
                await interaction.channel?.send({embeds: this.splitUI.splitEmbed(
                    title,
                        null,
                        fieldHeaders,
                        split
                    )});
        } else
            await interaction.reply({embeds: this.splitUI.splitEmbed(
                title,
                    null,
                    fieldHeaders,
                    split
                )});
        if(split.bansForDraft !== null) {
            if(await this.getOneSettingNumber(split.interaction, "SPLIT_MOVE_TEAM_VOICE_CHANNEL")) {
                let destinationChannel: VoiceChannel | undefined = (await this.getOneSettingString(split.interaction, "GAME_TEAMERS_VOICE_CHANNELS"))
                    .split(" ")
                    .filter(id => id !== "")
                    .map(id => split.interaction.guild?.channels.cache.get(id))
                    .filter(channel => !!channel && (channel?.type === ChannelType.GuildVoice))
                    .map(channel => channel as VoiceChannel)
                    .filter(channel => Array.from(channel.members.keys()).length === 0)[0];
                if(destinationChannel) {
                    split.teams[1].forEach(id => {
                        let member: GuildMember | undefined = (split as Split).interaction.guild?.members.cache.get(id.slice(2, -1));
                        if(member?.voice.channel?.id)
                            try {
                                member?.voice.setChannel(destinationChannel as VoiceChannel);
                            } catch {}
                    });
                }
            }
            await this.splitAdapter.callDraft(split);
        }
    }

    public async allLongSplits(
        interaction: CommandInteraction, type: string,
        captain1: GuildMember,
        captain2: GuildMember | null = null,
        users: User[] = [],
        outerSplit: Split | null = null
    ) {
        let split: Split;
        if(outerSplit)
            split = outerSplit;
        else {
            await interaction.deferReply();
            if(users.length === 0)
                users = UtilsServiceUsers.getFromVoice(interaction);
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
        }
        this.checkSplit(split);
        if(split.errorReturnTag !== ""){
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", split.errorReturnTag]);
            if(outerSplit) {
                (split.thread)
                    ? await split.thread.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
                    : await interaction.channel?.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
            } else
                await interaction.editReply({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])});
            return;
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
            "SPLIT_DESCRIPTION_START", "SPLIT_BUTTON_UNDO", "SPLIT_BUTTON_DELETE",
        ], [
            [split.captains[split.currentCaptainIndex].toString(), UtilsGeneratorTimestamp.getRelativeTime(split.pickTimeMs)]
        ]));
        let fieldHeaders: string[] = [await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_USERS")];
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_TEAM", i+1));

        if(!interaction.channel)
            throw "Interaction no channel!";
        if(outerSplit) {
            if(split.thread)
                split.message = await split.thread.send({embeds: this.splitUI.splitEmbed(
                        textStrings[0],
                        textStrings[1],
                        fieldHeaders,
                        split
                    ), components: this.splitUI.splitProcessingButtons(textStrings.slice(2), split.currentStep === 1)});
            else
                split.message = await interaction.channel?.send({embeds: this.splitUI.splitEmbed(
                        textStrings[0],
                        textStrings[1],
                        fieldHeaders,
                        split
                    ), components: this.splitUI.splitProcessingButtons(textStrings.slice(2), split.currentStep === 1)});
        } else
            split.message = await interaction.editReply({embeds: this.splitUI.splitEmbed(
                textStrings[0],
                textStrings[1],
                fieldHeaders,
                split
                ), components: this.splitUI.splitProcessingButtons(textStrings.slice(2), split.currentStep === 1)});

        if(await this.getOneSettingNumber(split.interaction, "SPLIT_SEND_PM_NOTIFICATION")) {
            let pmTextStrings: string[] = await this.getManyText(split.interaction, [
                "SPLIT_NOTIFY_PM_TITLE", "SPLIT_NOTIFY_PM_DESCRIPTION"
            ]);
            let pmEmbed = this.splitUI.notificationSplitPMEmbed(
                pmTextStrings[0], pmTextStrings[1],
                split.message.url, split.interaction.guild?.name as string,
                split.interaction.guild?.iconURL() || null
            );
            split.captains.forEach(user => {
                if(outerSplit || (user.id !== split.interaction.user.id)) 
                    UtilsServicePM.send(user, pmEmbed);
            });
        }
        split.setTimeoutID = setTimeout(SplitService.timeoutFunction, split.pickTimeMs, split);
        split.reactionCollector = split.message?.createReactionCollector({time: 16*split.pickTimeMs});  // максимальное число игроков
        split.reactionCollector.on("collect", async (reaction: MessageReaction, user: User) => SplitService.reactionCollectorFunction(reaction, user));
        try {   // если оно будет удалено до выставления всех эмодзи
            await UtilsServiceEmojis.reactOrder(split.message, split.emojis);
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
            UtilsGeneratorTimestamp.getRelativeTime(split.pickTimeMs)
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
        let labels: string[] = await splitService.getManyText(split.interaction, ["SPLIT_BUTTON_UNDO", "SPLIT_BUTTON_DELETE"]);
        await reaction.message.edit({
            embeds: splitService.splitUI.splitEmbed(textStrings[0], textStrings[1], fieldHeaders, split),
            components: splitService.splitUI.splitProcessingButtons(labels, split.currentStep === 1)
        });
        if(split.currentCaptainIndex !== -1) {
            split.setTimeoutID = setTimeout(SplitService.timeoutFunction, split.pickTimeMs, split);
            return;
        }

        await reaction.message.edit({components: []});
        split.reactionCollector?.stop();
        split.isProcessing = false;
        await reaction.message.reactions.removeAll();
        if(await splitService.getOneSettingNumber(split.interaction, "SPLIT_MOVE_TEAM_VOICE_CHANNEL")) {
            let destinationChannel: VoiceChannel | undefined = (await splitService.getOneSettingString(split.interaction, "GAME_TEAMERS_VOICE_CHANNELS"))
                .split(" ")
                .filter(id => id !== "")
                .map(id => (split as Split).interaction.guild?.channels.cache.get(id))
                .filter(channel => !!channel && (channel?.type === ChannelType.GuildVoice))
                .map(channel => channel as VoiceChannel)
                .filter(channel => Array.from(channel.members.keys()).length === 0)[0];
            if(destinationChannel) {
                (split as Split).teams[1].forEach(id => {
                    let member: GuildMember | undefined = (split as Split).interaction.guild?.members.cache.get(id.slice(2, -1));
                    if(member?.voice.channel?.id)
                        try {
                            member?.voice.setChannel(destinationChannel as VoiceChannel);
                        } catch {}
                });
            }
        }
        if(split.bansForDraft !== null)
            await splitService.splitAdapter.callDraft(split);
    }

    // Если не успели
    public static async timeoutFunction(split: Split): Promise<void> {
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
        let buttonLabels: string[] = await splitService.getManyText(split.interaction, [
            "SPLIT_BUTTON_RESTART", "SPLIT_BUTTON_CONTINUE",
            "SPLIT_BUTTON_SKIP", "SPLIT_BUTTON_DELETE", 
        ]);
        await split.message?.edit({
            components: splitService.splitUI.splitFailedButtons(
                buttonLabels, 
                split.bansForDraft !== null
            ),
            embeds: splitService.splitUI.splitEmbed(
                textStrings[0],
                textStrings[1],
                fieldHeaders,
                split
            )
        });
        await split.message?.reactions.removeAll();
    }

    public async splitDeleteButton(interaction: ButtonInteraction) {
        let key: string = interaction.guild?.id as string;
        let split: Split | undefined = SplitService.splits.get(key);
        if(!split)
            return await interaction.message.delete();
        if(!await this.checkButtonPermission(interaction, split))
            return;

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

    private async replyNotFound(interaction: ButtonInteraction): Promise<void> {
        let textStrings: string[] = await this.getManyText(interaction, [
            "BASE_ERROR_TITLE", "SPLIT_ERROR_NOT_FOUND"
        ]);
        await interaction.reply({
            embeds: this.splitUI.error(textStrings[0], textStrings[1]),
            ephemeral: true
        });
        await interaction.message.edit({components: []});
    }

    public async splitRestartButton(interaction: ButtonInteraction) {
        let key: string = interaction.guild?.id as string;
        let split: Split | undefined = SplitService.splits.get(key);
        if(!split || split.isProcessing || split.captains.map(user => user.id).indexOf(interaction.user.id) === -1)
            return await this.replyNotFound(interaction);
        if(!await this.checkButtonPermission(interaction, split))
            return;
        split.teams.forEach((team: string[]) => { (split as Split).users.push(...team.splice(1)); });
        split.emojis = UtilsServiceLetters.getLetters().slice(0, split.users.length);
        split.currentStep = 1;
        split.currentCaptainIndex = 0;
        this.allLongSplits(split.interaction as CommandInteraction, split.type, split.interaction?.member as GuildMember, null, [], split);
        interaction.message.delete();
    }

    public async splitContinueButton(interaction: ButtonInteraction) {
        let key: string = interaction.guild?.id as string;
        let split: Split | undefined = SplitService.splits.get(key);
        if(!split || split.isProcessing || split.captains.map(user => user.id).indexOf(interaction.user.id) === -1)
            return await this.replyNotFound(interaction);
        if(!await this.checkButtonPermission(interaction, split))
            return;

        await interaction.message.delete();
        await this.allLongSplits(split.interaction as CommandInteraction, split.type, split.interaction?.member as GuildMember, null, [], split);
    }

    public async splitSkipButton(interaction: ButtonInteraction) {
        let key: string = interaction.guild?.id as string;
        let split: Split | undefined = SplitService.splits.get(key);
        if(!split || split.isProcessing || split.captains.map(user => user.id).indexOf(interaction.user.id) === -1)
            return await this.replyNotFound(interaction);
        if(!await this.checkButtonPermission(interaction, split))
            return;
        if(split.bansForDraft === null) {
            let buttonLabels: string[] = await this.getManyText(split.interaction, [
                "SPLIT_BUTTON_RESTART", "SPLIT_BUTTON_CONTINUE",
                "SPLIT_BUTTON_SKIP", "SPLIT_BUTTON_DELETE", 
            ]);
            interaction.message.edit({components: this.splitUI.splitFailedButtons(buttonLabels)});
            await interaction.deferUpdate();
            return;
        }
        interaction.deferUpdate();
        interaction.message.edit({components: []});
        this.splitAdapter.callDraft(split);
    }

    public async splitUndoButton(interaction: ButtonInteraction) {
        let key: string = interaction.guild?.id as string;
        let split: Split | undefined = SplitService.splits.get(key);
        if(!split) {
            await interaction.message.delete();    // удалить сообщение
            return;
        }
        if(!await this.checkButtonPermission(interaction, split))
            return;
        if(interaction.user.id !== split.captains[split.pickSequence[split.currentStep-2]].id) {
            let textStrings = await this.getManyText(
                split.interaction,
                ["BASE_ERROR_TITLE", "SPLIT_ERROR_DELETE_BUTTON_NOT_OWNER_OR_CAPTAIN"]
            );
            await interaction.reply({embeds: this.splitUI.error(textStrings[0], textStrings[1]), ephemeral: true});
            return;
        }
        split.currentStep--;
        split.currentCaptainIndex = split.pickSequence[split.currentStep-1];
        await interaction.deferUpdate();
        split.users.push(split.teams[split.currentCaptainIndex].pop() as string);
        let lastEmoji: string = UtilsServiceLetters.getLetters().slice(split.users.length-1, split.users.length)[0];
        split.emojis.push(lastEmoji);
        await interaction.message.react(lastEmoji);
        if(split.setTimeoutID !== null)
            clearTimeout(split.setTimeoutID);
        split.setTimeoutID = setTimeout(SplitService.timeoutFunction, split.pickTimeMs, split);
        split.reactionCollector?.stop();
        if(split.message) {
            split.reactionCollector = split.message?.createReactionCollector({time: 16*split.pickTimeMs});  // максимальное число игроков
            split.reactionCollector.on("collect", async (reaction: MessageReaction, user: User) => SplitService.reactionCollectorFunction(reaction, user));
        }

        let textStrings: string[] = [], fieldHeaders: string[] = [];
        switch(split.type) {
            case "Classic":
                textStrings.push(await this.getOneText(split.interaction,
                    (split.currentCaptainIndex === -1)
                        ? "SPLIT_CLASSIC_TITLE_FINISH"
                        : "SPLIT_CLASSIC_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
            case "Double":
                textStrings.push(await this.getOneText(split.interaction,
                    (split.currentCaptainIndex === -1)
                        ? "SPLIT_DOUBLE_TITLE_FINISH"
                        : "SPLIT_DOUBLE_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
            case "CWC":
                textStrings.push(await this.getOneText(split.interaction,
                    (split.currentCaptainIndex === -1)
                        ? "SPLIT_CWC_TITLE_FINISH"
                        : "SPLIT_CWC_TITLE_PROCESSING",
                    split.currentStep, split.totalStepAmount)
                );
                break;
        }
        textStrings.push(await this.getOneText(split.interaction,
            (split.currentCaptainIndex === -1)
                ? "SPLIT_DESCRIPTION_FINISH"
                : "SPLIT_DESCRIPTION_PROCESSING",
            split.currentCaptainIndex+1, split.captains[split.currentCaptainIndex]?.toString() || "",   // если -1, то всё равно выполнится
            UtilsGeneratorTimestamp.getRelativeTime(split.pickTimeMs)
        ));
        fieldHeaders = [await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_USERS")];
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_TEAM", i+1));
        let labels: string[] = await this.getManyText(split.interaction, ["SPLIT_BUTTON_UNDO", "SPLIT_BUTTON_DELETE"]);
        await interaction.message.edit({
            embeds: this.splitUI.splitEmbed(textStrings[0], textStrings[1], fieldHeaders, split),
            components: this.splitUI.splitProcessingButtons(labels, split.currentStep === 1)
        });
    }
}
