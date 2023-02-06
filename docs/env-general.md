# Configuration of Dotenv file for Civ6Bot

Template for `general.env` is described below.
```dotenv
TEST_MODE=
TEST_BOT_TOKEN=
BOT_TOKEN=

OAUTH2_BOT_CLIENT_ID=
OAUTH2_BOT_SECRET=
OAUTH2_REDIRECT_LINK=
OAUTH2_REDIRECT_URI_FOR_TOKEN=

STEAM_KEY=

DATABASE_HOSTNAME=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=

SERVER_HTTP_PORT=
```

1. `TEST_MODE`: test mode switch. set 1 for test mode or 0 for release mode.
2. `TEST_BOT_TOKEN`: Discord token for test bot (in test mode).
3. `BOT_TOKEN`: Discord token for live bot (release mode).
- You can find additional info about Discord bot tokens [here](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token).
4. `OAUTH2_BOT_CLIENT_ID`: 
5. `OAUTH2_BOT_SECRET`: 
6. `OAUTH2_REDIRECT_LINK`: 
7. `OAUTH2_REDIRECT_URI_FOR_TOKEN`: 
- You can find additional info about Discord OAuth2 [here](https://discordjs.guide/oauth2/#setting-up-a-basic-web-server).
8. `STEAM_KEY`: key for Steam WebAPI.
- You can find additional info about Steam Web API [here](https://steamcommunity.com/dev).
9. `DATABASE_HOSTNAME`: IP Address of outer database.
10. `DATABASE_PORT`: port of outer database.
11. `DATABASE_USER`: username for connection to outer database.
12. `DATABASE_PASSWORD` password for connection to outer database.
13. `DATABASE_NAME`: outer database name.
- Outer database is running on [MySQL](https://www.mysql.com/).
14. `SERVER_HTTP_PORT`: Express server port.
