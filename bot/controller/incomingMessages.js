/**
 * @typedef {import('telegram/events').NewMessageEvent} NewMessageEvent
 * @typedef {Array<[RegExp, (event: NewMessageEvent) => Promise<void>]>} PatternHandlers
 */

const { Api: { KeyboardButtonCallback } } = require('telegram/tl/api');
const { StopPropagation } = require('telegram/client/updates');

const { C, U, P } = require('../consts/char');
const MessageService = require('../services/messages');
const logger = require('../logger');
const { trimEmptyLines, removeNewLines } = require('../util/strings');

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
    [ // Handler for edit list item
        /.+/,
        async (event) => {
            const replyTo = await event.message.getReplyMessage();
            if (!replyTo) return;

            const listMsg = await replyTo.getReplyMessage();
            if (!listMsg) return;

            // Validate if the message is a list
            const msgIsList = listMsg
                && listMsg.rawText
                && listMsg.replyMarkup?.rows?.every?.((row, i, rows) => (i !== rows.length - 1
                    && row.buttons?.[0]?.data.toString().match(/^li:\d+$/)
                    && row.buttons?.[1]?.data.toString().match(/^edit(ing)?:li:\d+$/))
                    || (i === rows.length - 1
                        && row.buttons?.[0]?.data.toString().match(/^checkAll$/)
                        && row.buttons?.[1]?.data.toString().match(/^cancelEdit(?::replyToId-(\d+))?$/)
                        && row.buttons?.[2]?.data.toString().match(/^uncheckAll$/)
                    ));

            if (!msgIsList) return;

            const { rows } = listMsg.replyMarkup;
            const text = removeNewLines(event.message.rawText).trim();

            for (let i = 0; i < rows.length; i += 1) {
                const row = rows[i];
                const [listButton, editItemButton] = row.buttons;

                // If it's a list item
                if (listButton.data.toString().match(/^li:\d+$/)) {
                    if (text === '/cancel_edit') {
                        row.buttons = [listButton];
                    } else if (editItemButton?.data.toString().match(/^editing:li:\d+$/)) {
                        listButton.text = listButton.text.replace(/(^..)(?:.*$)/, `$1${text}`);
                        row.buttons = [listButton];
                    } else {
                        row.buttons = [listButton];
                    }
                }

                // Footer buttons
                if (i === rows.length - 1) {
                    const [, cancelEditButton] = row.buttons;
                    const editButton = cancelEditButton;

                    editButton.text = `${P} Edit`;
                    editButton.data = Buffer.from('startEdit');
                }
            }

            await listMsg.edit({
                formattingEntities: listMsg.entities,
                text: listMsg.rawText,
            });
            await event.message.delete({ revoke: true });
            await replyTo.delete({ revoke: true });

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
                        text: `${P} Edit`,
                        data: Buffer.from('startEdit'),
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
