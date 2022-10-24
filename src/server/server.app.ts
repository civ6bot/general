import express, {Express} from 'express';
import {routerSteam} from "./routers/router.steam";

export const httpServer: Express = express()
    .use(express.json())
    .use('/steam', routerSteam);
