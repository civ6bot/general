import {ModuleBaseService} from "../base/base.service";
import {GameFFA, GameTeamers} from "./game.models";
import {DraftService} from "../draft/draft.service";
import {DraftFFA, DraftBlind} from "../draft/draft.models";
import {CoreServiceCivilizations} from "../../core/services/core.service.civilizations";
import {CommandInteraction, GuildMember, User} from "discord.js";
import {SplitService} from "../split/split.service";
import {SplitClassic, SplitCWC, SplitDouble, SplitRandom} from "../split/split.models";

export class GameAdapter extends ModuleBaseService {
    public async callDraft(game: GameFFA) {
        let typeDraftResultsIndexes: number[] = game.entities[game.entities.length-1].resultIndexes;
        let gameFFADraftConfig: number = await this.getOneSettingNumber(game.interaction, "GAME_FFA_DRAFT");
        if (!(game.users.length && typeDraftResultsIndexes.length && gameFFADraftConfig))
            return;

        let bans: string = game.entityDraft.banStrings.map((banString: string): string => banString.slice(banString.indexOf("<"), banString.indexOf(">")+1)).join(" ");
        let draftService: DraftService = new DraftService();
        if(typeDraftResultsIndexes[0] === 0) {  // FFA Classic
            let [minCivilizations, maxCivilizations]: number[] = await this.getManySettingNumber(game.interaction,
                "DRAFT_FFA_MIN_CIVILIZATIONS_DEFAULT", "DRAFT_FFA_MAX_CIVILIZATIONS_DEFAULT"
            );
            let draftFFA: DraftFFA = new DraftFFA(
                game.interaction, bans,
                await this.getManySettingNumber(game.interaction, ...CoreServiceCivilizations.civilizationsTags),
                await this.getManyText(game.interaction, CoreServiceCivilizations.civilizationsTags.map(text => text + "_TEXT")),
                game.users,
                minCivilizations, maxCivilizations
            );
            await draftService.ffa(game.interaction as CommandInteraction, 0, "", [], draftFFA);
        } else if(typeDraftResultsIndexes[0] === 1) {   // FFA Blind
            let [minCivilizations, maxCivilizations]: number[] = await this.getManySettingNumber(game.interaction,
                "DRAFT_BLIND_MIN_CIVILIZATIONS_DEFAULT", "DRAFT_BLIND_MAX_CIVILIZATIONS_DEFAULT"
            );
            let draftBlind: DraftBlind = new DraftBlind(
                game.interaction, bans,
                await this.getManySettingNumber(game.interaction, ...CoreServiceCivilizations.civilizationsTags),
                await this.getManyText(game.interaction, CoreServiceCivilizations.civilizationsTags.map(text => text + "_TEXT")),
                game.users,
                minCivilizations, maxCivilizations
            );
            await draftService.blind(game.interaction as CommandInteraction, 0, "", [], draftBlind);
        }
    }

    public async callSplit(game: GameTeamers) {
        let gameTeamersSplitConfig: number = await this.getOneSettingNumber(game.interaction, "GAME_TEAMERS_SPLIT");
        let splitResultIndexes: number[] = game.entities[game.entities.length-1].resultIndexes;
        let captainsIndexes: number[] = game.entityCaptains.resultIndexes;
        if(!(gameTeamersSplitConfig && splitResultIndexes.length && captainsIndexes.length > 1))
            return;

        let bans: string = game.entityDraft.banStrings.map((banString: string): string => banString.slice(banString.indexOf("<"), banString.indexOf(">")+1)).join(" ");
        let splitService: SplitService = new SplitService();
        let gameTeamersSplitConfigOptions: number[] = await this.getManySettingNumber(game.interaction,
            "GAME_TEAMERS_SPLIT_CLASSIC", "GAME_TEAMERS_SPLIT_DOUBLE",
            "GAME_TEAMERS_SPLIT_CWC", "GAME_TEAMERS_SPLIT_RANDOM"
        );
        let splitTypeIndex: number = gameTeamersSplitConfigOptions
            .map((configOption: number, index: number) => configOption ? index : -1)
            .filter(configOption => configOption !== -1)
            [splitResultIndexes[0]];
        let splitType: string = [
            "Classic", "Double", "CWC", "Random"
        ][splitTypeIndex];
        let captains: User[] = game.entityCaptains.resultIndexes.map((value: number): User => game.entityCaptains.users[value]);

        let interaction: CommandInteraction = game.interaction as CommandInteraction;
        let dummyMember: GuildMember = game.interaction.member as GuildMember;

        switch(splitType) {
            case "Random":
                let splitRandom: SplitRandom = new SplitRandom(interaction, captains, game.users, bans);
                return await splitService.random(interaction, dummyMember, dummyMember, [], splitRandom);
            case "Classic":
                let splitClassic: SplitClassic = new SplitClassic(interaction, captains, game.users, bans);
                return await splitService.allLongSplits(interaction, splitType, dummyMember, dummyMember, [], splitClassic);
            case "Double":
                let splitDouble: SplitDouble = new SplitDouble(interaction, captains, game.users, bans);
                return await splitService.allLongSplits(interaction, splitType, dummyMember, dummyMember, [], splitDouble);
            case "CWC":
                let splitCWC: SplitCWC = new SplitCWC(interaction, captains, game.users, bans);
                return await splitService.allLongSplits(interaction, splitType, dummyMember, dummyMember, [], splitCWC);
        }
    }
}