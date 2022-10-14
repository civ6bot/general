import {Entity, PrimaryColumn, Column} from "typeorm"

@Entity()
export class EntityUserSteam {
    @PrimaryColumn()
    discordID!: string

    @Column()
    steamID!: string
}
