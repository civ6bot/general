import {ModuleBaseService} from "../base/base.service";
import {Split} from "./split.models";
import {DraftService} from "../draft/draft.service";
import {DraftTeamers} from "../draft/draft.models";
import {CommandInteraction} from "discord.js";
import {UtilsDataCivilizations} from "../../utils/data/utils.data.civilizations";

export class SplitAdapter extends ModuleBaseService {
    public async callDraft(split: Split) {
        if(split.bansForDraft === null)
            return;

        let configs: number[] = await this.getManySettingNumber(split.interaction, ...UtilsDataCivilizations.civilizationsTags);
        let civEmojis: string[] = await this.getManySettingString(split.interaction, ...UtilsDataCivilizations.civilizationsTags.map((str: string): string => str+"_EMOJI"));
        let civLines: string[] = (await this.getManyText(split.interaction, UtilsDataCivilizations.civilizationsTags, civEmojis.map(str => [str])));
        let teamDraftForbiddenPairs: number[][] = (await this.getOneSettingString(split.interaction, "DRAFT_TEAMERS_FORBIDDEN_PAIRS"))
            .split(" ")
            .map( (pair: string): number[] => pair.split("_")
                .map( (x: string): number => Number(x)));

        let draftService: DraftService = new DraftService();
        let draft: DraftTeamers = new DraftTeamers(
            split.interaction,
            split.bansForDraft,
            configs,
            civLines,
            split.captains,
            split.captains.length,
            teamDraftForbiddenPairs
        );
        if(split.thread)
            draft.thread = split.thread;
        draftService.teamers(split.interaction as CommandInteraction, 0, "", [], draft);
    }
}
