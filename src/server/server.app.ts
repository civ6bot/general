import express, {Express} from 'express';
import https from 'https';
import {routerSteam} from "./routers/router.steam";

const app: Express = express()
    .use(express.json())
    .use('/steam', routerSteam);

export const httpsServer = https.createServer({
    key: process.env.SSL_PRIVATE_KEY,
    cert: process.env.SSL_CERIFICATE
}, app);
