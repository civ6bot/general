import {Column, Entity, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class EntityRulePage {
    @PrimaryColumn()
    guildID!: string;

    @PrimaryGeneratedColumn("uuid")
    uuid!: string;

    @Column()
    pageNumber!: number;

    @Column({type: "text", charset: "utf8mb4"})
    title!: string;

    @Column({type: "text", charset: "utf8mb4"})
    description!: string;

    @Column({type: "text", charset: "utf8mb4"})
    tags!: string;
}
