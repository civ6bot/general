import {ModuleBaseService} from "../base/base.service";
import {Split} from "./split.models";
import {DraftService} from "../draft/draft.service";

export class SplitAdapter extends ModuleBaseService {
    public callDraft(split: Split) {
        let draftService: DraftService = new DraftService();
    }
}
