require('dotenv').config();

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const { loadSession, saveSession } = require('./bot/session.js');
const { handleEvents } = require('./bot/controller');

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

    saveSession(client.session.save());
})();
