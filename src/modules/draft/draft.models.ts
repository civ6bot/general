import {ModuleBaseModel} from "../base/base.models";
import {ButtonInteraction, CommandInteraction, Message, User} from "discord.js";
import {CoreServiceCivilizations} from "../../core/services/core.service.civilizations";

export abstract class Draft extends ModuleBaseModel {
    public abstract readonly type: string;
    public users: User[];

    public readonly civilizationsTexts: string[];
    public errors: string[] = [];
    public bans: number[] = [];
    public civilizationsMainPool: number[] = [];
    public civilizationsPool: number[][];

    public runTimes: number = 0;
    public redraftStatus: number[] = [];
    public thresholdUsers: number = 0;

    public revertToMainPool(): number {
        this.runTimes++;
        let civilizationsPerPool: number = this.civilizationsPool[0].length || 0;
        this.civilizationsMainPool = this.civilizationsMainPool
            .concat(this.civilizationsPool.reduce((a, b) => a.concat(b), []))
            .sort((a, b) => a-b);
        let civilizationPoolsAmount: number = this.civilizationsPool.length;
        this.civilizationsPool = [];
        for(let i: number = 0; i < civilizationPoolsAmount; i++)      // нельзя использовать .fill([])
            this.civilizationsPool.push([]);                          // иначе всё будет одинаковое
        return civilizationsPerPool;
    }

    protected constructor(
        interaction: CommandInteraction | ButtonInteraction,
        rawBans: string,
        civilizationsConfigs: number[],
        civilizationsTexts: string[],
        users: User[],
        poolsAmount: number = 0,
    ) {
        super(interaction);
        this.civilizationsTexts = civilizationsTexts;
        this.users = users;
        poolsAmount = poolsAmount || users.length;
        this.civilizationsPool = [];
        for(let i: number = 0; i < poolsAmount; i++)    // нельзя использовать .fill([])
            this.civilizationsPool.push([]);            // иначе всё будет одинаковое
        if(poolsAmount === 0) {
            this.errorReturnTag = "DRAFT_ERROR_NO_VOICE";
            return;
        }
        this.civilizationsMainPool = [...Array(civilizationsConfigs.length).keys()].filter(x => civilizationsConfigs[x] === 1);
        let {bans, errors} = CoreServiceCivilizations.parseBans(rawBans, civilizationsTexts);
        this.bans = bans;
        this.errors = errors;
        this.civilizationsMainPool = this.civilizationsMainPool.filter(mainPoolIndex => bans.indexOf(mainPoolIndex) === -1);
    }

    public getPoolsText(): string[][] {
        return this.civilizationsPool.map((pool: number[]): string[] =>
            pool.map((civID: number): string => this.civilizationsTexts[civID])
                .sort()
        );
    }

    public getBansText(): string[] {
        return this.bans
            .map((ban: number): string => this.civilizationsTexts[ban])
            .sort();
    }
}

export class DraftFFA extends Draft {
    public override readonly type: string = "FFA";

    public divideCivilizations(amount: number = 0): void {
        let previousAmount: number = this.revertToMainPool();
        amount = amount || previousAmount;
        for(let i in this.civilizationsPool)
            for(let j: number = 0; j < amount; j++)
                this.civilizationsPool[i].push(
                    this.civilizationsMainPool.splice(Math.floor(Math.random() * this.civilizationsMainPool.length), 1)[0]
                );
    }

    constructor(
        interaction: CommandInteraction | ButtonInteraction, bans: string, configs: number[], texts: string[], users: User[],
        minCivilizationsAmount: number = 1, maxCivilizationsAmount: number = 16
    ) {
        super(interaction, bans, configs, texts, users);
        if(this.errorReturnTag !== "")
            return;

        let civilizationsPerPlayer = Math.min(Math.floor(this.civilizationsMainPool.length/this.civilizationsPool.length), maxCivilizationsAmount);
        if(civilizationsPerPlayer < minCivilizationsAmount) {
            this.errorReturnTag = "DRAFT_ERROR_NOT_ENOUGH_CIVILIZATIONS";
            return;
        }
        this.divideCivilizations(civilizationsPerPlayer);
    }
}

export class DraftTeamers extends Draft {
    public override readonly type: string = "Teamers";

    public teamersDraftForbiddenPairs: number[][] = [];

    public divideCivilizations(teamersDraftForbiddenPairs: number[][] = []): void {
        this.revertToMainPool();
        if(teamersDraftForbiddenPairs.length > 0)
            this.teamersDraftForbiddenPairs = teamersDraftForbiddenPairs;
        while (this.civilizationsMainPool.length >= this.civilizationsPool.length)
            for (let i in this.civilizationsPool)
                this.civilizationsPool[i].push(
                    this.civilizationsMainPool.splice(Math.floor(Math.random() * this.civilizationsMainPool.length), 1)[0]
                );

        let correctDraft: boolean = true;
        let tempValue: number;
        let indexA: number, indexB: number, indexAB: number,
            indexSwap: number, indexNextPool: number;
        do {
            correctDraft = true;
            for (let i: number = 0; i < this.civilizationsPool.length; i++) {
                for (let j: number = 0; j < teamersDraftForbiddenPairs.length; j++) {
                    indexA = this.civilizationsPool[i].indexOf(teamersDraftForbiddenPairs[j][0]);
                    indexB = this.civilizationsPool[i].indexOf(teamersDraftForbiddenPairs[j][1]);
                    if ((indexA !== -1) && (indexB !== -1)) {
                        correctDraft = false;
                        indexAB = Math.random() >= 0.5 ? indexA : indexB;
                        indexSwap = Math.floor(Math.random() * this.civilizationsPool[i].length);
                        indexNextPool = (i + 1) % this.civilizationsPool.length
                        tempValue = this.civilizationsPool[i][indexAB];
                        this.civilizationsPool[i][indexAB] = this.civilizationsPool[indexNextPool][indexSwap];
                        this.civilizationsPool[indexNextPool][indexSwap] = tempValue;
                    }
                }
            }
        } while (!correctDraft);
    }

    constructor(
        interaction: CommandInteraction | ButtonInteraction, bans: string, configs: number[], texts: string[], users: User[], teamAmount: number,
        teamersDraftForbiddenPairs: number[][]
    ) {
        super(interaction, bans, configs, texts, users, teamAmount);
        if(this.errorReturnTag !== "")
            return;

        this.teamersDraftForbiddenPairs = teamersDraftForbiddenPairs;
        this.divideCivilizations();
    }
}

export class DraftBlind extends DraftFFA {
    public override readonly type: string = "Blind";

    public message: Message | null = null;
    public pmMessages: Message[] = [];
    public redraftCivilizationsAmount: number = 0;

    constructor(
        interaction: CommandInteraction | ButtonInteraction, bans: string, configs: number[], texts: string[], users: User[],
        minCivilizationsAmount: number = 1, maxCivilizationsAmount: number = 16
    ) {
        super(interaction, bans, configs, texts, users, minCivilizationsAmount, maxCivilizationsAmount);
        this.redraftCivilizationsAmount = this.civilizationsPool[0]?.length || 0;
    }
}
