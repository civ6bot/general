import {ModuleBaseService} from "../base/base.service";
import {GameUI} from "./game.ui";
import {ButtonInteraction, CommandInteraction, Message, MessageReaction, User, VoiceChannel, ChannelType, TextChannel, GuildMember} from "discord.js";
import {Game, GameEntity, GameEntityDraft, GameEntityReady, GameFFA, GameTeamers} from "./game.models";
import {UtilsGeneratorTimestamp} from "../../utils/generators/utils.generator.timestamp";
import {UtilsDataCivilizations} from "../../utils/data/utils.data.civilizations";
import {UtilsServiceEmojis} from "../../utils/services/utils.service.emojis";
import {UtilsServiceUsers} from "../../utils/services/utils.service.users";
import {GameAdapter} from "./game.adapter";
import {UtilsDataGameTags} from "../../utils/data/utils.data.gameTags";
import {UtilsServicePM} from "../../utils/services/utils.service.PM";
import {UtilsServiceTime} from "../../utils/services/utils.service.time";
import { UtilsServiceSyntax } from "../../utils/services/utils.service.syntax";

export class GameService extends ModuleBaseService {
    private gameUI: GameUI = new GameUI();
    public gameAdapter: GameAdapter = new GameAdapter();

    public static games: Map<string, Game[]> = new Map();    // guildID

    public static getGames(guildID: string): Game[] {
        if(GameService.games.get(guildID) === undefined)
            GameService.games.set(guildID, []);
        return GameService.games.get(guildID) as Game[];
    }

    public static addGame(game: Game): void {
        this.getGames(game.guildID).push(game);
    }

    public static deleteGame(game: Game): void {
        let guildGames: Game[] = this.getGames(game.guildID);
        let gameIndex: number = guildGames.indexOf(game);
        if(gameIndex !== -1)
            guildGames.splice(gameIndex, 1);
    }

    public static getGameByGuildMessageID(guildID: string, messageID: string): Game | undefined {
        return this.getGames(guildID).filter(game => {
            if(game.type === "FFA") {
                let gameFFA = game as GameFFA;
                return gameFFA.entities
                    .concat([gameFFA.entityDraft, gameFFA.entityReady])
                    .some(entity => entity.message?.id === messageID);
            } else if (game.type === "Teamers") {
                let gameTeamers = game as GameTeamers;
                return gameTeamers.entities
                    .concat([gameTeamers.entityCaptains, gameTeamers.entityDraft, gameTeamers.entityReady])
                    .some(entity => entity.message?.id === messageID);
            } else 
                return undefined;
        })[0];
    }

    // Map-объект имеет активные и неактивные объекты.
    // Функция ниже работает с ними и делает и делает следующее:
    // 1) проверяет, можно ли добавить новый
    // активный объект в список существующих (isSending);
    // 2) удаляет неактивные объекты.
    private checkGame(game: Game): void {
        if(game.errorReturnTag !== "")
            return;

        let guildGames: Game[] = GameService.getGames(game.guildID);
        guildGames.forEach((guildGame: Game) => {
            if(game.errorReturnTag !== "")
                return;
            if(guildGame.isSending || 
                ((guildGame.users.map(user => user.id).filter(user => game.users.map(user => user.id).includes(user)).length > 0)
                && (guildGame.isProcessing))
            ) {
                game.errorReturnTag = "GAME_ERROR_PROCESSING";
                return;
            }
        });

        if(game.errorReturnTag !== "")
            return;
        guildGames = guildGames.filter((guildGame) => guildGame.isProcessing);
        GameService.games.set(game.guildID, guildGames);
    }

    private getFFAEmojisConfigsStrings(): string[][] {
        return Array.from(UtilsDataGameTags.FFAGameTagsMap.values())
            .map((arr: string[]): string[] =>
                arr.map((option: string): string => option + "_EMOJI"));
    }

    private getTeamersEmojisConfigsStrings(): string[][] {
        return Array.from(UtilsDataGameTags.teamersGameTagsMap.values())
            .map((arr: string[]): string[] =>
                arr.map((option: string): string => option + "_EMOJI"));
    }

    private filterOptions(
        gameMainFlags: number[],
        gameOptionsFlags: number[][],
        headers: string[],
        options: string[][],
        emojis: string[][]
    ): void {
        for(let i: number = 0; i < gameMainFlags.length; i++)
            if(gameMainFlags[i] === 0) {
                gameMainFlags.splice(i, 1);
                gameOptionsFlags.splice(i, 1);
                headers.splice(i, 1);
                options.splice(i, 1);
                emojis.splice(i, 1);
                i--;
            }
        for(let i in gameOptionsFlags)
            for(let j: number = 0; j < gameOptionsFlags[i].length; j++)
                if(gameOptionsFlags[i][j] === 0) {
                    gameOptionsFlags[i].splice(j, 1);
                    options[i].splice(j, 1);
                    emojis[i].splice(j, 1);
                    j--;
                }
    }

    public async ffa(
        interaction: CommandInteraction, 
        usersInclude: string, 
        usersExclude: string, 
        usersOnly: string,
        isShort: boolean = false
    ) {
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

        let gameFFAMainFlags: number[] = await this.getManySettingNumber(interaction, ...Array.from(UtilsDataGameTags.FFAGameTagsMap.keys()));
        let gameFFAOptionsFlags: number[][] = [];
        if(isShort)
            gameFFAMainFlags = Array<number>(gameFFAMainFlags.length-1).fill(0).concat(1);

        let headers: string[] =  await this.getManyText(interaction, Array.from(UtilsDataGameTags.FFAGameTagsMap.keys()));
        let options: string[][] = [], emojis: string[][] = [];

        let ffaValues: string[][] = Array.from(UtilsDataGameTags.FFAGameTagsMap.values());
        for(let i in ffaValues) {
            gameFFAOptionsFlags.push(await this.getManySettingNumber(interaction, ...ffaValues[i]));
            options.push(await this.getManyText(interaction, ffaValues[i]));
            emojis.push(await this.getManyText(interaction, this.getFFAEmojisConfigsStrings()[i]));
        }
        this.filterOptions(gameFFAMainFlags, gameFFAOptionsFlags, headers, options, emojis);

        let draftHeaders: string[] = await this.getManyText(interaction, [
            "GAME_BANS_START", "GAME_BANS_PROCESSING"
        ]);
        let draftFlags: number[] = await this.getManySettingNumber(interaction, ...UtilsDataCivilizations.civilizationsTags);
        let draftEmojis: string[] = await this.getManySettingString(interaction, ...UtilsDataCivilizations.civilizationsTags.map((str: string): string => str+"_EMOJI"));
        let draftOptions: string[] = (await this.getManyText(interaction, UtilsDataCivilizations.civilizationsTags, draftEmojis.map(str => [str])));
        
        draftEmojis = draftEmojis.filter((str: string, index: number): boolean => !!draftFlags[index]);
        draftOptions = draftOptions.filter((str: string, index: number): boolean => !!draftFlags[index]);

        let voteTimeMs: number = await this.getOneSettingNumber(interaction, "GAME_VOTE_TIME_MS");
        let banThreshold: number = Math.ceil(await this.getOneSettingNumber(
            interaction, "GAME_FFA_DRAFT_BAN_THRESHOLD_PERCENT"
        )*users.length/100);

        let readyTitle: string = await this.getOneText(interaction, "GAME_READY_TITLE");
        let readyDescriptions: string[] = await this.getManyText(interaction, [
            "GAME_READY_DESCRIPTION_PROCESSING", "GAME_READY_DESCRIPTION_FINISH",
            "GAME_RESULT_TIMEOUT_DESCRIPTION", "GAME_READY_DESCRIPTION_FORCE_END"
        ], [
            [UtilsGeneratorTimestamp.getRelativeTime(voteTimeMs)]
        ]);
        let readyFieldTitles: string[] = await this.getManyText(interaction, [
            "GAME_READY_FIELD_PLAYERS_TITLE", "GAME_READY_FIELD_READY_TITLE",
        ]);
        let readyFieldEmojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];
        let buttonLabels: string[] = await this.getManyText(interaction, [
            "GAME_BUTTON_READY", "GAME_BUTTON_SKIP", "GAME_BUTTON_DELETE"
        ]);
        let game: GameFFA = new GameFFA(
            interaction, users, voteTimeMs,
            headers, options, emojis,
            draftHeaders, draftOptions, draftEmojis, banThreshold,
            readyTitle, readyDescriptions, readyFieldTitles, readyFieldEmojis
        );
        this.checkGame(game);
        if(game.errorReturnTag !== "") {
            let errorTexts: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", game.errorReturnTag
            ]);
            return await interaction.reply({embeds: this.gameUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
        }
        await interaction.deferReply();
        GameService.addGame(game);
        game.setTimeoutID = setTimeout(GameService.timeoutFunction, voteTimeMs, game);
        if(interaction.channel === null)
            throw "Interaction called from PM";

        // ======== Все проверки объекта пройдены

        let [isMoveToChannels, isThread, isNotificationPM] = (await this.getManySettingNumber(interaction,
            "GAME_MOVE_TO_VOICE_CHANNELS", "GAME_THREAD", "GAME_SEND_PM_NOTIFICATION"
        )).map(flag => Boolean(flag));
        isThread = isThread && (interaction.channel.type === ChannelType.GuildText);

        if(isThread) {
            try {
                game.thread = await (interaction.channel as TextChannel).threads.create({
                    name: await this.getOneText(interaction, "GAME_FFA_THREAD_NAME", interaction.user.username)
                });
                let textStrings: string[] = await this.getManyText(interaction, [
                    "BASE_NOTIFY_TITLE", "GAME_NOTIFY_THREAD"
                ]);
                interaction.editReply({embeds: this.gameUI.notify(textStrings[0], textStrings[1])}).catch();
                setTimeout(
                    (interaction: CommandInteraction) => interaction.deleteReply().catch(),
                    UtilsServiceTime.getMs(5, "s"),
                    interaction
                );
            } catch {
                let textStrings: string[] = await this.getManyText(interaction, [
                    "BASE_ERROR_TITLE", "GAME_ERROR_THREAD"
                ]);
                interaction.editReply({embeds: this.gameUI.error(textStrings[0], textStrings[1])}).catch();
                GameService.deleteGame(game);
                clearTimeout(game.setTimeoutID);
                return;
            }
        }

        if(isMoveToChannels) {
            let destinationChannel: VoiceChannel | undefined = (await this.getOneSettingString(interaction, "GAME_FFA_VOICE_CHANNELS"))
                .split(" ")
                .filter(id => id !== "")
                .map(id => interaction.guild?.channels.cache.get(id))
                .filter(channel => !!channel && (channel?.type === ChannelType.GuildVoice))
                .map(channel => channel as VoiceChannel)
                .filter(channel => Array.from(channel.members.keys()).length === 0)[0];
            if(destinationChannel) {
                let channelsDepartureID: string[] = (await this.getOneSettingString(interaction, "GAME_FFA_HOME_VOICE_CHANNELS"))
                    .split(" ")
                    .filter(id => id !== "");
                users.forEach(user => {
                    let member: GuildMember | undefined = interaction.guild?.members.cache.get(user.id);
                    if (channelsDepartureID.indexOf(member?.voice.channel?.id as string) !== -1)
                        member?.voice.setChannel(destinationChannel as VoiceChannel).catch();
                });
            }
        }

        if(interaction.channel === null)
            throw "Interaction called from PM";
        try {
            let message: Message;
            for(let i: number = 0; i < game.entities.length; i++) {
                if(game.thread)
                    message = await game.thread.send(game.entities[i].getContent());
                else if(i === 0)
                    message = await interaction.editReply(game.entities[i].getContent());
                else
                    message = await interaction.channel.send(game.entities[i].getContent());
                if((i === 0) && isNotificationPM) {
                    let textStrings: string[] = await this.getManyText(interaction, [
                        "GAME_NOTIFY_FFA_PM_TITLE", "GAME_NOTIFY_PM_DESCRIPTION"
                    ]);
                    let embed = this.gameUI.notificationFFAPMEmbed(
                        textStrings[0],
                        textStrings[1],
                        message.url,
                        interaction.guild?.name as string,
                        interaction.guild?.iconURL() || null
                    );
                    users.forEach(user => {
                        if(user.id !== game.interaction.user.id)
                            UtilsServicePM.send(user, embed)
                    });
                }
                game.entities[i].message = message;
                game.entities[i].messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
                game.entities[i].messageReactionCollector?.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
                UtilsServiceEmojis.reactOrder(message, game.entities[i].emojis);
            }
            message = (game.thread)
                ? await game.thread.send(game.entityDraft.getContent())
                : await interaction.channel.send(game.entityDraft.getContent());
            game.entityDraft.message = message;
            if(await this.getOneSettingString(game.interaction, "BASE_LANGUAGE") !== await this.getOneSettingString("DEFAULT", "BASE_LANGUAGE")) 
                game.entityDraft.englishLanguageOptions = (await this.getManyText("DEFAULT", UtilsDataCivilizations.civilizationsTags, draftEmojis.map(str => [str])))
                    .filter((str: string, index: number): boolean => !!draftFlags[index]);
            game.entityDraft.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityDraft.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
            game.entityDraft.messageCollector = message.channel.createMessageCollector({time: voteTimeMs});
            game.entityDraft.messageCollector.on("collect", async (message: Message) => GameService.messageCollectorFunction(message));
            message.react("🤔");

            message = (game.thread)
                ? await game.thread.send({
                    embeds: this.gameUI.readyEmbed(game.entityReady),
                    components: this.gameUI.gameReadyButton(buttonLabels)
                })
                : await interaction.channel.send({
                    embeds: this.gameUI.readyEmbed(game.entityReady),
                    components: this.gameUI.gameReadyButton(buttonLabels)
                });
            game.entityReady.message = message;
            game.entityReady.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityReady.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
            game.isSending = false;
        } catch {
            game.isProcessing = false;
            if(game.setTimeoutID !== null) {
                clearTimeout(game.setTimeoutID);
                game.setTimeoutID = null;
            }
            if(game.thread)
                game.thread.delete().catch();
            for(let i: number = 0; i < game.entities.length; i++)
                game.entities[i].destroy();
            game.entityDraft.destroy();
            game.entityReady.destroy();
            GameService.deleteGame(game);
        }
    }

    public async teamers(
        interaction: CommandInteraction, 
        usersInclude: string, 
        usersExclude: string, 
        usersOnly: string,
        isShort: boolean = false
    ) {
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

        let gameTeamersMainFlags: number[] = await this.getManySettingNumber(interaction, ...Array.from(UtilsDataGameTags.teamersGameTagsMap.keys()));
        let gameTeamersOptionsFlags: number[][] = [];
        if(isShort)
            gameTeamersMainFlags = Array<number>(gameTeamersMainFlags.length-1).fill(0).concat(1);

        let headers: string[] =  await this.getManyText(interaction, Array.from(UtilsDataGameTags.teamersGameTagsMap.keys()));
        let options: string[][] = [], emojis: string[][] = [];

        let teamersValues: string[][] = Array.from(UtilsDataGameTags.teamersGameTagsMap.values());
        for(let i in teamersValues) {
            gameTeamersOptionsFlags.push(await this.getManySettingNumber(interaction, ...teamersValues[i]));
            options.push(await this.getManyText(interaction, teamersValues[i]));
            emojis.push(await this.getManyText(interaction, this.getTeamersEmojisConfigsStrings()[i]))
        }
        this.filterOptions(gameTeamersMainFlags, gameTeamersOptionsFlags, headers, options, emojis);

        let captainsHeader: string = await this.getOneText(interaction, "GAME_TEAMERS_CAPTAINS");

        let draftHeaders: string[] = await this.getManyText(interaction, [
            "GAME_BANS_START", "GAME_BANS_PROCESSING"
        ]);
        let draftFlags: number[] = await this.getManySettingNumber(interaction, ...UtilsDataCivilizations.civilizationsTags);
        let draftEmojis: string[] = await this.getManySettingString(interaction, ...UtilsDataCivilizations.civilizationsTags.map((str: string): string => str+"_EMOJI"));
        let draftOptions: string[] = (await this.getManyText(interaction, UtilsDataCivilizations.civilizationsTags, draftEmojis.map(str => [str])));
        
        draftEmojis = draftEmojis.filter((str: string, index: number): boolean => !!draftFlags[index]);
        draftOptions = draftOptions.filter((str: string, index: number): boolean => !!draftFlags[index]);

        let voteTimeMs: number = await this.getOneSettingNumber(interaction, "GAME_VOTE_TIME_MS");
        let banThreshold: number = Math.ceil(await this.getOneSettingNumber(interaction,
            "GAME_TEAMERS_DRAFT_BAN_THRESHOLD_PERCENT"
        )*users.length/100);

        let readyTitle: string = await this.getOneText(interaction, "GAME_READY_TITLE");
        let readyDescriptions: string[] = await this.getManyText(interaction, [
            "GAME_READY_DESCRIPTION_PROCESSING", "GAME_READY_DESCRIPTION_FINISH",
            "GAME_RESULT_TIMEOUT_DESCRIPTION", "GAME_READY_DESCRIPTION_FORCE_END"
        ], [
            [UtilsGeneratorTimestamp.getRelativeTime(voteTimeMs)]
        ]);
        let readyFieldTitles: string[] = await this.getManyText(interaction, [
            "GAME_READY_FIELD_PLAYERS_TITLE", "GAME_READY_FIELD_READY_TITLE",
        ]);
        let readyFieldEmojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];
        let buttonLabels: string[] = await this.getManyText(interaction, [
            "GAME_BUTTON_READY", "GAME_BUTTON_SKIP", "GAME_BUTTON_DELETE"
        ]);

        let game: GameTeamers = new GameTeamers(
            interaction, users, voteTimeMs,
            headers, options, emojis,
            captainsHeader,
            draftHeaders, draftOptions, draftEmojis,
            banThreshold,
            readyTitle, readyDescriptions, readyFieldTitles, readyFieldEmojis
        );
        this.checkGame(game);
        if(game.errorReturnTag !== "") {
            let errorTexts: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", game.errorReturnTag
            ]);
            return await interaction.reply({embeds: this.gameUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
        }
        await interaction.deferReply();
        GameService.addGame(game);
        game.setTimeoutID = setTimeout(GameService.timeoutFunction, voteTimeMs, game);
        if(interaction.channel === null)
            throw "Interaction called from PM";

        // ======== Все проверки объекта пройдены

        let [isMoveToChannels, isThread, isNotificationPM] = (await this.getManySettingNumber(interaction,
            "GAME_MOVE_TO_VOICE_CHANNELS", "GAME_THREAD", "GAME_SEND_PM_NOTIFICATION"
        )).map(flag => Boolean(flag));
        isThread = isThread && (interaction.channel.type === ChannelType.GuildText);

        if(isThread) {
            try {
                game.thread = await (interaction.channel as TextChannel).threads.create({
                    name: await this.getOneText(interaction, "GAME_TEAMERS_THREAD_NAME", interaction.user.username)
                });
                let textStrings: string[] = await this.getManyText(interaction, [
                    "BASE_NOTIFY_TITLE", "GAME_NOTIFY_THREAD"
                ]);
                interaction.editReply({embeds: this.gameUI.notify(textStrings[0], textStrings[1])}).catch();
                setTimeout(
                    async (interaction: CommandInteraction) => await interaction.deleteReply(),
                    UtilsServiceTime.getMs(5, "s"),
                    interaction
                );
            } catch {
                let textStrings: string[] = await this.getManyText(interaction, [
                    "BASE_ERROR_TITLE", "GAME_ERROR_THREAD"
                ]);
                interaction.editReply({embeds: this.gameUI.error(textStrings[0], textStrings[1])}).catch();
                GameService.deleteGame(game);
                clearTimeout(game.setTimeoutID);
                return;
            }
        }

        if(isMoveToChannels) {
            let destinationChannel: VoiceChannel | undefined = (await this.getOneSettingString(interaction, "GAME_TEAMERS_VOICE_CHANNELS"))
                .split(" ")
                .filter(id => id !== "")
                .map(id => interaction.guild?.channels.cache.get(id))
                .filter(channel => !!channel && (channel?.type === ChannelType.GuildVoice))
                .map(channel => channel as VoiceChannel)
                .filter(channel => Array.from(channel.members.keys()).length === 0)[0];
            if(destinationChannel) {
                let channelsDepartureID: string[] = (await this.getOneSettingString(interaction, "GAME_TEAMERS_HOME_VOICE_CHANNELS"))
                    .split(" ")
                    .filter(id => id !== "");
                users.forEach(user => {
                    let member: GuildMember | undefined = interaction.guild?.members.cache.get(user.id);
                    if (channelsDepartureID.indexOf(member?.voice.channel?.id as string) !== -1)
                        member?.voice.setChannel(destinationChannel as VoiceChannel).catch();
                });
            }
        }

        try {
            let message: Message;
            for(let i: number = 0; i < game.entities.length; i++) {
                if(game.thread)
                    message = await game.thread.send(game.entities[i].getContent());
                else if(i === 0)
                    message = await interaction.editReply(game.entities[i].getContent());
                else
                    message = await interaction.channel.send(game.entities[i].getContent());
                if((i === 0) && isNotificationPM) {
                    let textStrings: string[] = await this.getManyText(interaction, [
                        "GAME_NOTIFY_TEAMERS_PM_TITLE", "GAME_NOTIFY_PM_DESCRIPTION"
                    ]);
                    let embed = this.gameUI.notificationTeamersPMEmbed(
                        textStrings[0],
                        textStrings[1],
                        message.url,
                        interaction.guild?.name as string,
                        interaction.guild?.iconURL() || null
                    );
                    users.forEach(user => {
                        if(user.id !== game.interaction.user.id)
                            UtilsServicePM.send(user, embed)
                    });
                }
                game.entities[i].message = message;
                game.entities[i].messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
                game.entities[i].messageReactionCollector?.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
                UtilsServiceEmojis.reactOrder(message, game.entities[i].emojis);
            }

            message = (game.thread)
                ? await game.thread.send(game.entityCaptains.getContent())
                : await interaction.channel.send(game.entityCaptains.getContent());
            game.entityCaptains.message = message;
            game.entityCaptains.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityCaptains.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
            UtilsServiceEmojis.reactOrder(message, game.entityCaptains.emojis);

            message = (game.thread)
                ? await game.thread.send( game.entityDraft.getContent())
                : await interaction.channel.send(game.entityDraft.getContent());
            game.entityDraft.message = message;
            if(await this.getOneSettingString(game.interaction, "BASE_LANGUAGE") !== await this.getOneSettingString("DEFAULT", "BASE_LANGUAGE"))
                game.entityDraft.englishLanguageOptions = (await this.getManyText("DEFAULT", UtilsDataCivilizations.civilizationsTags, draftEmojis.map(str => [str])))
                    .filter((str: string, index: number): boolean => !!draftFlags[index]);
            game.entityDraft.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityDraft.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
            game.entityDraft.messageCollector = message.channel.createMessageCollector({time: voteTimeMs});
            game.entityDraft.messageCollector.on("collect", async (message: Message) => GameService.messageCollectorFunction(message));
            message.react("🤔");

            message = (game.thread)
                ? await game.thread.send({
                    embeds: this.gameUI.readyEmbed(game.entityReady),
                    components: this.gameUI.gameReadyButton(buttonLabels)
                })
                : await interaction.channel.send({
                    embeds: this.gameUI.readyEmbed(game.entityReady),
                    components: this.gameUI.gameReadyButton(buttonLabels)
                });
            game.entityReady.message = message;
            game.entityReady.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityReady.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
            game.isSending = false;
        } catch {
            game.isProcessing = false;
            if(game.setTimeoutID !== null) {
                clearTimeout(game.setTimeoutID);
                game.setTimeoutID = null;
            }
            if(game.thread)
                game.thread.delete().catch();
            for(let i: number = 0; i < game.entities.length; i++)
                game.entities[i].destroy();
            game.entityCaptains.destroy();
            game.entityDraft.destroy();
            game.entityReady.destroy();
            GameService.deleteGame(game);
        }
    }

    public static async reactionCollectorFunction(reaction: MessageReaction, user: User): Promise<void> {
        let game: Game | undefined = GameService.getGameByGuildMessageID(
            reaction.message.guild?.id as string,
            reaction.message.id
        );
        if (!game) {
            reaction.message.delete().catch();
            return;
        }

        let entity: GameEntity | undefined;
        if (game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            entity = gameFFA.entities
                .slice()
                .concat([gameFFA.entityDraft, gameFFA.entityReady])
                .filter((entity: GameEntity): boolean => entity.message?.id === reaction.message.id)[0];
        } else if (game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            entity = gameTeamers.entities
                .slice()
                .concat([gameTeamers.entityCaptains, gameTeamers.entityDraft, gameTeamers.entityReady])
                .filter((entity: GameEntity): boolean => entity.message?.id === reaction.message.id)[0];
        }
        if (!entity) {
            reaction.message.delete().catch();
            return;
        }
        if(entity.type !== "Draft") {
            await entity.resolveProcessing(reaction, user);
            return;
        }

        if(UtilsServiceSyntax.parseBans(reaction.emoji.toString(), entity.options).bans.length === 1) {
            if (await entity.resolveProcessing(reaction, user))
                entity.message?.edit(entity.getContent());
            return;
        } else {
            await entity.resolveProcessing(reaction, user);
            return;
        }
    }

    public static async messageCollectorFunction(message: Message): Promise<void> {
        let game = GameService.getGames(message.guild?.id as string).filter((game: Game) => 
            game.users.some((user: User) => user.id === message.author.id)
        )[0];

        if(!game)
            return;
        if(game.users.map((user: User): string => user.id).indexOf(message.member?.user.id as string) === -1)
            return;
        let gameEntityDraft: GameEntityDraft | undefined;
        if(game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            gameEntityDraft = gameFFA.entityDraft;
        } else if(game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            gameEntityDraft = gameTeamers.entityDraft;
        }
        
        if(gameEntityDraft === undefined)
            return;
        if(!gameEntityDraft.message)
            return;
        let bans = UtilsServiceSyntax.parseBans(message.content, gameEntityDraft.options).bans;
        if(bans.length === 0) {
            bans = UtilsServiceSyntax.parseBans(message.content, gameEntityDraft.englishLanguageOptions).bans;
            if(bans.length === 0)
                return;
        }

        UtilsServiceEmojis.reactOrder(gameEntityDraft.message, bans.map(banIndex => gameEntityDraft?.emojis[banIndex] ?? "")).catch();
        gameEntityDraft.collectedMessages.push(message);
        message.react("📝").catch();
    }

    public static async timeoutFunction(game: Game): Promise<void> {
        if(!game.isProcessing)
            return;
        game.isProcessing = false;
        GameService.deleteGame(game);
        let isTimeout: boolean = (Date.now() >= game.date.getTime() + game.voteTimeMs);

        let gameEntityReady: GameEntityReady | undefined;
        if(game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            gameEntityReady = gameFFA.entityReady;
        } else if(game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            gameEntityReady = gameTeamers.entityReady;
        }

        if(!gameEntityReady)
            return;
        if(!gameEntityReady.message)
            return;

        await game.resolve();
        if((game.date.getTime() < Date.now()) && gameEntityReady.usersReadyStatus.some(status => status === 0))
            gameEntityReady.descriptions[0] = gameEntityReady.descriptions[1];
        else
            gameEntityReady.descriptions.pop();
        let gameService: GameService = new GameService();
        await gameEntityReady.message.edit({
            components: [],
            embeds: (isTimeout)
                ? gameService.gameUI.readyEmbed(gameEntityReady)
                : gameService.gameUI.readyAllFinishedEmbed(gameEntityReady)
        });

        let textStrings: string[] = await gameService.getManyText(game.interaction,
            [(game.type === "FFA")
                ? "GAME_FFA_RESULT_TITLE"
                : "GAME_TEAMERS_RESULT_TITLE",
                "GAME_RESULT_UNKNOWN", "GAME_RESULT_TIMEOUT_DESCRIPTION",
                "GAME_BANS_NONE"
            ]
        );
        if(game.thread)
            await game.thread.send({embeds: gameService.gameUI.resultEmbed(
                    game, textStrings[0], textStrings[1],
                    isTimeout, textStrings[2],
                    textStrings[3]
                )});
        else
            await game.interaction.channel?.send({embeds: gameService.gameUI.resultEmbed(
                    game, textStrings[0], textStrings[1],
                    isTimeout, textStrings[2],
                    textStrings[3]
                )});

        if(game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            await gameService.gameAdapter.callDraft(gameFFA);
            gameFFA.entities.forEach(entity => entity.destroy())
            gameFFA.entityDraft.destroy();
            gameFFA.entityReady.destroy();
        } else if(game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            await gameService.gameAdapter.callSplit(gameTeamers);
            gameTeamers.entities.forEach(entity => entity.destroy())
            gameTeamers.entityCaptains.destroy();
            gameTeamers.entityDraft.destroy();
            gameTeamers.entityReady.destroy();
        }
    }

    public async buttonReady(interaction: ButtonInteraction) {
        let game: Game | undefined = GameService.getGameByGuildMessageID(
            interaction.guild?.id as string,
            interaction.message.id
        );
        if(!game)
            return interaction.message.delete().catch();
        if(game.users.map((user: User): string => user.id).indexOf(interaction.user.id) === -1) {
            let textStrings = await this.getManyText(
                game.interaction,
                ["BASE_ERROR_TITLE", "GAME_ERROR_READY_BUTTON_NOT_MEMBER"]
            );
            return interaction.reply({embeds: this.gameUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        await interaction.deferUpdate();
        if(game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            gameFFA.entityReady.usersReadyStatus[
                gameFFA.users.map((user: User): string => user.id).indexOf(interaction.user.id)
                ] = 1;
            await gameFFA.entityReady.message?.edit({embeds: this.gameUI.readyEmbed(gameFFA.entityReady)});
            if(gameFFA.entityReady.usersReadyStatus.every(status => status))
                GameService.timeoutFunction(game);
        } else if(game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            gameTeamers.entityReady.usersReadyStatus[
                gameTeamers.users.map((user: User): string => user.id).indexOf(interaction.user.id)
                ] = 1;
            await gameTeamers.entityReady.message?.edit({embeds: this.gameUI.readyEmbed(gameTeamers.entityReady)});
            if(gameTeamers.entityReady.usersReadyStatus.every(status => status))
                GameService.timeoutFunction(game);
        }
    }

    public async buttonDelete(interaction: ButtonInteraction) {
        let game: Game | undefined = GameService.getGameByGuildMessageID(
            interaction.guild?.id as string,
            interaction.message.id
        );
        if(!game || !game.isProcessing)
            return interaction.message.delete().catch();
        if(interaction.user.id !== game.interaction.user.id) {
            let textStrings = await this.getManyText(
                game.interaction,
                ["BASE_ERROR_TITLE", "GAME_ERROR_DELETE_BUTTON_NOT_OWNER"]
            );
            return interaction.reply({embeds: this.gameUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }

        game.isProcessing = false;
        GameService.deleteGame(game);

        let textStrings = await this.getManyText(
            game.interaction,
            ["BASE_NOTIFY_TITLE", "GAME_NOTIFY_DELETED"]
        );
        interaction.reply({embeds: this.gameUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
        if(game.setTimeoutID !== null) {
            clearTimeout(game.setTimeoutID);
            game.setTimeoutID = null;
        }
        if(game.thread) 
            return game.thread.delete().catch();

        if(game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            gameFFA.entityReady.destroy();
            gameFFA.entityDraft.destroy();
        } else if (game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            gameTeamers.entityReady.destroy();
            gameTeamers.entityDraft.destroy();
            gameTeamers.entityCaptains.destroy();
        }
        for(let entity of game.entities)
            entity.destroy();
    }

    public async buttonSkip(interaction: ButtonInteraction) {
        let game: Game | undefined = GameService.getGameByGuildMessageID(
            interaction.guild?.id as string,
            interaction.message.id
        );
        if(!game || !game.isProcessing)
            return interaction.message.delete().catch();
        if(interaction.user.id !== game.interaction.user.id) {
            let textStrings = await this.getManyText(
                game.interaction,
                ["BASE_ERROR_TITLE", "GAME_ERROR_DELETE_BUTTON_NOT_OWNER"]
            );
            return interaction.reply({embeds: this.gameUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        GameService.timeoutFunction(game);
    }
}
