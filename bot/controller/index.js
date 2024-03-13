const { NewMessage } = require('telegram/events');

const INCOMING_MESSAGES = require('./incomingMessages');
const logger = require('../logger');

function wrapHandler(handler) {
    return async (event) => {
        try {
            await handler(event);
        } catch (error) {
            logger.error(error);
        }
    };
}

/**
 * Handle messages
 * @param {import('telegram').TelegramClient} client Telegram client
 */
function handleMessages(client) {
    // Register all incoming messages handlers
    INCOMING_MESSAGES.forEach(([pattern, handler]) => {
        client.addEventHandler(
            wrapHandler(handler),
            new NewMessage({
                incoming: true,
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
}

module.exports = {
    handleEvents,
};
