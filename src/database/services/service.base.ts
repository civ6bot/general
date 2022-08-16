import {dataSource} from "../database.datasource";
import {EntityManager} from "typeorm";

export class DatabaseServiceBase {
    protected database: EntityManager = dataSource.manager;
    constructor() {}
}
