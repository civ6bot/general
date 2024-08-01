import {ModuleBaseService} from "../base/base.service";
import {ButtonInteraction, ChannelType, CommandInteraction, GuildMember, MessageReaction, User, VoiceChannel} from "discord.js";
import {SplitUI} from "./split.ui";
import {Split, SplitClassic, SplitCWC, SplitDouble, SplitRandom, SplitRating} from "./split.models";
import {UtilsGeneratorTimestamp} from "../../utils/generators/utils.generator.timestamp";
import {UtilsServiceEmojis} from "../../utils/services/utils.service.emojis";
import {UtilsServiceUsers} from "../../utils/services/utils.service.users";
import {SplitAdapter} from "./split.adapter";
import {UtilsServicePM} from "../../utils/services/utils.service.PM";
import {UtilsServiceLetters} from "../../utils/services/utils.service.letters";
import { RequestsSplit } from "../../requests/requests.split";

export class SplitService extends ModuleBaseService {
    private splitUI: SplitUI = new SplitUI();
    public splitAdapter: SplitAdapter = new SplitAdapter();

    public static splits: Map<string, Split[]> = new Map();    // guildID

    public static getSplits(guildID: string): Split[] {
        if(SplitService.splits.get(guildID) === undefined)
            SplitService.splits.set(guildID, []);
        return SplitService.splits.get(guildID) as Split[];
    }

    public static addSplit(split: Split): void {
        this.getSplits(split.guildID).push(split);
    }

    public static deleteSplit(split: Split): void {
        let guildSplits: Split[] = this.getSplits(split.guildID);
        let splitIndex: number = guildSplits.indexOf(split);
        if(splitIndex !== -1)
            guildSplits.splice(splitIndex, 1);
    }

    public static getSplitByGuildMessageID(guildID: string, messageID: string): Split | undefined {
        return this.getSplits(guildID).filter(split => split.message?.id === messageID)[0];
    }

    private async checkButtonPermission(interaction: ButtonInteraction, split: Split): Promise<boolean> {
        if((interaction.user.id === split.interaction.user.id) || 
            (split.captains.map((captain: User): string => captain.id).indexOf(interaction.user.id) !== -1)) 
            return true;
        
        let textStrings = await this.getManyText(
            split.interaction,
            ["BASE_ERROR_TITLE", "SPLIT_ERROR_DELETE_BUTTON_NOT_OWNER_OR_CAPTAIN"]
        );
        interaction.reply({embeds: this.splitUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        return false;
    }

    // Map-объект имеет активные и неактивные объекты. 
    // Функция ниже работает с ними и делает и делает следующее:
    // 1) проверяет, можно ли добавить новый активный
    // объект в список существующих (Random не учитывается);
    // 2) удаляет неактивные (!) объекты, которые (хотя бы одно из двух):
    //      2.1) перекрываются новым активным
    //      по признаку наличия пересеающихся пользователей;
    //      2.2) очень старые (1 час).
    private checkSplit(split: Split): void {
        if((split.errorReturnTag !== "") || (split.type === "Random"))
            return;
        let guildSplits = SplitService.getSplits(split.guildID);
        guildSplits.forEach((guildSplit: Split) => {
            if(split.errorReturnTag !== "")
                return;
            // users это string[]
            if(guildSplit.isProcessing && (guildSplit.getAllPlayersID().filter(user => split.getAllPlayersID().includes(user)).length > 0))
                split.errorReturnTag = "SPLIT_ERROR_PROCESSING";
        });

        if(split.errorReturnTag !== "")
            return;
        guildSplits = guildSplits.filter((guildSplit) => 
            (guildSplit.isProcessing) || (
                (guildSplit.getAllPlayersID().filter(user => split.getAllPlayersID().includes(user)).length === 0) &&
                ((Date.now()-guildSplit.date.getTime()) < this.lifetimeOfMapObjects)
            )
        );
        SplitService.splits.set(split.guildID, guildSplits);
    }

    public async random(
        interaction: CommandInteraction,
        captain1: GuildMember, 
        captain2: GuildMember | null = null,
        usersInclude: string,
        usersExclude: string,
        usersOnly: string,
        outerSplit: SplitRandom | null = null
    ) {
        let split: SplitRandom;
        if(outerSplit)
            split = outerSplit;
        else {
            let users: User[];
            if(usersOnly === "") {
                users = usersInclude
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => id !== "")
                    .map((id: string): User | undefined => interaction.guild?.members.cache.get(id)?.user)
                    .filter(user => !!user)
                    .map(user => user as User)
                    .concat(UtilsServiceUsers.getFromVoice(interaction));
                let usersExcludeID: string[] = usersExclude
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => (id !== "") && (id !== interaction.user.id));
                users = Array.from(new Set(users.filter(user => usersExcludeID.indexOf(user.id) === -1)));
            } else {
                users = usersOnly
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => id !== "")
                    .map((id: string): User | undefined => interaction.guild?.members.cache.get(id)?.user)
                    .filter(user => !!user)
                    .map(user => user as User)
                    .concat(interaction.user);
                users = Array.from(new Set(users));
            }
            split = new SplitRandom(interaction, [captain1.user, captain2?.user || null], users);
        }
        this.checkSplit(split);
        if(split.errorReturnTag !== ""){
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", split.errorReturnTag]);
            if(outerSplit) {
                (split.thread)
                    ? split.thread.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
                    : interaction.channel?.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
            } else
                interaction.reply({embeds: this.splitUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
            return;
        }

        // Случайное разделение не может прерваться после проверок,
        // потому что оно мгновенное. У него нет кнопок, и, следовательно,
        // объект разделения не нужно хранить в памяти (для вызова 2 кнопок
        // для тех, кто не успел выбрать вовремя.

        let title: string = await this.getOneText(split.interaction, "SPLIT_RANDOM_TITLE");
        let fieldHeaders: string[] = [await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_USERS_NOT_PICKED")];
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_TEAM", i+1));

        if (outerSplit) {
            if(split.thread)
                split.thread.send({embeds: this.splitUI.splitEmbed(
                        title,
                        null,
                        fieldHeaders,
                        split
                    )});
            else
                interaction.channel?.send({embeds: this.splitUI.splitEmbed(
                    title,
                        null,
                        fieldHeaders,
                        split
                    )});
        } else
            interaction.reply({embeds: this.splitUI.splitEmbed(
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
            this.splitAdapter.callDraft(split);
        }
    }

    public async rating(
        interaction: CommandInteraction,
        usersInclude: string,
        usersExclude: string,
        usersOnly: string,
        outerSplit: SplitRating | null = null
    ) {
        let split: SplitRating;
        if(outerSplit)
            split = outerSplit;
        else {
            let users: User[];
            if(usersOnly === "") {
                users = usersInclude
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => id !== "")
                    .map((id: string): User | undefined => interaction.guild?.members.cache.get(id)?.user)
                    .filter(user => !!user)
                    .map(user => user as User)
                    .concat(UtilsServiceUsers.getFromVoice(interaction));
                let usersExcludeID: string[] = usersExclude
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => (id !== "") && (id !== interaction.user.id));
                users = Array.from(new Set(users.filter(user => usersExcludeID.indexOf(user.id) === -1)));
            } else {
                users = usersOnly
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => id !== "")
                    .map((id: string): User | undefined => interaction.guild?.members.cache.get(id)?.user)
                    .filter(user => !!user)
                    .map(user => user as User)
                    .concat(interaction.user);
                users = Array.from(new Set(users));
            }

            const ratingBotID: string = "795292082184650813";
            if(!(await interaction.guild?.members.fetch(ratingBotID))) {
                let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", "SPLIT_ERROR_RATING"]);
                return interaction.reply({embeds: this.splitUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
            }
            let requestsSplit: RequestsSplit = new RequestsSplit();
            let ratings: number[] = await requestsSplit.getRatings(interaction.guild?.id, users.map(user => user.id));
            split = new SplitRating(interaction, [users[0] || null, users[1] || null], users, ratings);
        }
        this.checkSplit(split);
        if(split.errorReturnTag !== ""){
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", split.errorReturnTag]);
            if(outerSplit) {
                (split.thread)
                    ? split.thread.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
                    : interaction.channel?.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
            } else
                interaction.reply({embeds: this.splitUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
            return;
        }

        let title: string = await this.getOneText(split.interaction, "SPLIT_RATING_TITLE");
        let fieldHeaders: string[] = [await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_USERS_NOT_PICKED")];
        for(let i: number = 0; i < split.teams.length; i++)
            fieldHeaders.push(await this.getOneText(split.interaction, "SPLIT_FIELD_TITLE_TEAM", i+1));

        if (outerSplit) {
            if(split.thread)
                split.thread.send({embeds: this.splitUI.splitEmbed(
                        title,
                        null,
                        fieldHeaders,
                        split
                    )});
            else
                interaction.channel?.send({embeds: this.splitUI.splitEmbed(
                    title,
                        null,
                        fieldHeaders,
                        split
                    )});
        } else
            interaction.reply({embeds: this.splitUI.splitEmbed(
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
            this.splitAdapter.callDraft(split);
        }
    }

    public async allLongSplits(
        interaction: CommandInteraction, type: string,
        captain1: GuildMember,
        captain2: GuildMember | null = null,
        usersInclude: string,
        usersExclude: string,
        usersOnly: string,
        outerSplit: Split | null = null
    ) {
        let split: Split;
        if(outerSplit)
            split = outerSplit;
        else {
            let users: User[];
            if(usersOnly === "") {
                users = usersInclude
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => id !== "")
                    .map((id: string): User | undefined => interaction.guild?.members.cache.get(id)?.user)
                    .filter(user => !!user)
                    .map(user => user as User)
                    .concat(UtilsServiceUsers.getFromVoice(interaction));
                let usersExcludeID: string[] = usersExclude
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => (id !== "") && (id !== interaction.user.id));
                users = Array.from(new Set(users.filter(user => usersExcludeID.indexOf(user.id) === -1)));
            } else {
                users = usersOnly
                    .replaceAll("<@", " ")
                    .replaceAll(">", " ")
                    .split(" ")
                    .filter(id => id !== "")
                    .map((id: string): User | undefined => interaction.guild?.members.cache.get(id)?.user)
                    .filter(user => !!user)
                    .map(user => user as User)
                    .concat(interaction.user);
                users = Array.from(new Set(users));
            }
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
                    ? split.thread.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
                    : interaction.channel?.send({embeds: this.splitUI.error(errorTexts[0], errorTexts[1])})
            } else
                interaction.reply({embeds: this.splitUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
            return;
        }
        if(!outerSplit)
            await interaction.deferReply();
        SplitService.addSplit(split);

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
        if(!await UtilsServiceEmojis.reactOrder(split.message, split.emojis))         // если оно будет удалено до выставления всех эмодзи
            SplitService.deleteSplit(split);
    }

    public static async reactionCollectorFunction(reaction: MessageReaction, user: User): Promise<void> {
        if(user.bot)
            return;
        let split: Split | undefined = SplitService.getSplitByGuildMessageID(
            reaction.message.guild?.id as string,
            reaction.message.id
        );
        if(!split) {
            reaction.message.delete().catch();    // удалить сообщение
            return;
        }
        await reaction.message.reactions.resolve(reaction).users.remove(user);      // удалить реакцию пользователя
        if(user.id !== split.captains[split.currentCaptainIndex].id)
            return;

        if(split.setTimeoutID !== null) {
            clearTimeout(split.setTimeoutID);
            split.setTimeoutID = null;
        }
        reaction.message.reactions.cache.get(
            split.pickPlayer(split.emojis.indexOf(reaction.emoji.toString()))       // удалить последнюю реакцию в списке
        )?.remove();

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
            components: (split.currentCaptainIndex !== -1) 
                ? splitService.splitUI.splitProcessingButtons(labels, split.currentStep === 1) 
                : []
        });
        if(split.currentCaptainIndex !== -1) {
            split.setTimeoutID = setTimeout(SplitService.timeoutFunction, split.pickTimeMs, split);
            return;
        }

        split.reactionCollector?.stop();
        split.isProcessing = false;
        reaction.message.reactions.removeAll();
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
            splitService.splitAdapter.callDraft(split);
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
        split.message?.edit({
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
        split.message?.reactions.removeAll();
    }

    public async splitDeleteButton(interaction: ButtonInteraction) {
        let split: Split | undefined = SplitService.getSplitByGuildMessageID(
            interaction.guild?.id as string,
            interaction.message.id
        );
        if(!split)
            return interaction.message.delete().catch();
        if(!await this.checkButtonPermission(interaction, split))
            return;

        if(split.setTimeoutID !== null) {
            clearTimeout(split.setTimeoutID);
            split.setTimeoutID = null;
        }
        split.reactionCollector?.stop();
        SplitService.deleteSplit(split);
        let textStrings = await this.getManyText(
            interaction,
            ["BASE_NOTIFY_TITLE", "SPLIT_NOTIFY_DELETED"]
        );
        await interaction.reply({embeds: this.splitUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
        await interaction.message.delete().catch();
    }

    private async replyNotFound(interaction: ButtonInteraction): Promise<void> {
        let textStrings: string[] = await this.getManyText(interaction, [
            "BASE_ERROR_TITLE", "SPLIT_ERROR_NOT_FOUND"
        ]);
        interaction.reply({
            embeds: this.splitUI.error(textStrings[0], textStrings[1]),
            ephemeral: true
        });
        interaction.message.edit({components: []});
    }

    public async splitRestartButton(interaction: ButtonInteraction) {        
        let split: Split | undefined = SplitService.getSplitByGuildMessageID(
            interaction.guild?.id as string,
            interaction.message.id
        );
        if(!split)
            return await this.replyNotFound(interaction);
        if(!await this.checkButtonPermission(interaction, split))
            return;
        split.teams.forEach((team: string[]) => { (split as Split).users.push(...team.splice(1)); });
        split.emojis = UtilsServiceLetters.getLetters().slice(0, split.users.length);
        split.currentStep = 1;
        split.currentCaptainIndex = 0;
        this.allLongSplits(split.interaction as CommandInteraction, split.type, split.interaction?.member as GuildMember, null, "", "", "", split);
        interaction.message.delete().catch();
    }

    public async splitContinueButton(interaction: ButtonInteraction) {
        let split: Split | undefined = SplitService.getSplitByGuildMessageID(
            interaction.guild?.id as string,
            interaction.message.id
        );
        if(!split)
            return this.replyNotFound(interaction);
        if(!await this.checkButtonPermission(interaction, split))
            return;

        interaction.message.delete().catch();
        this.allLongSplits(split.interaction as CommandInteraction, split.type, split.interaction?.member as GuildMember, null,  "", "", "", split);
    }

    public async splitSkipButton(interaction: ButtonInteraction) {
        let split: Split | undefined = SplitService.getSplitByGuildMessageID(
            interaction.guild?.id as string,
            interaction.message.id
        );
        if(!split)
            return this.replyNotFound(interaction);
        if(!await this.checkButtonPermission(interaction, split))
            return;
        if(split.bansForDraft === null) {
            let buttonLabels: string[] = await this.getManyText(split.interaction, [
                "SPLIT_BUTTON_RESTART", "SPLIT_BUTTON_CONTINUE",
                "SPLIT_BUTTON_SKIP", "SPLIT_BUTTON_DELETE", 
            ]);
            interaction.message.edit({components: this.splitUI.splitFailedButtons(buttonLabels)});
            return interaction.deferUpdate();
        }
        interaction.deferUpdate();
        interaction.message.edit({components: []});
        this.splitAdapter.callDraft(split);
    }

    public async splitUndoButton(interaction: ButtonInteraction) {
        let key: string = interaction.guild?.id as string;
        let split: Split | undefined = SplitService.getSplitByGuildMessageID(
            interaction.guild?.id as string,
            interaction.message.id
        );
        if(!split) 
            return interaction.message.delete().catch();    // удалить сообщение
        if(!await this.checkButtonPermission(interaction, split))
            return;
        if(interaction.user.id !== split.captains[split.pickSequence[split.currentStep-2]].id) {
            let textStrings = await this.getManyText(
                split.interaction,
                ["BASE_ERROR_TITLE", "SPLIT_ERROR_DELETE_BUTTON_NOT_OWNER_OR_CAPTAIN"]
            );
            return interaction.reply({embeds: this.splitUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        split.currentStep--;
        split.currentCaptainIndex = split.pickSequence[split.currentStep-1];
        interaction.deferUpdate();
        split.users.push(split.teams[split.currentCaptainIndex].pop() as string);
        let lastEmoji: string = UtilsServiceLetters.getLetters().slice(split.users.length-1, split.users.length)[0];
        split.emojis.push(lastEmoji);
        interaction.message.react(lastEmoji).catch();
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
        interaction.message.edit({
            embeds: this.splitUI.splitEmbed(textStrings[0], textStrings[1], fieldHeaders, split),
            components: this.splitUI.splitProcessingButtons(labels, split.currentStep === 1)
        });
    }
}
