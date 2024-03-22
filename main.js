require('dotenv').config();

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const { loadSession, saveSession } = require('./bot/session');
const { handleEvents } = require('./bot/controller');
const { sendBotStartedNotification } = require('./bot/controller/adminNotification');

const logger = require('./bot/logger');

const stringSession = loadSession();
const API_ID = Number(process.env.API_ID);
const { API_HASH, TOKEN } = process.env;

(async () => {
    const client = new TelegramClient(
        new StringSession(stringSession),
        API_ID,
        API_HASH,
    );

    await client.start({
        botAuthToken: TOKEN,
    });

    handleEvents(client);
    sendBotStartedNotification(client).catch((err) => logger.error(err));

    saveSession(client.session.save());
})();
