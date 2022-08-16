import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity()
export class EntityText {
    @PrimaryColumn()
    tag!: string;

    @PrimaryColumn()
    lang!: string;

    @Column()
    value!: string;
}
