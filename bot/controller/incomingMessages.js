/**
 * @typedef {import('telegram/events').NewMessageEvent} NewMessageEvent
 * @typedef {Array<[RegExp, (event: NewMessageEvent) => Promise<void>]>} PatternHandlers
 */

const { Api: { KeyboardButtonCallback } } = require('telegram/tl/api');
const { StopPropagation } = require('telegram/client/updates');

const { C, U } = require('../consts/char');
const MessageService = require('../services/messages');
const logger = require('../logger');
const { trimEmptyLines } = require('../util/strings');

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
                    + '**Complete project report**\n'
                    + '**Attend team meeting at 2 PM**\n'
                    + '**Send updated email to clients**\n'
                    + '\n\n'
                    + 'You can also use the hashtag (#) at the first line to give a title to your list, like this:\n\n'
                    + '**# My tasks**\n'
                    + '**Complete project report**\n'
                    + '**Attend team meeting at 2 PM**\n'
                    + '**Send updated email to clients**\n'
                    + '\n\n'
                    + '**Try it now!**',
            });

            throw new StopPropagation();
        },
    ],
    [
        /^\/about$/,
        async (event) => {
            await event.message.reply({
                parseMode: 'html',
                message:
                    'This bot is created by <a href="tg://user?id=147948549">Mustosoft</a>\n\n'
                    + '🌐 <a href="https://mustosoft.dev/">Dev</a>',
            });

            throw new StopPropagation();
        },
    ],
    [
        /.+/,
        async (event) => {
            if (!event.message?.text) return;

            let text = trimEmptyLines(event.message.rawText);

            const title = text.match(/^#[^\S\n]*(.*?)\s*?$/m)?.[1];
            if (title) {
                text = text.split('\n').slice(1).join('\n');
            }

            if (!text) return;

            await event.message.reply({
                parseMode: 'html',
                message: `<b>${title || 'Your list'}</b>:`,
                buttons: text.split('\n').map((item, i) => [
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
