/**
 * @typedef {import('telegram/events').NewMessageEvent} NewMessageEvent
 * @typedef {Array<[RegExp, (event: NewMessageEvent) => Promise<void>]>} PatternHandlers
 */

const { Api: { KeyboardButtonCallback } } = require('telegram/tl/api');
const { C, U } = require('../consts/char');
const MessageService = require('../services/messages');
const logger = require('../logger');

// List of pair of regex and function to handle incoming messages
/**
 * @type {PatternHandlers}
 */
module.exports = [
    [
        /.*/,
        async (event) => {
            await MessageService
                .create(event.message)
                .then((saved) => logger.debug('Message saved:', saved));
        },
    ],
    [
        /^\/start$/,
        async (event) => {
            await event.message.respond({
                message:
                    'Welcome to the Todo-Check bot! You can start creating your list by sending me'
                    + ' a list of items separated by a new line, just like the example below:\n\n'
                    + 'Complete project report\n'
                    + 'Attend team meeting at 2 PM\n'
                    + 'Send updated email to clients\n'
                    + '\n\n'
                    + '**Try it now!**',
            });
        },
    ],
    [
        /^\/about$/,
        async (event) => {
            await event.message.reply({
                parseMode: 'html',
                message:
                'This bot was created by <a href="tg://user?id=147948549">Mustosoft</a>\n\n'
                + '🌐 <a href="https://mustosoft.dev/">Dev</a>',
            });
        },
    ],
    [
        /^(?!\/(?:start|about)$).+/,
        async (event) => {
            if (!event.message?.text) return;

            await event.message.reply({
                message: 'Your list:',
                buttons: event.message.text.split('\n').map((item, i) => [
                    new KeyboardButtonCallback({
                        text: `${U} ${item.trimStart().trimEnd()}`,
                        data: Buffer.from(`li:${i}`),
                    }),
                ]).concat([[
                    new KeyboardButtonCallback({
                        text: `${C} Check all`,
                        data: Buffer.from('checkAll'),
                    }),
                    new KeyboardButtonCallback({
                        text: `${U} Uncheck all`,
                        data: Buffer.from('uncheckAll'),
                    }),
                ]]),
            });
        },
    ],
];
