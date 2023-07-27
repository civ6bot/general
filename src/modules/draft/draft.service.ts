import {ModuleBaseService} from "../base/base.service";
import {DraftUI} from "./draft.ui";
import {ButtonInteraction, CommandInteraction, DMChannel, EmbedBuilder, Guild, Message, User} from "discord.js";
import {Draft, DraftBlind, DraftFFA, DraftRedDeath, DraftTeamers} from "./draft.models";
import {UtilsGeneratorTimestamp} from "../../utils/generators/utils.generator.timestamp";
import {UtilsDataCivilizations} from "../../utils/data/utils.data.civilizations";
import {UtilsServiceUsers} from "../../utils/services/utils.service.users";
import {UtilsServiceForbiddenPairs} from "../../utils/services/utils.service.forbiddenPairs";
import {UtilsServicePM} from "../../utils/services/utils.service.PM";
import {UtilsDataFactions} from "../../utils/data/utils.data.factions";

export class DraftService extends ModuleBaseService {
    private draftUI: DraftUI = new DraftUI();

    public static drafts: Map<string, Draft[]> = new Map();    // guildID

    public static getDrafts(guildID: string): Draft[] {
        if(DraftService.drafts.get(guildID) === undefined)
            DraftService.drafts.set(guildID, []);
        return DraftService.drafts.get(guildID) as Draft[];
    }

    public static addDraft(draft: Draft): void {
        DraftService.getDrafts(draft.guildID).push(draft);
    }

    public static deleteDraft(draft: Draft): void {
        let guildDrafts: Draft[] = this.getDrafts(draft.guildID);
        let draftIndex: number = guildDrafts.indexOf(draft);
        if(draftIndex !== -1)
            guildDrafts.splice(draftIndex, 1);
    }

    public static getDraftByGuildUserID(guildID: string, userID: string): Draft | undefined {
        return this.getDrafts(guildID).filter(draft => draft.users.some(user => (user.id === userID)))[0];
    }

    // Map-объект имеет активные и неактивные объекты.
    // Функция ниже работает с ними и делает и делает следующее:
    // 1) проверяет, можно ли добавить новый
    // активный объект в список существующих;
    // 2) удаляет неактивные объекты.
    private checkDraft(draft: Draft): void {
        if(draft.errorReturnTag !== "")
            return;

        let guildDrafts: Draft[] = DraftService.getDrafts(draft.guildID);
        guildDrafts.forEach((guildDraft) => {
            if(draft.errorReturnTag !== "")
                return;
            if(guildDraft.isProcessing &&
                (guildDraft.users.map(user => user.id).filter(user => draft.users.map(user => user.id).includes(user)).length > 0)
            ) {
                draft.errorReturnTag = "DRAFT_ERROR_PROCESSING";
                return;
            }
        });

        if(draft.errorReturnTag !== "")
            return;
        guildDrafts = guildDrafts.filter((guildDraft) => 
            (guildDraft.isProcessing) ||
            (
                ((Date.now()-guildDraft.date.getTime()) < this.lifetimeOfMapObjects) &&
                (guildDraft.users.map(user => user.id).filter(user => draft.users.map(user => user.id).includes(user)).length === 0)
            )
        );
        DraftService.drafts.set(draft.guildID, guildDrafts);
    }

    public async ffa(interaction: CommandInteraction, civAmount: number, bans: string, users: User[] = [], outerDraft: DraftFFA | null = null) {
        let draft: DraftFFA;
        if(outerDraft)
            draft = outerDraft;
        else {
            let [minCivilizations, maxCivilizations]: number[] = (civAmount === 0)
                ? await this.getManySettingNumber(interaction, "DRAFT_FFA_MIN_CIVILIZATIONS_DEFAULT", "DRAFT_FFA_MAX_CIVILIZATIONS_DEFAULT")
                : [civAmount, civAmount];
            if(users.length === 0)
                users = UtilsServiceUsers.getFromVoice(interaction);
            let civEmojis: string[] = await this.getManySettingString(interaction, ...UtilsDataCivilizations.civilizationsTags.map((str: string): string => str+"_EMOJI"));
            let civLines: string[] = (await this.getManyText(interaction, UtilsDataCivilizations.civilizationsTags, civEmojis.map(str => [str])));
            draft = new DraftFFA(
                interaction, bans,
                await this.getManySettingNumber(interaction, ...UtilsDataCivilizations.civilizationsTags),
                civLines,
                users, minCivilizations, maxCivilizations
            );
        }
        this.checkDraft(draft);
        if(draft.errorReturnTag !== "") {
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", draft.errorReturnTag]);
            if(outerDraft) {
                (draft.thread)
                    ? draft.thread.send({embeds: this.draftUI.error(errorTexts[0], errorTexts[1])})
                    : interaction.channel?.send({embeds: this.draftUI.error(errorTexts[0], errorTexts[1])})
            } else
                interaction.reply({embeds: this.draftUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
            return;
        }
        DraftService.addDraft(draft);

        let textStrings: string[] = await this.getManyText(
            draft.interaction,
            ["DRAFT_FFA_TITLE_ONE_PLAYER", "DRAFT_FFA_TITLE_MANY_PLAYERS",
                "DRAFT_DRAFT_BANS_DESCRIPTION", "DRAFT_DRAFT_ERRORS_DESCRIPTION"],
            [null, [draft.users.length], [draft.bans.length]]
        );

        if(draft.runTimes > 1)
            draft.interaction.followUp({embeds: this.draftUI.draftFFAEmbed(
                    draft.users.length === 1 ? textStrings[0] : textStrings[1],
                    textStrings[2],
                    textStrings[3],
                    draft
                )});
        else if(outerDraft) {
            if(draft.thread)
                draft.thread.send({embeds: this.draftUI.draftFFAEmbed(
                        draft.users.length === 1 ? textStrings[0] : textStrings[1],
                        textStrings[2],
                        textStrings[3],
                        draft
                    )});
            else
                draft.interaction.channel?.send({embeds: this.draftUI.draftFFAEmbed(
                        draft.users.length === 1 ? textStrings[0] : textStrings[1],
                        textStrings[2],
                        textStrings[3],
                        draft
                    )})
        } else
            draft.interaction.reply({embeds: this.draftUI.draftFFAEmbed(
                draft.users.length === 1 ? textStrings[0] : textStrings[1],
                    textStrings[2],
                    textStrings[3],
                    draft
                )});
    }

    public async teamers(interaction: CommandInteraction, teamAmount: number, bans: string, users: User[] = [], outerDraft: DraftTeamers | null = null) {
        let draft: DraftTeamers;
        if(outerDraft)
            draft = outerDraft;
        else {
            if(users.length === 0)
                users = UtilsServiceUsers.getFromVoice(interaction);
            let forbiddenPairs: number[][] = UtilsServiceForbiddenPairs.getForbiddenPairs(
                await this.getOneSettingString(interaction, "DRAFT_TEAMERS_FORBIDDEN_PAIRS")
            );
            let civEmojis: string[] = await this.getManySettingString(interaction, ...UtilsDataCivilizations.civilizationsTags.map((str: string): string => str+"_EMOJI"));
            let civLines: string[] = (await this.getManyText(interaction, UtilsDataCivilizations.civilizationsTags, civEmojis.map(str => [str])));
            draft = new DraftTeamers(
                interaction,
                bans,
                await this.getManySettingNumber(interaction, ...UtilsDataCivilizations.civilizationsTags),
                civLines,
                users,
                teamAmount,
                forbiddenPairs
            );
        }
        this.checkDraft(draft);
        if(draft.errorReturnTag !== "") {
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", draft.errorReturnTag]);
            if(outerDraft) {
                (draft.thread)
                    ? draft.thread.send({embeds: this.draftUI.error(errorTexts[0], errorTexts[1])})
                    : interaction.channel?.send({embeds: this.draftUI.error(errorTexts[0], errorTexts[1])})
            } else
                interaction.reply({embeds: this.draftUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
            return;
        }
        DraftService.addDraft(draft);

        let textStrings: string[] = await this.getManyText(
            draft.interaction,
            ["DRAFT_TEAMERS_TITLE", "DRAFT_DRAFT_BANS_DESCRIPTION",
                "DRAFT_DRAFT_ERRORS_DESCRIPTION"],
            [[draft.civilizationsPool.length], [draft.bans.length]]
        );
        let teamDescriptionHeader: string[] = [];
        for(let i: number = 0; i < draft.civilizationsPool.length; i++)
            teamDescriptionHeader.push(await this.getOneText(draft.interaction, "DRAFT_TEAMERS_DESCRIPTION_TEAM", i+1));

        if(draft.runTimes > 1)
            draft.interaction.followUp({embeds: this.draftUI.draftTeamersEmbed(
                textStrings[0],
                    teamDescriptionHeader,
                    textStrings[1],
                    textStrings[2],
                    draft
                )});
        else if(outerDraft){
            if(draft.thread)
                draft.thread.send({embeds: this.draftUI.draftTeamersEmbed(
                        textStrings[0],
                        teamDescriptionHeader,
                        textStrings[1],
                        textStrings[2],
                        draft
                    )});
            else
                draft.interaction.channel?.send({embeds: this.draftUI.draftTeamersEmbed(
                        textStrings[0],
                        teamDescriptionHeader,
                        textStrings[1],
                        textStrings[2],
                        draft
                    )});
        } else
            draft.interaction.reply({embeds: this.draftUI.draftTeamersEmbed(
                textStrings[0],
                    teamDescriptionHeader,
                    textStrings[1],
                    textStrings[2],
                    draft
                )});
    }

    public async blind(interaction: CommandInteraction, civAmount: number, bans: string, users: User[] = [], outerDraft: DraftBlind | null = null) {
        let draft: DraftBlind;
        if(outerDraft)
            draft = outerDraft;
        else {
            let [minCivilizations, maxCivilizations]: number[] = (civAmount === 0)
                ? await this.getManySettingNumber(interaction, "DRAFT_BLIND_MIN_CIVILIZATIONS_DEFAULT", "DRAFT_BLIND_MAX_CIVILIZATIONS_DEFAULT")
                : [civAmount, civAmount];
            if(users.length === 0)
                users = UtilsServiceUsers.getFromVoice(interaction);
            let civEmojis: string[] = await this.getManySettingString(interaction, ...UtilsDataCivilizations.civilizationsTags.map((str: string): string => str+"_EMOJI"));
            let civLines: string[] = (await this.getManyText(interaction, UtilsDataCivilizations.civilizationsTags, civEmojis.map(str => [str])));
            draft = new DraftBlind(
                interaction, bans,
                await this.getManySettingNumber(interaction, ...UtilsDataCivilizations.civilizationsTags),
                civLines,
                users, minCivilizations, maxCivilizations
            );
        }
        this.checkDraft(draft);
        if(draft.errorReturnTag !== "") {
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", draft.errorReturnTag]);
            if(outerDraft) {
                (draft.thread)
                    ? draft.thread.send({embeds: this.draftUI.error(errorTexts[0], errorTexts[1])})
                    : interaction.channel?.send({embeds: this.draftUI.error(errorTexts[0], errorTexts[1])})
            } else
                interaction.reply({embeds: this.draftUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
            return;
        }
        if(!outerDraft)
            await interaction.deferReply();
        draft.isProcessing = true;
        DraftService.addDraft(draft);

        let pickTimeMs: number = await this.getOneSettingNumber(draft.interaction, "DRAFT_BLIND_PICK_TIME_MS");
        let emojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];
        let textStrings: string[] = await this.getManyText(
            draft.interaction,
            ["DRAFT_BLIND_TITLE_ONE_PLAYER", "DRAFT_BLIND_TITLE_MANY_PLAYERS",
                "DRAFT_BLIND_DESCRIPTION_PROCESSING", "DRAFT_DRAFT_BANS_DESCRIPTION",
                "DRAFT_DRAFT_ERRORS_DESCRIPTION", "DRAFT_BLIND_FIELD_PLAYERS_TITLE",
                "DRAFT_BLIND_FIELD_READY_TITLE", "DRAFT_BLIND_BUTTON_DELETE"],
            [null, [draft.users.length], [UtilsGeneratorTimestamp.getRelativeTime(pickTimeMs)], [draft.bans.length]]
        );

        if(draft.runTimes > 1)
            draft.message = await interaction.followUp({embeds: this.draftUI.draftBlindEmbed(
                draft.users.length === 1 ? textStrings[0] : textStrings[1],
                    textStrings[2],
                    textStrings[3],
                    textStrings[4],
                    textStrings[5],
                    textStrings[6],
                    emojis,
                    draft
                ), components: this.draftUI.draftBlindDeleteButton(textStrings[7])});
        else if(outerDraft) {
            if(draft.thread)
                draft.message = await draft.thread.send({embeds: this.draftUI.draftBlindEmbed(
                        draft.users.length === 1 ? textStrings[0] : textStrings[1],
                        textStrings[2],
                        textStrings[3],
                        textStrings[4],
                        textStrings[5],
                        textStrings[6],
                        emojis,
                        draft
                    ), components: this.draftUI.draftBlindDeleteButton(textStrings[7])})
            else
                draft.message = await interaction.channel?.send({embeds: this.draftUI.draftBlindEmbed(
                    draft.users.length === 1 ? textStrings[0] : textStrings[1],
                        textStrings[2],
                        textStrings[3],
                        textStrings[4],
                        textStrings[5],
                        textStrings[6],
                        emojis,
                        draft
                    ), components: this.draftUI.draftBlindDeleteButton(textStrings[7])}) as Message
        } else
            draft.message = await interaction.editReply({embeds: this.draftUI.draftBlindEmbed(
                    draft.users.length === 1 ? textStrings[0] : textStrings[1],
                    textStrings[2],
                    textStrings[3],
                    textStrings[4],
                    textStrings[5],
                    textStrings[6],
                    emojis,
                    draft
                ), components: this.draftUI.draftBlindDeleteButton(textStrings[7])});
        textStrings = await this.getManyText(
            draft.interaction,
            ["DRAFT_BLIND_PM_TITLE", "DRAFT_BLIND_PM_DESCRIPTION_PROCESSING"],
            [null, [UtilsGeneratorTimestamp.getRelativeTime(pickTimeMs)]]
        );

        for(let i: number = 0; i < draft.users.length; i++) {
            try {
                let message = await draft.users[i].send({
                    embeds: this.draftUI.draftBlindPMEmbed(
                        textStrings[0],
                        textStrings[1],
                        draft
                    ), components: this.draftUI.draftBlindPMCivilizationsButtons(draft, i),
                });
                draft.pmMessages.push(message);
            } catch {
                DraftService.deleteDraft(draft);
                draft.isProcessing = false;
                textStrings = await this.getManyText(
                    draft.interaction,
                    ["BASE_ERROR_TITLE", "DRAFT_BLIND_ERROR_PM"],
                    [null, [draft.users[draft.pmMessages.length].toString()]]
                );

                draft.message.edit({
                    embeds: this.draftUI.error(textStrings[0], textStrings[1]),
                    components: []
                });
                for(let i in draft.pmMessages)
                    draft.pmMessages[i].delete();
                return;
            }
        }

        draft.setTimeoutID = setTimeout(DraftService.blindTimeout, pickTimeMs+draft.date.getTime()-Date.now(), draft);
        // Здесь разность, чтобы было корректное время (из-за задержки между вызовом и сообщением в чате)
    }

    public static async blindTimeout(draft: DraftBlind): Promise<void> {
        let draftService: DraftService = new DraftService();
        draft.isProcessing = false;

        let textStrings = await draftService.getManyText(
            draft.interaction,
            ["DRAFT_BLIND_PM_TITLE", "DRAFT_BLIND_TITLE_ONE_PLAYER",
                "DRAFT_BLIND_TITLE_MANY_PLAYERS", "DRAFT_BLIND_DESCRIPTION_PROCESSING_TIMEOUT",
                "DRAFT_DRAFT_BANS_DESCRIPTION", "DRAFT_DRAFT_ERRORS_DESCRIPTION",
                "DRAFT_BLIND_FIELD_PLAYERS_TITLE", "DRAFT_BLIND_FIELD_CIVILIZATION_TITLE"],
            [null, null, [draft.users.length], null, [draft.bans.length]]
        );

        for(let i in draft.civilizationsPool)
            if(draft.civilizationsPool[i].length > 1) {
                draft.civilizationsPool[i] = [draft.civilizationsPool[i][Math.floor(Math.random()*draft.civilizationsPool[i].length)]];
                draft.pmMessages[i].edit({components: [], embeds: draftService.draftUI.draftBlindPMEmbed(
                        textStrings[0],
                        await draftService.getOneText(draft.interaction, "DRAFT_BLIND_PM_DESCRIPTION_TIMEOUT", draft.getPoolsText()[i][0]),
                        draft
                    )});
            }

        draft.message?.edit({components: [], embeds: draftService.draftUI.draftBlindEmbed(
                draft.users.length === 1 ? textStrings[1] : textStrings[2],
                textStrings[3],
                textStrings[4],
                textStrings[5],
                textStrings[6],
                textStrings[7],
                [],
                draft
            )});
    }

    // blindButton-pick-guildID-civID
    public async blindButtonPick(interaction: ButtonInteraction) {
        let [guildID, civID]: string[] = interaction.customId.split("-").slice(2);
        let draft: DraftBlind | undefined = DraftService.getDraftByGuildUserID(
            guildID,
            interaction.user.id
        ) as (DraftBlind | undefined);
        if(!draft) {
            let dm: DMChannel = await interaction.user.createDM();
            let msg: Message = await dm.messages.fetch(interaction.message.id);
            return msg.delete();
        }

        let index: number = draft.users.indexOf(draft.users.filter(user => user.id === interaction.user.id)[0]);
        draft.civilizationsPool[index] = [Number(civID)];
        let textStrings = await this.getManyText(
            draft.interaction,
            ["DRAFT_BLIND_PM_TITLE", "DRAFT_BLIND_PM_DESCRIPTION_READY"],
            [null, [draft.getPoolsText()[index][0]]]
        );

        draft.pmMessages[index].edit({components: [], embeds: this.draftUI.draftBlindPMEmbed(
            textStrings[0],
                textStrings[1],
                draft
            )});

        let pickTimeMs: number = await this.getOneSettingNumber(draft.interaction, "DRAFT_BLIND_PICK_TIME_MS");
        textStrings = await this.getManyText(
            draft.interaction,
            ["DRAFT_BLIND_TITLE_ONE_PLAYER", "DRAFT_BLIND_TITLE_MANY_PLAYERS",
                "DRAFT_BLIND_DESCRIPTION_PROCESSING", "DRAFT_DRAFT_BANS_DESCRIPTION",
                "DRAFT_DRAFT_ERRORS_DESCRIPTION", "DRAFT_BLIND_FIELD_PLAYERS_TITLE",
                "DRAFT_BLIND_FIELD_READY_TITLE", "DRAFT_BLIND_FIELD_CIVILIZATION_TITLE"],
            [null, [draft.users.length], [UtilsGeneratorTimestamp.getRelativeTime(pickTimeMs+draft.date.getTime()-Date.now())], [draft.bans.length]]
        );  // здесь должна оставаться разность времени,
        // чтобы в сообщении показывало правильное время, а не начинало отчет заново
        let emojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];

        if(draft.civilizationsPool.every((pool: number[]): boolean => pool.length === 1)) {
            if(draft.setTimeoutID !== null) {
                clearTimeout(draft.setTimeoutID);
                draft.setTimeoutID = null;
            }
            draft.isProcessing = false;
            draft.message?.edit({components: [], embeds: this.draftUI.draftBlindEmbed(
                draft.users.length === 1 ? textStrings[0] : textStrings[1],
                    "",
                    textStrings[3],
                    textStrings[4],
                    textStrings[5],
                    textStrings[7],
                    [],
                    draft
                )});
        } else
            draft.message?.edit({embeds: this.draftUI.draftBlindEmbed(
                draft.users.length === 1 ? textStrings[0] : textStrings[1],
                    textStrings[2],
                    textStrings[3],
                    textStrings[4],
                    textStrings[5],
                    textStrings[6],
                    emojis,
                    draft
                )});
    }

    // blindButton-delete
    public async blindButtonDelete(interaction: ButtonInteraction) {
        let draft: DraftBlind | undefined = DraftService.getDraftByGuildUserID(
            interaction.guild?.id as string, 
            interaction.user.id
        ) as (DraftBlind | undefined);
        if(!draft)
            return interaction.message.delete();

        if(interaction.user.id !== draft.interaction.user.id){
            let textStrings = await this.getManyText(
                draft.interaction,
                ["BASE_ERROR_TITLE", "DRAFT_ERROR_BLIND_DELETE_BUTTON_NOT_OWNER"]
            );
            return interaction.reply({embeds: this.draftUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }

        if(draft.setTimeoutID !== null) {
            clearTimeout(draft.setTimeoutID);
            draft.setTimeoutID = null;
        }
        DraftService.deleteDraft(draft);
        for(let i in draft.pmMessages)
            draft.pmMessages[i].delete();

        let textStrings = await this.getManyText(
            interaction,
            ["BASE_NOTIFY_TITLE", "DRAFT_BLIND_NOTIFY_DELETED"]
        );
        await interaction.reply({embeds: this.draftUI.notify(textStrings[0], textStrings[1]), ephemeral: true});
        await interaction.message.delete();
    }

    public async redraft(interaction: CommandInteraction) {
        let draft: Draft | undefined = DraftService.getDraftByGuildUserID(
            interaction.guild?.id as string, 
            interaction.user.id
        );
        if(!draft){
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", "DRAFT_REDRAFT_ERROR_NOT_FOUND"]);
            return interaction.reply({embeds: this.draftUI.error(errorTexts[0], errorTexts[1])});
        }

        let settings: number[] = await this.getManySettingNumber(interaction,
            "REDRAFT_FFA_THRESHOLD_PERCENT", "REDRAFT_TEAMERS_THRESHOLD_PERCENT",
            "REDRAFT_BLIND_THRESHOLD_PERCENT", "REDRAFT_VOTE_TIME_MS"
            );
        let threshold: number = draft.type === "Blind"
            ? settings[2]
            : draft.type === "Teamers"
                ? settings[1]
                : settings[0];

        draft.isProcessing = true;
        draft.date = new Date();
        draft.redraftStatus = new Array(draft.users.length).fill(-1);
        draft.thresholdUsers = draft.thresholdUsers || Math.min(Math.round(draft.users.length*(threshold/100)+0.999), draft.users.length);
        draft.interaction = interaction;

        let emojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];
        let textStrings: string[] = await this.getManyText(
            interaction,
            ["DRAFT_REDRAFT_TITLE", "DRAFT_REDRAFT_DESCRIPTION_PROCESSING",
                "DRAFT_REDRAFT_FIELD_YES", "DRAFT_REDRAFT_FIELD_UNKNOWN",
                "DRAFT_REDRAFT_FIELD_NO", "DRAFT_REDRAFT_BUTTON_YES",
                "DRAFT_REDRAFT_BUTTON_NO", "DRAFT_REDRAFT_FIELD_ZERO_USERS"
            ], [[draft.runTimes], [draft.thresholdUsers, draft.users.length, UtilsGeneratorTimestamp.getRelativeTime(settings[3]+draft.date.getTime()-Date.now())],
                [emojis[0], draft.redraftStatus.filter(value => value === 1).length], [draft.redraftStatus.filter(value => value === -1).length],
                [emojis[1], draft.redraftStatus.filter(value => value === 0).length]
            ]
        );
        let redraftMessage: Message = await interaction.reply({embeds: this.draftUI.redraftEmbed(
            textStrings[0],
                textStrings[1],
                textStrings[2],
                textStrings[3],
                textStrings[4],
                textStrings[7],
                draft
            ), components: this.draftUI.redraftButtons([textStrings[5], textStrings[6]], emojis), 
            fetchReply: true});

        draft.setTimeoutID = setTimeout(DraftService.redraftTimeout, settings[3], draft);

        if(await this.getOneSettingNumber(interaction, "REDRAFT_NOTIFY_PM")) {
            let pmEmbed: EmbedBuilder[] = this.draftUI.redraftPMEmbed(
                interaction.guild as Guild,
                draft.type,
                textStrings[0],
                await this.getOneText(interaction, "DRAFT_REDRAFT_PM_DESCRIPTION"),
                redraftMessage.url
            );
            draft.users.forEach((user: User): void => {
                if(user.id !== interaction.user.id)
                    UtilsServicePM.send(user, pmEmbed); 
            });
        }
    }

    public static async redraftTimeout(draft: Draft): Promise<void> {
        let draftService: DraftService = new DraftService();
        draft.isProcessing = false;
        let emojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];
        let textStrings: string[] = await draftService.getManyText(
            draft.interaction,
            ["DRAFT_REDRAFT_TITLE", "DRAFT_REDRAFT_DESCRIPTION_TIMEOUT",
                "DRAFT_REDRAFT_FIELD_YES", "DRAFT_REDRAFT_FIELD_UNKNOWN",
                "DRAFT_REDRAFT_FIELD_NO", "DRAFT_REDRAFT_FIELD_ZERO_USERS"
            ], [[draft.runTimes], null,
                [emojis[0], draft.redraftStatus.filter(value => value === 1).length], [draft.redraftStatus.filter(value => value === -1).length],
                [emojis[1], draft.redraftStatus.filter(value => value === 0).length]
            ]
        );
        draft.runTimes = 0;
        draft.interaction.editReply({embeds: draftService.draftUI.redraftEmbed(
                textStrings[0],
                textStrings[1],
                textStrings[2],
                textStrings[3],
                textStrings[4],
                textStrings[5],
                draft
            ), components: []});
        draft.redraftStatus = [];
    }

    public static async redraftTimeoutSuccess(draft: Draft): Promise<void> {
        let draftService: DraftService = new DraftService();
        switch (draft.type) {
            case "FFA":
                let draftFFA: DraftFFA = draft as DraftFFA;
                draftFFA.divideCivilizations();
                draftService.ffa(draftFFA.interaction as CommandInteraction, 0, "", [], draftFFA);
                return;
            case "Teamers":
                let draftTeamers: DraftTeamers = draft as DraftTeamers;
                draftTeamers.divideCivilizations();
                draftService.teamers(draftTeamers.interaction as CommandInteraction, 0, "", [], draftTeamers);
                return;
            case "Blind":
                let draftBlind: DraftBlind = draft as DraftBlind;
                draftBlind.divideCivilizations(draftBlind.redraftCivilizationsAmount);
                draftBlind.pmMessages = [];
                draftService.blind(draftBlind.interaction as CommandInteraction, 0, "", [], draftBlind);
                return;
            case "Red Death":
                let draftRedDeath: DraftRedDeath = draft as DraftRedDeath;
                draftRedDeath.divideCivilizations();
                draftService.redDeath(draftRedDeath.interaction as CommandInteraction, 0, false, false, "", draftRedDeath);
        }
    }

    public async redraftButton(interaction: ButtonInteraction, voteStatus: boolean) {
        await interaction.deferUpdate();
        let guildDrafts: Draft[] = DraftService.getDrafts(interaction.guild?.id as string)
            .filter((guildDraft: Draft) => (guildDraft.redraftStatus.length > 0));
        if(guildDrafts.length === 0)
            return interaction.message.delete();

        let draft: Draft | undefined = guildDrafts.filter((guildDraft) => 
            guildDraft.users.map((user: User): string => user.id).some((userID: string) => (userID === interaction.user.id))
        )[0];
        if(!draft){
            let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", "DRAFT_REDRAFT_ERROR_NOT_MEMBER"]);
            return interaction.reply({embeds: this.draftUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
        }
        let index: number = draft.users.map((user: User): string => user.id).indexOf(interaction.user.id);
        draft.redraftStatus[index] = voteStatus ? 1 : 0;

        let redraftTimeMs: number = await this.getOneSettingNumber(draft.interaction, "REDRAFT_VOTE_TIME_MS");
        let emojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];
        let textStrings: string[] = await this.getManyText(
            interaction,
            ["DRAFT_REDRAFT_TITLE", "DRAFT_REDRAFT_DESCRIPTION_PROCESSING",
                "DRAFT_REDRAFT_DESCRIPTION_YES", "DRAFT_REDRAFT_DESCRIPTION_NO",
                "DRAFT_REDRAFT_FIELD_YES", "DRAFT_REDRAFT_FIELD_UNKNOWN",
                "DRAFT_REDRAFT_FIELD_NO", "DRAFT_REDRAFT_FIELD_ZERO_USERS"
            ], [
                [draft.runTimes],
                [draft.thresholdUsers, draft.users.length, UtilsGeneratorTimestamp.getRelativeTime(redraftTimeMs+draft.date.getTime()-Date.now())],
                [emojis[0]],
                [emojis[1]],
                [emojis[0], draft.redraftStatus.filter(value => value === 1).length],
                [draft.redraftStatus.filter(value => value === -1).length],
                [emojis[1], draft.redraftStatus.filter(value => value === 0).length]
            ]
        );
        if(draft.redraftStatus.filter(value => value === 1).length >= draft.thresholdUsers) {
            if(draft.setTimeoutID !== null) {
                clearTimeout(draft.setTimeoutID);
                draft.setTimeoutID = null;
            }
            draft.isProcessing = false;
            draft.thresholdUsers = Math.min(draft.thresholdUsers+1, draft.users.length);
            draft.date = new Date();

            interaction.message.edit({components: [], embeds: this.draftUI.redraftEmbed(
                textStrings[0],
                    textStrings[2],
                    textStrings[4],
                    textStrings[5],
                    textStrings[6],
                    textStrings[7],
                    draft
                )});
            draft.redraftStatus = [];
            setTimeout(DraftService.redraftTimeoutSuccess, 2000, draft);
        } else if(draft.redraftStatus.filter(value => value === 0).length >= draft.users.length-draft.thresholdUsers+1) {
            if(draft.setTimeoutID !== null) {
                clearTimeout(draft.setTimeoutID);
                draft.setTimeoutID = null;
            }
            draft.isProcessing = false;
            draft.runTimes = 0;
            interaction.message.edit({components: [], embeds: this.draftUI.redraftEmbed(
                textStrings[0],
                    textStrings[3],
                    textStrings[4],
                    textStrings[5],
                    textStrings[6],
                    textStrings[7],
                    draft
                )});
            draft.redraftStatus = [];
            DraftService.deleteDraft(draft);
        } else {
            interaction.message.edit({embeds: this.draftUI.redraftEmbed(
                textStrings[0],
                    textStrings[1],
                    textStrings[4],
                    textStrings[5],
                    textStrings[6],
                    textStrings[7],
                    draft
                )});
        }
    }

    public async redDeath(interaction: CommandInteraction, factionsAmount: number, haveDuplicates: boolean, isRDModEnabled: boolean, bans: string, outerDraft: DraftRedDeath | null = null) {
        let draft: DraftRedDeath;
        if(outerDraft)
            draft = outerDraft;
        else {
            const factionsByDefault: number = 4;
            const maxFactions: number = 8;

            let users = UtilsServiceUsers.getFromVoice(interaction);
            let factionTags = UtilsDataFactions.factionTags.concat(
                (isRDModEnabled) ? UtilsDataFactions.additionalFactionTags : []
            );  
            let factionEmojis: string[] = await this.getManyText(interaction, factionTags.map((str: string): string => str+"_EMOJI"));
            let factionLines: string[] = (await this.getManyText(interaction, factionTags, factionEmojis.map(str => [str])));

            if(factionsAmount === 0)
                factionsAmount = Math.min(
                    (haveDuplicates) 
                        ? factionsByDefault 
                        : factionLines.length / users.length || 1,
                    maxFactions
                );

            draft = new DraftRedDeath(
                interaction, bans,
                Array(factionLines.length).fill(1),
                factionLines,
                users, factionsAmount,
                haveDuplicates
            );

            this.checkDraft(draft);
            if(draft.errorReturnTag !== "") {
                let errorTexts: string[] = await this.getManyText(interaction, ["BASE_ERROR_TITLE", draft.errorReturnTag]);
                interaction.reply({embeds: this.draftUI.error(errorTexts[0], errorTexts[1]), ephemeral: true});
                return;
            }
            DraftService.addDraft(draft);
        }

        let textStrings: string[] = await this.getManyText(
            draft.interaction,
            ["DRAFT_RED_DEATH_TITLE_ONE_PLAYER", "DRAFT_RED_DEATH_TITLE_MANY_PLAYERS",
                "DRAFT_DRAFT_BANS_DESCRIPTION", "DRAFT_DRAFT_ERRORS_DESCRIPTION"],
            [null, [draft.users.length], [draft.bans.length]]
        );

        let draftRedDeathEmbed = {embeds: this.draftUI.draftFFAEmbed(
            draft.users.length === 1 ? textStrings[0] : textStrings[1],
            textStrings[2],
            textStrings[3],
            draft,
            true
        )};

        (draft.runTimes > 1)
            ? draft.interaction.followUp(draftRedDeathEmbed)
            : draft.interaction.reply(draftRedDeathEmbed);
    }
}
