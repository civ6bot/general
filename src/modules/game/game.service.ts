import {ModuleBaseService} from "../base/base.service";
import {GameUI} from "./game.ui";
import {ButtonInteraction, CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {Game, GameEntity, GameEntityDraft, GameEntityReady, GameFFA, GameTeamers} from "./game.models";
import {CoreGeneratorTimestamp} from "../../core/generators/core.generator.timestamp";
import {CoreServiceCivilizations} from "../../core/services/core.service.civilizations";
import {CoreServiceEmojis} from "../../core/services/core.service.emojis";
import {CoreServiceUsers} from "../../core/services/core.service.users";
import {GameAdapter} from "./game.adapter";

export class GameService extends ModuleBaseService {
    private gameUI: GameUI = new GameUI();
    public gameAdapter: GameAdapter = new GameAdapter();

    public static games: Map<string, Game> = new Map<string, Game>();    // guildID

    private checkGame(game: Game): void {
        if(game.errorReturnTag !== "")
            return;
        let key: string = game.guildID;
        let currentGame: Game | undefined = GameService.games.get(key);
        if(currentGame?.isProcessing)
            game.errorReturnTag = "GAME_ERROR_PROCESSING";
    }

    private readonly FFAHeaderConfigsStrings: string[] = [
        "GAME_FFA_MAP", "GAME_FFA_DISASTERS",
        "GAME_FFA_BONUS_RESOURCES", "GAME_FFA_STRATEGIC_RESOURCES",
        "GAME_FFA_WONDERS", "GAME_FFA_AGE",
        "GAME_FFA_GOLD_TRADING", "GAME_FFA_STRATEGIC_TRADING",
        "GAME_FFA_FRIENDS", "GAME_FFA_MILITARY_ALLIANCE",
        "GAME_FFA_CHATTING", "GAME_FFA_DRAFT"
    ];

    private readonly FFAOptionsConfigsStrings: string[][] = [
        [
            "GAME_FFA_MAP_PANGAEA", "GAME_FFA_MAP_CONTINENTS",
            "GAME_FFA_MAP_HIGHLANDS", "GAME_FFA_MAP_SEVEN_SEAS",
            "GAME_FFA_MAP_LAKES", "GAME_FFA_MAP_ARCHIPELAGO",
            "GAME_FFA_MAP_INLAND_SEA", "GAME_FFA_MAP_FRACTAL",
            "GAME_FFA_MAP_CONTINENTS_AND_ISLANDS", "GAME_FFA_MAP_PRIMORDIAL",
            "GAME_FFA_MAP_TILTED_AXIS",
        ],
        [
            "GAME_FFA_DISASTERS_1", "GAME_FFA_DISASTERS_2",
            "GAME_FFA_DISASTERS_3", "GAME_FFA_DISASTERS_4"
        ],
        [
            "GAME_FFA_BONUS_RESOURCES_STANDARD", "GAME_FFA_BONUS_RESOURCES_ABUNDANT"
        ],
        [
            "GAME_FFA_STRATEGIC_RESOURCES_STANDARD", "GAME_FFA_STRATEGIC_RESOURCES_ABUNDANT",
            "GAME_FFA_STRATEGIC_RESOURCES_GUARANTEED"
        ],
        [
            "GAME_FFA_WONDERS_STANDARD", "GAME_FFA_WONDERS_ABUNDANT"
        ],
        [
            "GAME_FFA_AGE_STANDARD", "GAME_FFA_AGE_NEW"
        ],
        [
            "GAME_FFA_GOLD_TRADING_NO", "GAME_FFA_GOLD_TRADING_ALLIES",
            "GAME_FFA_GOLD_TRADING_FRIENDS", "GAME_FFA_GOLD_TRADING_YES"
        ],
        [
            "GAME_FFA_STRATEGIC_TRADING_NO", "GAME_FFA_STRATEGIC_TRADING_ALLIES",
            "GAME_FFA_STRATEGIC_TRADING_FRIENDS", "GAME_FFA_STRATEGIC_TRADING_YES"
        ],
        [
            "GAME_FFA_FRIENDS_0", "GAME_FFA_FRIENDS_1",
            "GAME_FFA_FRIENDS_2", "GAME_FFA_FRIENDS_3",
            "GAME_FFA_FRIENDS_INFINITY"
        ],
        [
            "GAME_FFA_MILITARY_ALLIANCE_NO", "GAME_FFA_MILITARY_ALLIANCE_YES"
        ],
        [
            "GAME_FFA_CHATTING_ANY", "GAME_FFA_CHATTING_PUBLIC"
        ],
        [
            "GAME_FFA_DRAFT_CLASSIC", "GAME_FFA_DRAFT_BLIND"
        ]
    ];

    private readonly teamersHeaderConfigsStrings: string[] = [
        "GAME_TEAMERS_MAP", "GAME_TEAMERS_DISASTERS",
        "GAME_TEAMERS_BONUS_RESOURCES", "GAME_TEAMERS_STRATEGIC_RESOURCES",
        "GAME_TEAMERS_WONDERS", "GAME_TEAMERS_AGE",
        "GAME_TEAMERS_RELIC", "GAME_TEAMERS_REMAPS",
        "GAME_TEAMERS_SPLIT"
    ];

    private readonly teamersOptionsConfigsStrings: string[][] = [
        [
            "GAME_TEAMERS_MAP_PANGAEA", "GAME_TEAMERS_MAP_CONTINENTS",
            "GAME_TEAMERS_MAP_HIGHLANDS", "GAME_TEAMERS_MAP_SEVEN_SEAS",
            "GAME_TEAMERS_MAP_LAKES", "GAME_TEAMERS_MAP_ARCHIPELAGO",
            "GAME_TEAMERS_MAP_INLAND_SEA", "GAME_TEAMERS_MAP_FRACTAL",
            "GAME_TEAMERS_MAP_CONTINENTS_AND_ISLANDS", "GAME_TEAMERS_MAP_TILTED_AXIS",
            "GAME_TEAMERS_MAP_PRIMORDIAL"
        ],
        [
            "GAME_TEAMERS_DISASTERS_1", "GAME_TEAMERS_DISASTERS_2",
            "GAME_TEAMERS_DISASTERS_3", "GAME_TEAMERS_DISASTERS_4"
        ],
        [
            "GAME_TEAMERS_BONUS_RESOURCES_STANDARD", "GAME_TEAMERS_BONUS_RESOURCES_ABUNDANT"
        ],
        [
            "GAME_TEAMERS_STRATEGIC_RESOURCES_STANDARD", "GAME_TEAMERS_STRATEGIC_RESOURCES_ABUNDANT",
            "GAME_TEAMERS_STRATEGIC_RESOURCES_GUARANTEED"
        ],
        [
            "GAME_TEAMERS_WONDERS_STANDARD", "GAME_TEAMERS_WONDERS_ABUNDANT"
        ],
        [
            "GAME_TEAMERS_AGE_STANDARD", "GAME_TEAMERS_AGE_NEW"
        ],
        [
            "GAME_TEAMERS_RELIC_TURN_20", "GAME_TEAMERS_RELIC_YES"
        ],
        [
            "GAME_TEAMERS_REMAPS_NO", "GAME_TEAMERS_REMAPS_YES"
        ],
        [
            "GAME_TEAMERS_SPLIT_CLASSIC", "GAME_TEAMERS_SPLIT_DOUBLE",
            "GAME_TEAMERS_SPLIT_CWC", "GAME_TEAMERS_SPLIT_RANDOM"
        ]
    ];

    private getFFAEmojisConfigsStrings(): string[][] {
        return this.FFAOptionsConfigsStrings
            .map((arr: string[]): string[] =>
                arr.map((option: string): string => option + "_EMOJI"));
    }

    private getTeamersEmojisConfigsStrings(): string[][] {
        return this.teamersOptionsConfigsStrings
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

    public async ffa(interaction: CommandInteraction) {
        await interaction.deferReply();
        let users: User[] = CoreServiceUsers.getFromVoice(interaction);

        let gameFFAMainFlags: number[] = await this.getManySettingNumber(interaction, ...this.FFAHeaderConfigsStrings);
        let gameFFAOptionsFlags: number[][] = [];

        let headers: string[] =  await this.getManyText(interaction, this.FFAHeaderConfigsStrings);
        let options: string[][] = [], emojis: string[][] = [];

        for(let i in this.FFAOptionsConfigsStrings) {
            gameFFAOptionsFlags.push(await this.getManySettingNumber(interaction, ...this.FFAOptionsConfigsStrings[i]));
            options.push(await this.getManyText(interaction, this.FFAOptionsConfigsStrings[i]));
            emojis.push(await this.getManySettingString(interaction, ...this.getFFAEmojisConfigsStrings()[i]));
        }
        this.filterOptions(gameFFAMainFlags, gameFFAOptionsFlags, headers, options, emojis);

        let draftHeaders: string[] = await this.getManyText(interaction, [
            "GAME_BANS_START", "GAME_BANS_PROCESSING"
        ]);
        let draftFlags: number[] = await this.getManySettingNumber(interaction, ...CoreServiceCivilizations.civilizationsTags);
        let draftOptions: string[] = await this.getManyText(interaction, CoreServiceCivilizations.civilizationsTags.map(text => text + "_TEXT"))
        let draftEmojis: string[] = draftOptions.map(str => str.slice(str.indexOf("<"), str.indexOf(">")+1));
        for(let i: number = 0; i < draftFlags.length; i++)
            if(draftFlags[i] === 0) {
                draftFlags.splice(i, 1);
                draftOptions.splice(i, 1);
                draftEmojis.splice(i, 1);
                i--;
            }

        let voteTimeMs: number = await this.getOneSettingNumber(interaction, "GAME_VOTE_TIME_MS");
        let banThreshold: number = Math.round(await this.getOneSettingNumber(interaction,
            "GAME_FFA_DRAFT_BAN_THRESHOLD_PERCENT"
        )*users.length/100);

        let readyTitle: string = await this.getOneText(interaction, "GAME_READY_TITLE");
        let readyDescriptions: string[] = await this.getManyText(interaction, [
            "GAME_READY_DESCRIPTION_PROCESSING", "GAME_READY_DESCRIPTION_FINISH",
            "GAME_RESULT_TIMEOUT_DESCRIPTION"
        ], [
            [CoreGeneratorTimestamp.getRelativeTime(voteTimeMs)]
        ]);
        let readyFieldTitles: string[] = await this.getManyText(interaction, [
            "GAME_READY_FIELD_PLAYERS_TITLE", "GAME_READY_FIELD_READY_TITLE",
        ]);
        let readyFieldEmojis: string[] = await this.getManySettingString(interaction,
            "BASE_EMOJI_YES", "BASE_EMOJI_NO"
        );
        let buttonLabels: string[] = await this.getManyText(interaction, [
            "GAME_BUTTON_READY", "GAME_BUTTON_DELETE"
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
            return await interaction.editReply({embeds: this.gameUI.error(errorTexts[0], errorTexts[1])});
        }
        GameService.games.set(game.guildID, game);
        game.setTimeoutID = setTimeout(GameService.timeoutFunction, voteTimeMs, game);
        if(interaction.channel === null)
            throw "Interaction called from PM";

        let message: Message;
        try {
            for(let i: number = 0; i < game.entities.length; i++) {
                message = (i === 0)
                    ? await interaction.editReply(game.entities[i].getContent())
                    : await interaction.channel.send(game.entities[i].getContent());
                game.entities[i].message = message;
                game.entities[i].messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
                game.entities[i].messageReactionCollector?.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
                await CoreServiceEmojis.reactOrder(message, game.entities[i].emojis);
            }

            message = await interaction.channel.send(game.entityDraft.getContent());
            game.entityDraft.message = message;
            game.entityDraft.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityDraft.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
            game.entityDraft.messageCollector = message.channel.createMessageCollector({time: voteTimeMs});
            game.entityDraft.messageCollector.on("collect", async (message: Message) => GameService.messageCollectorFunction(message));
            await message.react("🤔");

            message = await interaction.channel.send({
                embeds: this.gameUI.readyEmbed(game.entityReady),
                components: this.gameUI.gameReadyButton(buttonLabels)
            });
            game.entityReady.message = message;
            game.entityReady.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityReady.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
        } catch {
            game.isProcessing = false;
            if(game.setTimeoutID !== null) {
                clearTimeout(game.setTimeoutID);
                game.setTimeoutID = null;
            }
            for(let i: number = 0; i < game.entities.length; i++)
                await game.entities[i].destroy();
            await game.entityDraft.destroy();
            await game.entityReady.destroy();
            GameService.games.delete(game.guildID);
        }
    }

    public async teamers(interaction: CommandInteraction) {
        await interaction.deferReply();
        let users: User[] = CoreServiceUsers.getFromVoice(interaction);

        let gameTeamersMainFlags: number[] = await this.getManySettingNumber(interaction, ...this.teamersHeaderConfigsStrings);
        let gameTeamersOptionsFlags: number[][] = [];

        let headers: string[] =  await this.getManyText(interaction, this.teamersHeaderConfigsStrings);
        let options: string[][] = [], emojis: string[][] = [];

        for(let i in this.teamersOptionsConfigsStrings) {
            gameTeamersOptionsFlags.push(await this.getManySettingNumber(interaction, ...this.teamersOptionsConfigsStrings[i]));
            options.push(await this.getManyText(interaction, this.teamersOptionsConfigsStrings[i]));
            emojis.push(await this.getManySettingString(interaction, ...this.getTeamersEmojisConfigsStrings()[i]))
        }
        this.filterOptions(gameTeamersMainFlags, gameTeamersOptionsFlags, headers, options, emojis);

        let captainsHeader: string = await this.getOneText(interaction, "GAME_TEAMERS_CAPTAINS");

        let draftHeaders: string[] = await this.getManyText(interaction, [
            "GAME_BANS_START", "GAME_BANS_PROCESSING"
        ]);
        let draftFlags: number[] = await this.getManySettingNumber(interaction, ...CoreServiceCivilizations.civilizationsTags);
        let draftOptions: string[] = await this.getManyText(interaction, CoreServiceCivilizations.civilizationsTags.map(text => text + "_TEXT"))
        let draftEmojis: string[] = draftOptions.map(str => str.slice(str.indexOf("<"), str.indexOf(">")+1));
        for(let i: number = 0; i < draftFlags.length; i++)
            if(draftFlags[i] === 0) {
                draftFlags.splice(i, 1);
                draftOptions.splice(i, 1);
                draftEmojis.splice(i, 1);
                i--;
            }

        let voteTimeMs: number = await this.getOneSettingNumber(interaction, "GAME_VOTE_TIME_MS");
        let banThreshold: number = Math.round(await this.getOneSettingNumber(interaction,
            "GAME_TEAMERS_DRAFT_BAN_THRESHOLD_PERCENT"
        )*users.length/100);

        let readyTitle: string = await this.getOneText(interaction, "GAME_READY_TITLE");
        let readyDescriptions: string[] = await this.getManyText(interaction, [
            "GAME_READY_DESCRIPTION_PROCESSING", "GAME_READY_DESCRIPTION_FINISH",
            "GAME_RESULT_TIMEOUT_DESCRIPTION"
        ], [
            [CoreGeneratorTimestamp.getRelativeTime(voteTimeMs)]
        ]);
        let readyFieldTitles: string[] = await this.getManyText(interaction, [
            "GAME_READY_FIELD_PLAYERS_TITLE", "GAME_READY_FIELD_READY_TITLE",
        ]);
        let readyFieldEmojis: string[] = await this.getManySettingString(interaction,
            "BASE_EMOJI_YES", "BASE_EMOJI_NO"
        );
        let buttonLabels: string[] = await this.getManyText(interaction, [
            "GAME_BUTTON_READY", "GAME_BUTTON_DELETE"
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
            return await interaction.editReply({embeds: this.gameUI.error(errorTexts[0], errorTexts[1])});
        }
        GameService.games.set(game.guildID, game);
        game.setTimeoutID = setTimeout(GameService.timeoutFunction, voteTimeMs, game);
        if(interaction.channel === null)
            throw "Interaction called from PM";

        let message: Message;
        try {
            for(let i: number = 0; i < game.entities.length; i++) {
                message = (i === 0)
                    ? await interaction.editReply(game.entities[i].getContent())
                    : await interaction.channel.send(game.entities[i].getContent());
                game.entities[i].message = message;
                game.entities[i].messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
                game.entities[i].messageReactionCollector?.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
                await CoreServiceEmojis.reactOrder(message, game.entities[i].emojis);
            }

            message = await interaction.channel.send(game.entityCaptains.getContent());
            game.entityCaptains.message = message;
            game.entityCaptains.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityCaptains.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
            await CoreServiceEmojis.reactOrder(message, game.entityCaptains.emojis);

            message = await interaction.channel.send(game.entityDraft.getContent());
            game.entityDraft.message = message;
            game.entityDraft.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityDraft.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
            game.entityDraft.messageCollector = message.channel.createMessageCollector({time: voteTimeMs});
            game.entityDraft.messageCollector.on("collect", async (message: Message) => GameService.messageCollectorFunction(message));
            await message.react("🤔");

            message = await interaction.channel.send({
                embeds: this.gameUI.readyEmbed(game.entityReady),
                components: this.gameUI.gameReadyButton(buttonLabels)
            });
            game.entityReady.message = message;
            game.entityReady.messageReactionCollector = message.createReactionCollector({time: voteTimeMs});
            game.entityReady.messageReactionCollector.on("collect", async (reaction: MessageReaction, user: User) => GameService.reactionCollectorFunction(reaction, user));
        } catch {
            game.isProcessing = false;
            if(game.setTimeoutID !== null) {
                clearTimeout(game.setTimeoutID);
                game.setTimeoutID = null;
            }
            for(let i: number = 0; i < game.entities.length; i++)
                await game.entities[i].destroy();
            await game.entityCaptains.destroy();
            await game.entityDraft.destroy();
            await game.entityReady.destroy();
            GameService.games.delete(game.guildID);
        }
    }

    public static async reactionCollectorFunction(reaction: MessageReaction, user: User): Promise<void> {
        let game: Game | undefined = GameService.games.get(reaction.message.guild?.id as string);
        if (!game) {
            await reaction.message.delete();
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
            await reaction.message.delete();
            return;
        }
        if ((await entity.resolveProcessing(reaction, user)) && (entity.type === "Draft"))
            await entity.message?.edit(entity.getContent());
    }

    public static async messageCollectorFunction(message: Message): Promise<void> {
        let game: Game | undefined = GameService.games.get(message.guild?.id as string);
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

        let {bans, errors} = CoreServiceCivilizations.parseBans(message.content, gameEntityDraft.options);
        if(bans.length === 0)
            return;

        try {
            // @ts-ignore
            await CoreServiceEmojis.reactOrder(gameEntityDraft.message, bans.map(banIndex => gameEntityDraft.emojis[banIndex]));
        } catch {}
        gameEntityDraft.collectedMessages.push(message);
        await message.react("📝");
    }

    public static async timeoutFunction(game: Game): Promise<void> {
        if(!game.isProcessing)
            return;
        game.isProcessing = false;
        GameService.games.delete(game.guildID);
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
                "GAME_RESULT_UNKNOWN", "GAME_RESULT_TIMEOUT_DESCRIPTION"]
        );
        await game.interaction.channel?.send({embeds: gameService.gameUI.resultEmbed(
            game, textStrings[0], textStrings[1],
                isTimeout, textStrings[2]
            )});

        if(game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            await gameService.gameAdapter.callDraft(gameFFA);
            for(let i in gameFFA.entities)
                await gameFFA.entities[i].destroy();
            await gameFFA.entityDraft.destroy();
            await gameFFA.entityReady.destroy();
        } else if(game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            await gameService.gameAdapter.callSplit(gameTeamers);
            for(let i in gameTeamers.entities)
                await gameTeamers.entities[i].destroy();
            await gameTeamers.entityCaptains.destroy();
            await gameTeamers.entityDraft.destroy();
            await gameTeamers.entityReady.destroy();
        }
    }

    public async buttonReady(interaction: ButtonInteraction) {
        let game: Game | undefined = GameService.games.get(interaction.guild?.id as string);
        if(!game)
            return await interaction.message.delete();
        if(game.users.map((user: User): string => user.id).indexOf(interaction.user.id) === -1) {
            let textStrings = await this.getManyText(
                game.interaction,
                ["BASE_ERROR_TITLE", "GAME_ERROR_READY_BUTTON_NOT_MEMBER"]
            );
            return await interaction.reply({embeds: this.gameUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        await interaction.deferUpdate();
        if(game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            gameFFA.entityReady.usersReadyStatus[
                gameFFA.users.map((user: User): string => user.id).indexOf(interaction.user.id)
                ] = 1;
            await gameFFA.entityReady.message?.edit({embeds: this.gameUI.readyEmbed(gameFFA.entityReady)});
            if(!gameFFA.entityReady.usersReadyStatus.some(status => status === 0))
                await GameService.timeoutFunction(game);
        } else if(game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            gameTeamers.entityReady.usersReadyStatus[
                gameTeamers.users.map((user: User): string => user.id).indexOf(interaction.user.id)
                ] = 1;
            await gameTeamers.entityReady.message?.edit({embeds: this.gameUI.readyEmbed(gameTeamers.entityReady)});
            if(!gameTeamers.entityReady.usersReadyStatus.some(status => status === 0))
                await GameService.timeoutFunction(game);
        }
    }

    public async buttonDelete(interaction: ButtonInteraction) {
        let game: Game | undefined = GameService.games.get(interaction.guild?.id as string);
        if(!game || !game.isProcessing)
            return await interaction.message.delete();
        if(interaction.user.id !== game.interaction.user.id) {
            let textStrings = await this.getManyText(
                game.interaction,
                ["BASE_ERROR_TITLE", "GAME_ERROR_DELETE_BUTTON_NOT_OWNER"]
            );
            return await interaction.reply({embeds: this.gameUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }

        game.isProcessing = false;
        GameService.games.delete(game.guildID);
        let textStrings = await this.getManyText(
            game.interaction,
            ["BASE_NOTIFY_TITLE", "GAME_NOTIFY_DELETED"]
        );
        await interaction.reply({embeds: this.gameUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
        if(game.type === "FFA") {
            let gameFFA: GameFFA = game as GameFFA;
            await gameFFA.entityReady.destroy();
            await gameFFA.entityDraft.destroy();
        } else if (game.type === "Teamers") {
            let gameTeamers: GameTeamers = game as GameTeamers;
            await gameTeamers.entityReady.destroy();
            await gameTeamers.entityDraft.destroy();
            await gameTeamers.entityCaptains.destroy();
        }
        for(let entity of game.entities)
            await entity.destroy();
    }
}
