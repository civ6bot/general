import { DataSource } from "typeorm"

export const dataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../../database.sqlite",
    entities: [ __dirname + "/entities/entity.*.{js,ts}" ],
    logging: false,
    synchronize: true
});
