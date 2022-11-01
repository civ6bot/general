import {ModuleBaseModel} from "../base/base.models";
import {CommandInteraction, Message, ReactionCollector, User} from "discord.js";
import {UtilsServiceLetters} from "../../utils/services/utils.service.letters";

export abstract class Split extends ModuleBaseModel {
    abstract type: string;

    public bansForDraft: string | null = null;

    public captains: User[];
    public users: string[];
    public teams: string[][] = [[], []];

    public emojis: string[] = UtilsServiceLetters.getLetters();
    public captainEmoji: string = "👑";

    public currentStep: number = 1;
    public totalStepAmount: number;
    public abstract pickSequence: number[];     // последовательность пиков
    public currentCaptainIndex: number = 0;     // -1 - никто, [0,1] - индексы капитанов

    public message: Message | null = null;
    public pickTimeMs: number = 0;
    public reactionCollector: ReactionCollector | null = null;

    protected constructor(interaction: CommandInteraction, captains: (User|null)[], users: User[], bansForDraft: string | null = null) {
        super(interaction);
        this.bansForDraft = bansForDraft;
        this.captains = captains.filter(captain => captain !== null).map((captain: User|null): User => captain as User);
        if(this.captains.length !== captains.length)
            this.captains.push(interaction.user);
        //console.log("Constructor: ", users);
        this.users = users.filter((user: User) => this.captains.map((captain: User): string => captain.id).indexOf(user.id) === -1).map(user => user.toString());
        this.totalStepAmount = this.users.length - this.users.length%this.teams.length - 1 + (this.users.length%this.teams.length > 0 ? 1 : 0);
        this.emojis = this.emojis.splice(0, this.users.length);
        if(this.captains.length < 2) {
            this.errorReturnTag = "SPLIT_ERROR_NO_CAPTAINS";
            return;
        }
        if(this.captains[0].toString() === this.captains[1].toString()) {
            this.errorReturnTag = "SPLIT_ERROR_NO_CAPTAINS";
            return;
        }
        if(users.length === 0) {
            this.errorReturnTag = "SPLIT_ERROR_NO_VOICE";
            return;
        }
        if(this.users.length < this.captains.length) {
            this.errorReturnTag = "SPLIT_ERROR_NOT_ENOUGH_USERS";
            return;
        }
        if(this.users.length > this.emojis.length) {
            this.errorReturnTag = "SPLIT_ERROR_TOO_MUCH_USERS";
            return;
        }
        if(Math.random() < 0.5)
            this.captains.unshift(this.captains.pop() as User);
        this.captains.forEach((captain: User, index: number) => this.teams[index].push(captain.toString()));
    }

    public getTeamsText(): string[] {
        let texts: string[] = this.teams.map((team: string[]): string => `${this.captainEmoji} ${team.join("\n")}`);
        if(this.users.length > 0)
            texts.unshift(
                this.users.map((user: string, index: number): string =>
                    this.currentCaptainIndex === -1 ? user : `${this.emojis[index]} ${user}`
                ).join("\n")
            )
        return texts;
    }

    public pickPlayer(userIndex: number): string {
        this.teams[this.currentCaptainIndex].push(this.users.splice(userIndex, 1)[0]);
        this.currentStep++;
        if(this.currentStep > this.totalStepAmount){
            if(this.users.length > 0) {
                let teamsLength: number[] = this.teams.map((team: string[]): number => team.length);
                if(!teamsLength.every(value => value === teamsLength[0]))
                    this.teams[teamsLength.indexOf(Math.min(...teamsLength))].push(this.users.pop() as string);
            }
            this.currentCaptainIndex = -1;
        } else
            this.currentCaptainIndex = this.pickSequence[this.currentStep-1] ?? -1;     // 0 is valid value
        return this.emojis.pop() as string;
    }
}

export class SplitRandom extends Split {
    override type = "Random";
    override pickSequence = [];

    constructor(interaction: CommandInteraction, captains: (User|null)[], users: User[], bansForDraft: string | null = null) {
        super(interaction, captains, users, bansForDraft);
        if(this.errorReturnTag !== "")
            return;
        while(this.users.length >= this.captains.length) {
            for(let i in this.teams)
                this.teams[i].push(this.users.splice(Math.floor(Math.random()*this.users.length), 1)[0]);
        }
        this.currentCaptainIndex = -1;
    }
}

export class SplitClassic extends Split {
    override type = "Classic";
    override pickSequence = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

    constructor(interaction: CommandInteraction, captains: (User|null)[], users: User[], bansForDraft: string | null = null) {
        super(interaction, captains, users, bansForDraft);
        this.isProcessing = true;
    }
}

export class SplitDouble extends Split {
    override type = "Double";
    override pickSequence = [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

    constructor(interaction: CommandInteraction, captains: (User|null)[], users: User[], bansForDraft: string | null = null) {
        super(interaction, captains, users, bansForDraft);
        this.isProcessing = true;
    }
}

export class SplitCWC extends Split {
    override type = "CWC";
    override pickSequence = [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0];

    constructor(interaction: CommandInteraction, captains: (User|null)[], users: User[], bansForDraft: string | null = null) {
        super(interaction, captains, users, bansForDraft);
        this.isProcessing = true;
    }
}
