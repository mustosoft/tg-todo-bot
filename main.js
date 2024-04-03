require('dotenv').config();

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const { loadSession, saveSession } = require('./bot/session');
const { handleEvents } = require('./bot/controller');
const { sendBotStartedNotification } = require('./bot/controller/adminNotification');
const db = require('./bot/db.mongo');

const logger = require('./bot/logger');

const stringSession = loadSession();
const API_ID = Number(process.env.API_ID);
const { API_HASH, TOKEN } = process.env;

(async () => {
    await db.connect()
        .then(() => logger.info('Connected to MongoDB'))
        .catch((err) => logger.error('Failed to connect to MongoDB', err));

    const client = new TelegramClient(
        new StringSession(stringSession),
        API_ID,
        API_HASH,
    );

    await client.start({
        botAuthToken: TOKEN,
    });

    handleEvents(client);
    await sendBotStartedNotification(client).catch((err) => logger.error(err));

    saveSession(client.session.save());
})();
