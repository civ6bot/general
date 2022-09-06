import {ModuleBaseService} from "../base/base.service";
import {Split} from "./split.models";
import {DraftService} from "../draft/draft.service";
import {DraftTeamers} from "../draft/draft.models";
import {CommandInteraction} from "discord.js";
import {CoreServiceCivilizations} from "../../core/services/core.service.civilizations";

export class SplitAdapter extends ModuleBaseService {
    public async callDraft(split: Split) {
        if(split.bansForDraft === null)
            return;

        let configs: number[] = await this.getManySettingNumber(split.interaction, ...CoreServiceCivilizations.civilizationsTags);
        let texts: string[] = await this.getManyText(split.interaction, CoreServiceCivilizations.civilizationsTags.map(text => text + "_TEXT"));
        let teamDraftForbiddenPairs: number[][] = (await this.getOneSettingString(split.interaction, "DRAFT_TEAMERS_FORBIDDEN_PAIRS"))
            .split(" ")
            .map( (pair: string): number[] => pair.split("_")
                .map( (x: string): number => Number(x)));

        let draftService: DraftService = new DraftService();
        let draft: DraftTeamers = new DraftTeamers(
            split.interaction,
            split.bansForDraft,
            configs,
            texts,
            split.captains,
            split.captains.length,
            teamDraftForbiddenPairs
        );
        await draftService.teamers(split.interaction as CommandInteraction, 0, "", [], draft);
    }
}
