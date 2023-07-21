import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class EntityInvite {
    @PrimaryColumn()
    guildID!: string;

    @Column({type: "text", charset: "utf8mb4"})
    link!: string;
}
