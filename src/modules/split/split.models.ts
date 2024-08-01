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

    public message: Message | null = null;      // Оно присваивается в service, но в конструкторе мы ещё не знаем, какое сообщение тут будет
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

    public getAllPlayersID(): string[] {
        return this.users.concat(this.captains.map(captain => captain.id));
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

export class SplitRating extends Split {
    override type = "Rating";
    override pickSequence = [];

    private combinationsWithoutRepetitionCount(n: number, k: any) { 
        return [...Array(k)].reduce((acc, _, i) => (acc * (n - i)) / (i + 1), 1); 
    }

    private combineWithoutRepetition(arr: string | any[], k: number): number[][] {
        const n = arr.length;
        const combinations = Array(this.combinationsWithoutRepetitionCount(arr.length, k)); // : T[][]
        const indexMask = [...Array(k)].map((_, i) => i);
        const endIndex = n - k;

        for(let i = 0; i < combinations.length; i++) {
            combinations[i] = indexMask.map((index) => arr[index]);
            let left = k - 1;
            while (left >= 0 && indexMask[left] === endIndex + left) 
                left--;
            if (left < 0) 
                break;
            indexMask[left]++;
            for(let right = left + 1; right < k; right++) {
                indexMask[right] = indexMask[right - 1] + 1;
            }
        }

        return combinations;
    }


    constructor(interaction: CommandInteraction, captains: (User|null)[], users: User[], ratings: number[] = [], bansForDraft: string | null = null) {
        super(interaction, captains, users, bansForDraft);
        if(this.errorReturnTag !== "")
            return;

        this.captains = [];
        this.users = [];
        this.teams = [[], []];
        //users.unshift(...(captains as User[]));
        //users = Array.from(new Set(users));
        let playersPerTeam: number = Math.floor(this.users.length/2);

        console.log("users length:", users.length);
        console.log("users:", users);
        console.log("ratings:", ratings);
        console.log("playersPerTeam", playersPerTeam);

        let sumOfRatings: number = ratings.reduce((a, b) => a+b, 0);
        let bestCombination: number[] = [];
        let excessRatingValue: number|null = null;

        if(ratings.length % 2) {
            let bestSum: number = sumOfRatings;
            for(let i: number = 0; i < ratings.length; i++) {
                let tempRatings: number[] = ratings.slice(0, i).concat(ratings.slice(i+1));
                let simpleCombinations: number[][] = this.combineWithoutRepetition(tempRatings, playersPerTeam);
                let sumOfCombinations: number[] = simpleCombinations.map(combination => Math.abs(sumOfRatings - 2*combination.reduce((a, b) => a+b, 0)));
                let tempBestSum = Math.min(...sumOfCombinations);
                let tempBestCombination = simpleCombinations[sumOfCombinations.indexOf(tempBestSum)];
                if(tempBestSum < bestSum) {
                    bestSum = tempBestSum;
                    bestCombination = tempBestCombination;
                    excessRatingValue = ratings[i];
                    if(bestSum <= 1) {
                        break;
                    }
                }
            }
        } else {
            console.log("comb func");
            let simpleCombinations: number[][] = this.combineWithoutRepetition(ratings, playersPerTeam);
            let sumOfCombinations: number[] = simpleCombinations.map(combination => Math.abs(sumOfRatings - 2*combination.reduce((a, b) => a+b, 0)));
            let bestSum: number = Math.min(...sumOfCombinations);
            bestCombination = simpleCombinations[sumOfCombinations.indexOf(bestSum)];
            console.log(simpleCombinations);
            console.log(sumOfCombinations);
            console.log(bestSum);
            console.log(bestCombination);
            console.log("end of comb func");
        }
       
        let userRatingUnions: {user: User, rating: number}[] = users.map((_, index: number) => { return {user: users[index], rating: ratings[index]}; });
        console.log("all user unions:", userRatingUnions);

        if(excessRatingValue !== null) {
            for(let i = 0; i < userRatingUnions.length; i++) {
                if(userRatingUnions[i].rating === excessRatingValue) {
                    this.users = [userRatingUnions[i].user.toString()];
                    userRatingUnions.splice(i, 1);
                    break;
                }
            }
        }
        console.log("best combination: ", bestCombination);
        console.log("excess value:", excessRatingValue);
        let userRatingUnionsFromCombination: {user: User, rating: number}[] = [];
        for(let i = 0; i < bestCombination.length; i++) {
            for(let j = 0; j < userRatingUnions.length; j++) {
                if(userRatingUnions[j].rating === bestCombination[i]) {
                    userRatingUnionsFromCombination.push(...userRatingUnions.splice(j, 1));
                    break;
                }
            }
        }

        let teamsUnions: {user: User, rating: number}[][] = [userRatingUnions, userRatingUnionsFromCombination];
        console.log("teams:", teamsUnions);
        /*
        for(let i = 0; i < 2; i++) {
            console.log("sort");
            teamsUnions[i].sort((a, b) => b.rating-a.rating);
            console.log("captain");
            captains.push(teamsUnions[i][0].user);
            console.log("push");
            teamsUnions[i].forEach(union => this.teams[i].push(union.user.toString()));
        }
        */
        teamsUnions.forEach((team, index) => {
            console.log("sort");
            team.sort((a, b) => b.rating-a.rating);
            console.log("captain");
            captains.push(team[0].user);
            console.log("push");
            this.teams[index] = team.map(union => union.user.toString());
        });

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
