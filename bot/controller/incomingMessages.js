/**
 * @typedef {import('telegram/events').NewMessageEvent} NewMessageEvent
 * @typedef {Array<[RegExp, (event: NewMessageEvent) => Promise<void>]>} PatternHandlers
 */

// List of pair of regex and function to handle incoming messages
/**
 * @type {PatternHandlers}
 */
module.exports = [
    [
        /^\/start$/,
        async (event) => {
            await event.message.reply({ message: 'Hello, World!' });
        },
    ],
];
