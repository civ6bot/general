import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class EntityInvite {
    @PrimaryColumn()
    guildID!: string;

    @Column({type: "text"})
    link!: string;
}
