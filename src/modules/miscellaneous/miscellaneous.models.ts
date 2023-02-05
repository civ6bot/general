import { ButtonInteraction, CommandInteraction, Message, User } from "discord.js";
import { ModuleBaseModel } from "../base/base.models";

export class VoteSecret extends ModuleBaseModel {
    public interactionMessage: Message|undefined;
    public users: User[];
    public content: string;
    public voteTimeMs: number;
    public votes: number[];     // -1, 0, 1, 2  | no, not-ready, yes, abstained
    public messages: Message[] = [];
    public isAbstained: boolean;

    public constructor(
        interaction: CommandInteraction,
        content: string,
        users: User[],
        voteTimeMs: number,
        isAbstained: boolean
    ) {
        super(interaction);
        this.users = users;
        this.content = content;
        this.voteTimeMs = voteTimeMs;
        this.votes = new Array<number>(this.users.length).fill(0);
        this.isAbstained = isAbstained;
    }
}
