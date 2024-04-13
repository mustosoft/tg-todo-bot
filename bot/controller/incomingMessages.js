/**
 * @typedef {import('telegram/events').NewMessageEvent} NewMessageEvent
 * @typedef {Array<[RegExp, (event: NewMessageEvent) => Promise<void>]>} PatternHandlers
 */

const { Api } = require('telegram/tl/api');

const { KeyboardButtonCallback } = Api;
const { StopPropagation } = require('telegram/client/updates');

const {
    C, U, P, S,
} = require('../consts/char');
const MessageService = require('../services/messages');
const ListService = require('../services/lists');
const logger = require('../logger');
const { trimEmptyLines, removeNewLines } = require('../util/strings');
const { OID_RE } = require('../consts/var');
const {
    getPeerIdFieldName,
    getIdOfPeer,
    getTypeOfPeer,
    syncAllList,
    saveMessage,
} = require('../util/message');
const { messageIsList } = require('../validators/message');
const { START, ABOUT, HELP } = require('../consts/cmd');

/**
 * List of pair of regex and function to handle incoming messages
 * @type {PatternHandlers}
 */
module.exports = [
    [
        /.*/,
        async function handleSaveIncoming(event) {
            await MessageService
                .create(event.message)
                .then((saved) => logger.debug('Message saved:', saved));
        },
    ],
    [
        /^\/start$/,
        async function handleStart(event) {
            await event.message.respond(START);
            throw new StopPropagation();
        },
    ],
    [
        /^\/about$/,
        async function handleAbout(event) {
            await event.message.reply(ABOUT);
            throw new StopPropagation();
        },
    ],
    [
        /^\/help$/,
        async function handleHelp(event) {
            await event.message.reply(HELP);
            throw new StopPropagation();
        },
    ],
    [
        /^\/mylist$/,
        async function handleMylist(event) {
            const owner = event.message.fromId || event.message.peerId;
            const ownerType = getTypeOfPeer(owner);
            const ownerId = getIdOfPeer(owner);

            const query = {
                'owner.ownerType': ownerType,
                'owner.ownerId': Number(ownerId),
            };

            const lists = await ListService.getMany(query);

            await event.message.reply({
                parseMode: 'html',
                message: '<b>Your saved lists</b>:',
                buttons: lists.length ? lists.map((list) => {
                    const { _id: id, name } = list;

                    return [
                        new KeyboardButtonCallback({
                            text: name,
                            data: Buffer.from(`saved-list:${id}`),
                        }),
                    ];
                }) : null,
            });

            throw new StopPropagation();
        },
    ],
    [ // Handler for edit list item
        /.+/,
        async function handleEditItem(event) {
            const replyTo = await event.message.getReplyMessage();
            if (!replyTo) return;

            const listMsg = await replyTo.getReplyMessage();
            if (!listMsg) return;

            // Validate if the message is a list
            if (!messageIsList(listMsg)) return;

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
            }

            // Footer buttons
            const [cancelEditButton, saveUnsaveButton] = rows[rows.length - 1].buttons;
            const editButton = cancelEditButton;

            editButton.text = `${P} Edit`;
            editButton.data = Buffer.from('startEdit');

            const isSaved = saveUnsaveButton.data.toString().match(RegExp(`^unsave:(?<listId>${OID_RE})`));

            // Also update all list messages if the list is saved
            if (isSaved) {
                const { listId } = isSaved.groups;
                const { client } = event;

                await syncAllList(client, listMsg, listId);
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
        async function handleNewList(event) {
            if (!event.message?.text) return;

            let text = trimEmptyLines(event.message.rawText);

            const title = text.match(/^#[^\S\n]*(.*?)\s*?$/m)?.[1];
            if (title) {
                text = text.split('\n').slice(1).join('\n');
            }

            if (!text) return;

            const ownerPeer = event.message.fromId || event.message.peerId;
            const owner = `${getPeerIdFieldName(ownerPeer)}:${getIdOfPeer(ownerPeer).toString()}`;

            const listMsg = await event.message.reply({
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
                ], [
                    new KeyboardButtonCallback({
                        text: `${P} Edit`,
                        data: Buffer.from('startEdit'),
                    }),
                    new KeyboardButtonCallback({
                        requiresPassword: true,
                        text: `${S} Save`,
                        data: Buffer.from(`save:${owner}`),
                    }),
                ]]),
            });

            await saveMessage(listMsg);
        },
    ],
];
