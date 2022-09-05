import {ModuleBaseModel} from "../base/base.models";
import {CommandInteraction, Message, MessageCollector, MessageReaction, ReactionCollector, User} from "discord.js";
import {CoreServiceLetters} from "../../core/services/core.service.letters";

export abstract class Game extends ModuleBaseModel {
    public abstract readonly type: string;
    public users: User[] = [];
    public entities: GameEntity[] = [];

    public voteTimeMs: number;

    protected constructor(interaction: CommandInteraction, users: User[], voteTimeMs: number) {
        super(interaction);
        this.voteTimeMs = voteTimeMs;
        this.users = users;
        if(this.users.length === 0) {
            this.errorReturnTag = "GAME_ERROR_NO_VOICE";
            return;
        }
        this.isProcessing = true;
    }

    public abstract resolve(): Promise<void>;
}

export class GameFFA extends Game {
    public override type: string = "FFA";
    public entityDraft: GameEntityDraft;
    public entityReady: GameEntityReady;

    public override async resolve(): Promise<void> {
        for(let i in this.entities)
            await this.entities[i].resolve();
        await this.entityDraft.resolve();
        await this.entityReady.resolve();
    }

    constructor(
        interaction: CommandInteraction, users: User[], voteTimeMs: number,
        headers: string[], options: string[][], emojis: string[][],
        draftHeaders: string[], draftOptions: string[], draftEmojis: string[], banThreshold: number,
        readyTitle: string, readyDescriptions: string[], readyFieldTitles: string[], fieldEmojis: string[]
    ) {
        super(interaction, users, voteTimeMs);
        for (let i in headers)
            this.entities.push(new GameEntityDefault(headers[i], options[i], emojis[i], users));
        this.entityDraft = new GameEntityDraft(draftHeaders, draftOptions, draftEmojis, users, banThreshold);
        this.entityReady = new GameEntityReady(readyTitle, readyDescriptions, readyFieldTitles, fieldEmojis, users, interaction.user);
        if (this.users.length < 2)
            this.errorReturnTag = "GAME_ERROR_NOT_ENOUGH_USERS";
    }
}

export class GameTeamers extends Game {
    public override type: string = "Teamers";
    public entityCaptains: GameEntityCaptains;
    public entityDraft: GameEntityDraft;
    public entityReady: GameEntityReady;

    public override async resolve(): Promise<void> {
        for(let i in this.entities)
            await this.entities[i].resolve();
        await this.entityCaptains.resolve();
        await this.entityDraft.resolve();
        await this.entityReady.resolve();
    }

    constructor(
        interaction: CommandInteraction, users: User[], voteTimeMs: number,
        headers: string[], options: string[][], emojis: string[][],
        captainsHeader: string,
        draftHeaders: string[], draftOptions: string[], draftEmojis: string[], banThreshold: number,
        readyTitle: string, readyDescriptions: string[], readyFieldTitles: string[], fieldEmojis: string[]
    ) {
        super(interaction, users, voteTimeMs);
        for(let i in headers)
            this.entities.push(new GameEntityDefault(headers[i], options[i], emojis[i], users));
        this.entityCaptains = new GameEntityCaptains(captainsHeader, users.map((user: User): string => user.toString()), CoreServiceLetters.getLetters().slice(0, users.length), users);
        this.entityDraft = new GameEntityDraft(draftHeaders, draftOptions, draftEmojis, users, banThreshold);
        this.entityReady = new GameEntityReady(readyTitle, readyDescriptions, readyFieldTitles, fieldEmojis, users, interaction.user);
        if (this.users.length < 4)
            this.errorReturnTag = "GAME_ERROR_NOT_ENOUGH_USERS";
        if (this.users.length > 16)
            this.errorReturnTag = "GAME_ERROR_TOO_MUCH_USERS";
    }
}

export abstract class GameEntity {
    public abstract readonly type: string;
    public header: string;
    public options: string[];
    public emojis: string[];

    public votesResults: number[] = [];
    public resultIndexes: number[] = [];

    public users: User[];
    public message: Message | null = null;
    public messageReactionCollector: ReactionCollector | null = null;

    public errorFlag: boolean = false;

    protected constructor(header: string, options: string[], emojis: string[], users: User[]) {
        this.header = header;
        this.options = options;
        this.emojis = emojis.map(emoji => emoji.toLowerCase());

        this.users = users;
    }

    public async destroy(): Promise<void> {
        try {
            await this.messageReactionCollector?.stop();
        } catch {} finally {
            this.messageReactionCollector = null;
        }
        try {
            await this.message?.delete();
        } catch {} finally {
            this.message = null;
        }
    }

    public getContent(): string {
        let content: string = `${this.header} | `;
        if(this.errorFlag)
            return content;
        content += (this.resultIndexes.length > 0)
            ? this.resultIndexes.map((resultIndex: number): string => `${this.emojis[resultIndex]} ${this.options[resultIndex]}`).join(", ")
            : this.options.map((option: string, index: number): string => `${this.emojis[index]} ${option}`).join(" | ");
        return content;
    }

    // map: emoji => votesResults
    protected async setVotesCount(): Promise<void> {
        let msg: Message = await this.message?.channel.messages.fetch(this.message?.id) as Message;
        let results: Array<[string, MessageReaction]> = Array.from(msg.reactions.cache);
        this.votesResults = this.emojis.map((emoji: string): number => results.filter(x => x[1].emoji.toString().toLowerCase() == emoji)[0]?.[1].count || 0);
    }

    protected getMaxIndexes(): number[] {
        return this.votesResults
            .map((value: number, index: number): number => (value === Math.max(...this.votesResults)) ? index : -1)
            .filter((value: number): boolean => value !== -1);
    }

    public abstract resolve(): Promise<void>;

    public abstract resolveProcessing(reaction: MessageReaction, user: User): Promise<boolean>;
}

export class GameEntityDefault extends GameEntity {
    public readonly type: string = "Default";
    constructor(header: string, options: string[], emojis: string[], users: User[]) {
        super(header, options, emojis, users);
    }

    // call every time when reacted
    public override async resolveProcessing(reaction: MessageReaction, user: User): Promise<boolean> {
        if(user.bot)
            return false;
        if(this.users.map(user => user.id).indexOf(user.id) === -1) {
            await reaction.message.reactions.resolve(reaction).users.remove(user);
            return false;
        }
        if(this.emojis.indexOf(reaction.emoji.toString().toLowerCase()) === -1) {
            await reaction.remove();
            return false;
        }
        return false;
    }

    // call 1 time (when all ready)
    public override async resolve(): Promise<void> {
        try {
            await this.setVotesCount();
            let maxIndexes: number[] = this.getMaxIndexes();
            this.resultIndexes.push(maxIndexes[Math.floor(Math.random()*maxIndexes.length)]);
        } catch {
            this.resultIndexes = [];
            this.errorFlag = true;
        }
    }
}

export class GameEntityDraft extends GameEntity {
    public readonly type: string = "Draft";
    public headerProcessing: string;

    public banThreshold: number;
    public banStrings: string[] = [];

    public messageCollector: MessageCollector | null = null;
    public collectedMessages: Message[] = [];

    constructor(
        headers: string[], options: string[], emojis: string[], users: User[],
        banThreshold: number,
    ) {
        super(headers[0], options, emojis, users);
        this.headerProcessing = headers[1];
        this.banThreshold = banThreshold;
    }

    public override async destroy(): Promise<void> {
        try {
            await this.messageReactionCollector?.stop();
        } catch {} finally {
            this.messageReactionCollector = null;
        }
        try {
            await this.message?.delete();
        } catch {} finally {
            this.message = null;
        }
        try {
            await this.messageCollector?.stop();
        } catch {} finally {
            this.messageCollector = null;
        }
        for(let message of this.collectedMessages)
            try {
                await message.delete();
            } catch {}
        this.collectedMessages = [];
    }

    public override getContent(): string {
        let content: string = `${this.header}`;
        if(this.banStrings.length > 0)
            content += "\n" + this.banStrings.join("\n");
        return content;
    }

    // call every time when reacted
    public async resolveProcessing(reaction: MessageReaction, user: User): Promise<boolean> {
        //console.log("Resolve draft emoji: ", reaction.emoji.toString(), " user: ", user.id);
        if(user.bot)
            return false;
        if(this.users.map(user => user.id).indexOf(user.id) === -1) {
            await reaction.message.reactions.resolve(reaction).users.remove(user);
            return false;
        }
        if(reaction.emoji.toString() === "🤔") {
            await reaction.message.reactions.resolve(reaction).users.remove(user);
            return false;
        }
        let emojiIndex: number = this.emojis.indexOf(reaction.emoji.toString().toLowerCase());
        if(emojiIndex === -1) {
            await reaction.remove();
            return false;
        }
        await this.setVotesCount();
        if(this.votesResults[emojiIndex] < this.banThreshold + Number(Array.from(reaction.users.cache.values()).some(user => user.bot)))    // если проголосовал бот
            return false;
        this.banStrings.push(this.options.splice(emojiIndex, 1)[0]);
        this.emojis.splice(emojiIndex, 1);
        this.header = this.headerProcessing;    // если хотя бы 1 забанена, то заголовок меняется
        await reaction.remove();
        return true;    // сообщение редактируется во внешнем методе
    }

    // call 1 time (when all ready)
    public override async resolve(): Promise<void> {
        this.banStrings.sort();
        this.header = this.headerProcessing;    // если заголовок не изменился, то тут изменится
    }
}

export class GameEntityCaptains extends GameEntity {
    public readonly type: string = "Captains";
    constructor(header: string, options: string[], emojis: string[], users: User[]) {
        super(header, options, emojis, users);
    }

    public override getContent(): string {
        let content: string = `${this.header} | `;
        if(this.errorFlag)
            return content;
        if(this.resultIndexes.length === 0) {
            content += (this.resultIndexes.length > 0)
                ? this.resultIndexes.map((resultIndex: number): string => `${this.emojis[resultIndex]} ${this.options[resultIndex]}`).join(", ")
                : this.options.map((option: string, index: number): string => `${this.emojis[index]} ${option}`).join(" | ");
        } else
            content = `${this.header.slice(0, -2)}:**\n${this.resultIndexes
                .map((resultIndex: number): string => `${this.options[resultIndex]}`)
                .join(" 🆚 ")}`;
        return content;
    }

    // call every time when reacted
    public override async resolveProcessing(reaction: MessageReaction, user: User): Promise<boolean> {
        if(user.bot)
            return false;
        if(this.users.map(user => user.id).indexOf(user.id) === -1) {
            await reaction.message.reactions.resolve(reaction).users.remove(user);
            return false;
        }
        if(this.emojis.indexOf(reaction.emoji.toString().toLowerCase()) === -1) {
            await reaction.remove();
            return false;
        }
        return false;
    }

    // call 1 time (when all ready)
    public override async resolve(): Promise<void> {
        try {
            await this.setVotesCount();
            let maxIndexes: number[] = this.getMaxIndexes();
            this.resultIndexes.push(maxIndexes[Math.floor(Math.random()*maxIndexes.length)]);
            this.votesResults[this.resultIndexes[0]] = -1;
            maxIndexes = this.getMaxIndexes();
            this.resultIndexes.push(maxIndexes[Math.floor(Math.random()*maxIndexes.length)]);
        } catch {
            this.resultIndexes = [];
            this.errorFlag = true;
        }
    }
}

// descriptions
// 0 = во время голосования, не меняется
// 1 = поменять, когда все проголосовали и успели нажать
// 2 = поменять, когда не успели нажать
// когда всё готово, под индексом 0 удаляется при помощи вызова метода resolve()
export class GameEntityReady extends GameEntity {
    public readonly type: string = "Ready";
    public author: User;

    public descriptions: string[];
    public fieldTitles: string[];

    public usersReadyStatus: number[];

    constructor(header: string, descriptions: string[], fieldTitles: string[], emojis: string[], users: User[], author: User) {
        super(header, [], emojis, users);
        this.author = author;

        this.descriptions = descriptions;
        this.fieldTitles = fieldTitles;

        this.usersReadyStatus = new Array(this.users.length).fill(0);
    }

    // call every time when reacted
    public override async resolveProcessing(reaction: MessageReaction, user: User): Promise<false> {
        await reaction.remove();
        return false;
    }

    // call 1 time (when all ready)
    public override async resolve(): Promise<void> {
        if(this.descriptions.length > 1)
            this.descriptions = [this.descriptions[(this.usersReadyStatus.every(status => status === 1)) ? 1 : 2]];
    }
}
