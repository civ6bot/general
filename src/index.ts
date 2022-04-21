import {client} from "./connection/client";
import {importx} from "@discordx/importer";
import * as dotenv from "dotenv";

importx(
    __dirname + "/bot/*/*.commands.{js,ts}",
    __dirname + "/bot/*/buttons/*.buttons.resolver.{js,ts}",
);

dotenv.config();

client.login(process.env.BOT_TOKEN as string);
