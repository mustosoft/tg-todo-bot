const { NewMessage } = require('telegram/events');
const { CallbackQuery } = require('telegram/events/CallbackQuery');

const INCOMING_MESSAGES = require('./incomingMessages');
const INCOMING_CALLBACKS = require('./incomingCallbacks');
const wrap = require('../wrapper');

/**
 * Handle messages
 * @param {import('telegram').TelegramClient} client Telegram client
 */
function handleMessages(client) {
    // Register all incoming messages handlers
    INCOMING_MESSAGES.forEach(([pattern, handler]) => {
        client.addEventHandler(
            wrap(handler),
            new NewMessage({
                incoming: true,
                pattern,
            }),
        );
    });
}

/**
 * Handle callbacks
 * @param {import('telegram').TelegramClient} client Telegram client
 */
function handleCallbacks(client) {
    // Register all incoming callback events handlers
    INCOMING_CALLBACKS.forEach(([pattern, handler]) => {
        client.addEventHandler(
            wrap(handler),
            new CallbackQuery({
                pattern,
            }),
        );
    });
}

/**
 * Handle events
 * @param {import('telegram').TelegramClient} client Telegram client
 */
function handleEvents(client) {
    handleMessages(client);
    handleCallbacks(client);
}

module.exports = {
    handleEvents,
};
