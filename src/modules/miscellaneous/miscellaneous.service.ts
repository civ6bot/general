import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, CommandInteraction, EmbedBuilder, Guild, Message, User} from "discord.js";
import {ModuleBaseService} from "../base/base.service";
import {MiscellaneousUI} from "./miscellaneous.ui";
import {UtilsServiceEmojis} from "../../utils/services/utils.service.emojis";
import { UtilsServiceUsers } from "../../utils/services/utils.service.users";
import { VoteSecret } from "./miscellaneous.models";
import { UtilsGeneratorTimestamp } from "../../utils/generators/utils.generator.timestamp";
import { UtilsServicePM } from "../../utils/services/utils.service.PM";

export class MiscellaneousService extends ModuleBaseService {
    private voteSecretMinUsers: number = 2;
    private voteSecretMaxUsers: number = 16;

    private miscellaneousUI: MiscellaneousUI = new MiscellaneousUI();

    public static votesSecret: Map<string, VoteSecret> = new Map<string, VoteSecret>();     // guildID + authorID

    private isOwner(interaction: ButtonInteraction): boolean {
        return interaction.customId
            .split("-")
            .filter(str => str.length)
            .indexOf(interaction.user.id) !== -1;
    }

    public async random(interaction: CommandInteraction, n: number) {
        let randomMax: number = (await this.getOneSettingNumber(interaction, "MISCELLANEOUS_RANDOM_MAX"));
        if(isNaN(n))
            n = randomMax;
        let randomValue: number = 1+Math.floor(Math.random()*n);
        let textStrings: string[] = await this.getManyText(
            interaction,
            ["MISCELLANEOUS_RANDOM_TITLE", "MISCELLANEOUS_RANDOM_BEST_DESCRIPTION",
                "MISCELLANEOUS_RANDOM_DESCRIPTION", "BASE_ERROR_TITLE", "MISCELLANEOUS_RANDOM_ERROR_BOUNDS"],
            [[n], [randomValue], [randomValue], null, [randomMax]]
        );
        if(n <= 1 || n > randomMax)
            return interaction.reply({embeds: this.miscellaneousUI.error(textStrings[3], textStrings[4]), ephemeral: true});
        interaction.reply({embeds: this.miscellaneousUI.random(textStrings[0], (randomValue === n) ? textStrings[1] : textStrings[2])});
    }

    public async coin(interaction: CommandInteraction) {
        let randomValue: boolean = Math.random() >= 0.5;
        let textStrings: string[] = await this.getManyText(
            interaction,
            ["MISCELLANEOUS_COIN_TITLE", "MISCELLANEOUS_COIN_HEADS_DESCRIPTION",
                "MISCELLANEOUS_COIN_TAILS_DESCRIPTION"]
        );
        interaction.reply({embeds: this.miscellaneousUI.coin(
            textStrings[0],
                randomValue,
                randomValue ? textStrings[1] : textStrings[2]
            )});
    }

    public async vote(interaction: CommandInteraction, voteContent: string) {
        let emojis: string[] = ["<:Yes:808418109710794843>", "<:No:808418109319938099>"];
        let textString: string = await this.getOneText(interaction, "MISCELLANEOUS_VOTE_TITLE");

        if(interaction.inCachedGuild()){
            let msg: Message = await interaction.reply({embeds: this.miscellaneousUI.vote(textString, voteContent), fetchReply: true});
            UtilsServiceEmojis.reactOrder(msg, emojis);
        }
    }

    public async voteSecret(
        interaction: CommandInteraction, 
        voteContent: string, 
        usersInclude: string,
        usersExclude: string,
        usersOnly: string
    ) {
        if(MiscellaneousService.votesSecret.get((interaction.guild?.id as string) + (interaction.user.id))) {
            let textStrings: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", "MISCELLANEOUS_VOTE_SECRET_ERROR_PROCESSING"
            ]);
            return interaction.reply({embeds: this.miscellaneousUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }

        let users: User[];
        if(usersOnly === "") {
            users = usersInclude
                .replaceAll("<@", " ")
                .replaceAll(">", " ")
                .split(" ")
                .filter(id => id !== "")
                .map((id: string): User | undefined => interaction.guild?.members.cache.get(id)?.user)
                .filter(user => !!user)
                .map(user => user as User)
                .concat(UtilsServiceUsers.getFromVoice(interaction));
            let usersExcludeID: string[] = usersExclude
                .replaceAll("<@", " ")
                .replaceAll(">", " ")
                .split(" ")
                .filter(id => (id !== "") && (id !== interaction.user.id));
            users = Array.from(new Set(users.filter(user => usersExcludeID.indexOf(user.id) === -1)));
        } else {
            users = usersOnly
                .replaceAll("<@", " ")
                .replaceAll(">", " ")
                .split(" ")
                .filter(id => id !== "")
                .map((id: string): User | undefined => interaction.guild?.members.cache.get(id)?.user)
                .filter(user => !!user)
                .map(user => user as User)
                .concat(interaction.user);
            users = Array.from(new Set(users));
        }

        if(users.length < this.voteSecretMinUsers) {
            let textStrings: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", "MISCELLANEOUS_VOTE_SECRET_ERROR_NOT_ENOUGH_USERS"
            ]);
            return interaction.reply({embeds: this.miscellaneousUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }
        if(users.length > this.voteSecretMaxUsers) {
            let textStrings: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", "MISCELLANEOUS_VOTE_SECRET_ERROR_TOO_MUCH_USERS"
            ]);
            return interaction.reply({embeds: this.miscellaneousUI.error(textStrings[0], textStrings[1]), ephemeral: true});
        }

        let voteTimeMs: number = await this.getOneSettingNumber(interaction, "MISCELLANEOUS_SECRET_VOTE_TIME_MS");
        let isAbstained: boolean = !!(await this.getOneSettingNumber(interaction, "MISCELLANEOUS_SECRET_VOTE_ABSTAINED"));
        let voteSecretEntity: VoteSecret = new VoteSecret(interaction, voteContent, users, voteTimeMs, isAbstained);
        MiscellaneousService.votesSecret.set((interaction.guild?.id as string) + (interaction.user.id), voteSecretEntity);
        voteSecretEntity.isProcessing = true;
        voteSecretEntity.setTimeoutID = setTimeout(MiscellaneousService.voteSecretTimeout, voteTimeMs, voteSecretEntity);

        let title: string = await this.getOneText(voteSecretEntity.interaction, "MISCELLANEOUS_VOTE_SECRET_TITLE");
        let description: string = await this.getOneText(
            voteSecretEntity.interaction, 
            "MISCELLANEOUS_VOTE_SECRET_DESCRIPTION", 
            voteSecretEntity.content, UtilsGeneratorTimestamp.getRelativeTime(voteSecretEntity.voteTimeMs+voteSecretEntity.date.getTime()-Date.now())
        );
        let fields: string[] = await this.getManyText(voteSecretEntity.interaction, [
            "MISCELLANEOUS_VOTE_SECRET_FIELD_TITLE_PLAYER", "MISCELLANEOUS_VOTE_SECRET_FIELD_TITLE_READY"
        ]);
        let deleteLabel: string = await this.getOneText(voteSecretEntity.interaction, "MISCELLANEOUS_VOTE_SECRET_BUTTON_DELETE");
        voteSecretEntity.interactionMessage = await interaction.reply({
            embeds: this.miscellaneousUI.voteSecretProcessingEmbed(voteSecretEntity.interaction.user, voteSecretEntity, title, description, fields),
            components: this.miscellaneousUI.voteSecretProcessingButtons(voteSecretEntity.interaction as CommandInteraction, deleteLabel),
            fetchReply: true
        });

        let pmDescription: string = await this.getOneText(
            interaction, 
            "MISCELLANEOUS_VOTE_SECRET_PM_DESCRIPTION",
            voteSecretEntity.content, UtilsGeneratorTimestamp.getRelativeTime(voteSecretEntity.voteTimeMs+voteSecretEntity.date.getTime()-Date.now())
        );
        let pmEmbed: EmbedBuilder[] = this.miscellaneousUI.voteSecretPMProcessingEmbed(interaction.guild as Guild, title, pmDescription);
        let pmLabels: string[] = await this.getManyText(interaction, [
            "MISCELLANEOUS_VOTE_SECRET_BUTTON_YES", "MISCELLANEOUS_VOTE_SECRET_BUTTON_ABSTAINED",
            "MISCELLANEOUS_VOTE_SECRET_BUTTON_NO"
        ]);
        let pmButtons: ActionRowBuilder<ButtonBuilder>[] = this.miscellaneousUI.voteSecretPMButtons(interaction, isAbstained, pmLabels);
        try {
            for(let i in voteSecretEntity.users) 
                voteSecretEntity.messages.push(await voteSecretEntity.users[i].send({embeds: pmEmbed, components: pmButtons}));
        } catch {
            if(voteSecretEntity.setTimeoutID) {
                clearTimeout(voteSecretEntity.setTimeoutID);
                voteSecretEntity.setTimeoutID = null;
            }
            voteSecretEntity.isProcessing = false;
            MiscellaneousService.votesSecret.delete((interaction.guild?.id as string) + (interaction.user.id));
            let textStrings: string[] = await this.getManyText(interaction, [
                "BASE_ERROR_TITLE", "MISCELLANEOUS_VOTE_SECRET_ERROR_TOO_MUCH_USERS"
            ], [null, [voteSecretEntity.users[voteSecretEntity.messages.length].toString()]]);
            interaction.editReply({
                embeds: this.miscellaneousUI.error(textStrings[0], textStrings[1]),
                components: []
            });
            for(let i in voteSecretEntity.messages) 
                voteSecretEntity.messages[i].delete().catch();
        }
    }

    public async voteSecretButtonDelete(interaction: ButtonInteraction) {
        let voteSecretEntity: VoteSecret|undefined = MiscellaneousService.votesSecret.get((interaction.guild?.id as string) + (interaction.user.id));
        if(Array.from(MiscellaneousService.votesSecret.keys()).length === 0)
            return interaction.message.delete().catch();
        if(!voteSecretEntity || voteSecretEntity.interactionMessage?.id !== interaction.message.id )
            return interaction.deferUpdate();
        MiscellaneousService.votesSecret.delete((interaction.guild?.id as string) + (interaction.user.id));
        voteSecretEntity.isProcessing = false;
        if(voteSecretEntity.setTimeoutID) {
            clearTimeout(voteSecretEntity.setTimeoutID);
            voteSecretEntity.setTimeoutID = null;
        }
        interaction.message.delete().catch();
        for(let i in voteSecretEntity.messages) 
            voteSecretEntity.messages[i].delete().catch();
    }

    public async voteSecretButtonVote(interaction: ButtonInteraction, voteResult: number) {
        let guildID: string = interaction.customId.split("-")[1];
        let authorID: string = interaction.customId.split("-")[2];
        let voteSecretEntity: VoteSecret|undefined = MiscellaneousService.votesSecret.get(guildID+authorID);
        if(!voteSecretEntity)
            return interaction.message.delete().catch();
        let index: number = voteSecretEntity.users.map(user => user.id).indexOf(interaction.user.id);
        if(index === -1)
            return interaction.message.delete().catch();
        voteSecretEntity.votes[index] = voteResult;

        let title: string = await this.getOneText(voteSecretEntity.interaction, "MISCELLANEOUS_VOTE_SECRET_TITLE");
        let pmDescription: string = await this.getOneText(
            voteSecretEntity.interaction,
            (voteResult === 1) ? "MISCELLANEOUS_VOTE_SECRET_PM_DESCRIPTION_RESULT_YES" :
            (voteResult === 2) ? "MISCELLANEOUS_VOTE_SECRET_PM_DESCRIPTION_RESULT_ABSTAINED" :
            "MISCELLANEOUS_VOTE_SECRET_PM_DESCRIPTION_RESULT_NO",
            voteSecretEntity.content, voteSecretEntity.interactionMessage?.url as string
        );

        voteSecretEntity.messages[index].edit({
            embeds: this.miscellaneousUI.voteSecretPMResultEmbed(
                voteSecretEntity.interaction.guild as Guild,
                false,
                title,
                pmDescription,
            ), components: []
        });
        if(voteSecretEntity.votes.filter(vote => vote === 0).length === 0) 
            return MiscellaneousService.voteSecretTimeout(voteSecretEntity);

        let description: string = await this.getOneText(
            voteSecretEntity.interaction, 
            "MISCELLANEOUS_VOTE_SECRET_DESCRIPTION", 
            voteSecretEntity.content, UtilsGeneratorTimestamp.getRelativeTime(voteSecretEntity.voteTimeMs+voteSecretEntity.date.getTime()-Date.now())
        );
        let fields: string[] = await this.getManyText(voteSecretEntity.interaction, [
            "MISCELLANEOUS_VOTE_SECRET_FIELD_TITLE_PLAYER", "MISCELLANEOUS_VOTE_SECRET_FIELD_TITLE_READY"
        ]);
        voteSecretEntity.interactionMessage?.edit({
            embeds: this.miscellaneousUI.voteSecretProcessingEmbed(
                voteSecretEntity.interaction.user, voteSecretEntity, title, description, fields
            ),
        });
    }

    public static async voteSecretTimeout(voteSecretEntity: VoteSecret) {
        if(!voteSecretEntity)
            return;
        MiscellaneousService.votesSecret.delete((voteSecretEntity.interaction.guild?.id as string) + (voteSecretEntity.interaction.user.id));
        voteSecretEntity.isProcessing = false;
        if(voteSecretEntity.setTimeoutID) {
            clearTimeout(voteSecretEntity.setTimeoutID);
            voteSecretEntity.setTimeoutID = null;
        }
        let isTimeout: boolean = (Date.now() - voteSecretEntity.voteTimeMs - voteSecretEntity.date.getTime() > 0);
        let miscellaneousService: MiscellaneousService = new MiscellaneousService();
        let title: string = await miscellaneousService.getOneText(voteSecretEntity.interaction, "MISCELLANEOUS_VOTE_SECRET_TITLE");
        let pmDescriptions: string[] = await miscellaneousService.getManyText(voteSecretEntity.interaction, [
            "MISCELLANEOUS_VOTE_SECRET_PM_DESCRIPTION_RESULT_TIMEOUT_ABSTAINED", "MISCELLANEOUS_VOTE_SECRET_PM_DESCRIPTION_RESULT_TIMEOUT_NO"
        ], [[voteSecretEntity.content, voteSecretEntity.interactionMessage?.url as string], 
        [voteSecretEntity.content, voteSecretEntity.interactionMessage?.url as string]]);
        let pmEmbed: EmbedBuilder[] = miscellaneousService.miscellaneousUI.voteSecretPMResultEmbed(
            voteSecretEntity.interaction.guild as Guild, true,
            title, (voteSecretEntity.isAbstained) ? pmDescriptions[0] : pmDescriptions[1]
        )
        for(let i in voteSecretEntity.votes)
            if(voteSecretEntity.votes[i] === 0) {
                voteSecretEntity.votes[i] = (voteSecretEntity.isAbstained) ? 2 : -1;
                voteSecretEntity.messages[i].edit({embeds: pmEmbed, components: []});
            }
        
        let descriptions: string[] = await miscellaneousService.getManyText(voteSecretEntity.interaction, [
            "MISCELLANEOUS_VOTE_SECRET_RESULT_DESCRIPTION", "MISCELLANEOUS_VOTE_SECRET_RESULT_TIMEOUT_TO_ABSTAINED_DESCRIPTION", 
            "MISCELLANEOUS_VOTE_SECRET_RESULT_TIMEOUT_TO_NO_DESCRIPTION"
        ], [[voteSecretEntity.content], [voteSecretEntity.content], [voteSecretEntity.content]]);
        let fields: string[] = await miscellaneousService.getManyText(voteSecretEntity.interaction, [
            "MISCELLANEOUS_VOTE_SECRET_FIELD_TITLE_YES", "MISCELLANEOUS_VOTE_SECRET_FIELD_TITLE_ABSTAINED",
            "MISCELLANEOUS_VOTE_SECRET_FIELD_TITLE_NO"
        ]);
        voteSecretEntity.interactionMessage?.edit({
            embeds: miscellaneousService.miscellaneousUI.voteSecretResultEmbed(
                voteSecretEntity.interaction.user,
                voteSecretEntity, isTimeout,
                title, (!isTimeout) ? descriptions[0] : (voteSecretEntity.isAbstained) ? descriptions[1] : descriptions[2],
                fields
            ),
            components: []
        });
    }
}
