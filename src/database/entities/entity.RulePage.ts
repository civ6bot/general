import {Column, Entity, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class EntityRulePage {
    @PrimaryColumn()
    guildID!: string;

    @PrimaryGeneratedColumn("uuid")
    uuid!: string;

    @Column()
    pageNumber!: number;

    @Column({type: "text"})
    title!: string;

    @Column({type: "text"})
    description!: string;

    @Column({type: "text"})
    tags!: string;
}
