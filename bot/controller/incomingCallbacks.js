/**
 * @typedef {import('telegram/events/CallbackQuery').CallbackQueryEvent} CallbackQueryEvent
 * @typedef {Array<[RegExp, (event: CallbackQueryEvent) => Promise<void>]>} PatternHandlers
*/

const {
    Api: {
        KeyboardButtonCallback,
        ReplyKeyboardForceReply,
    },
} = require('telegram/tl/api');

const { ObjectId } = require('mongodb');
const {
    C, U, P, X, E, D, S, Y,
} = require('../consts/char');
const { OID_RE, OWNER_RE } = require('../consts/var');

const { Transactor } = require('../services/_trx');
const MessageService = require('../services/messages');
const ListService = require('../services/lists');
const ListMessageService = require('../services/listmessages');
const { List } = require('../value/list');
const {
    updateMessageFromList, syncAllList, getTypeOfPeer, getIdOfPeer, saveMessage,
} = require('../util/message');

const rU = RegExp(`^${U}`);
const rC = RegExp(`^${C}`);

// List of pair of regex and function to handle incoming messages
/**
 * @type {PatternHandlers}
 */
module.exports = [
    [
        /^delete-help$/,
        async function handleDeleteHelp(event) {
            const msg = await event.getMessage();
            await msg.delete({ revoked: true });
        },
    ],
    [
        /^(un)?checkAll$/,
        async function handleCheckUncheckAll(event) {
            const msg = await event.getMessage();
            const checkAll = event.data.toString() === 'checkAll';

            let edited = false;

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];

            for (let i = 0; i < rows.length; i += 1) {
                if (rows[i].buttons[0].data.toString().match(/^li:\d+$/)) {
                    edited = edited
                        || (checkAll && rows[i].buttons[0].text.match(rU))
                        || (!checkAll && rows[i].buttons[0].text.match(rC));

                    rows[i].buttons[0].text = checkAll
                        ? rows[i].buttons[0].text.replace(/^./, C)
                        : rows[i].buttons[0].text.replace(/^./, U);
                }
            }

            if (!edited) {
                event.answer({
                    message: `All items already ${checkAll ? 'checked!' : 'unchecked!'}`,
                    alert: true,
                });

                return;
            }

            const [, saveUnsaveButton] = rows[rows.length - 1].buttons;
            const isSaved = saveUnsaveButton.data.toString()
                .match(RegExp(`^(cancel-)?unsave:(?<listId>${OID_RE})`));

            if (isSaved) {
                const { listId } = isSaved.groups;
                const { client } = event;

                await syncAllList(client, msg, listId);
            }

            await msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });
        },
    ],
    [
        /^startEdit$/,
        async function handleStartEdit(event) {
            const msg = await event.getMessage();

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];

            for (let i = 0; i < rows.length; i += 1) {
                const row = rows[i];
                const [listButton] = row.buttons;

                // If it's a list item
                if (listButton.data.toString().match(/^li:\d+$/)) {
                    row.buttons[1] = new KeyboardButtonCallback({
                        text: `${P}`,
                        data: Buffer.from(`edit:li:${i}`),
                        resize: true,
                    });
                }

                if (i === rows.length - 1) {
                    const [editButton] = row.buttons;
                    const cancelEditButton = editButton;

                    cancelEditButton.text = `${X} Cancel`;
                    cancelEditButton.data = Buffer.from('cancelEdit');
                }
            }

            await msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });
        },
    ],
    [
        /^cancelEdit(?::replyToId-(\d+))?$/,
        async function handleCancelEdit(event) {
            const msg = await event.getMessage();

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];
            const replyToId = parseInt(event.patternMatch[1], 10);

            for (let i = 0; i < rows.length; i += 1) {
                const row = rows[i];
                const [listButton] = row.buttons;

                // If it's a list item
                if (listButton.data.toString().match(/^li:\d+$/)) {
                    row.buttons = [listButton];
                }
            }

            const [cancelEditButton] = rows[rows.length - 1].buttons;
            const editButton = cancelEditButton;

            editButton.text = `${P} Edit`;
            editButton.data = Buffer.from('startEdit');

            await msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });

            if (replyToId) {
                await msg.client.deleteMessages(msg.chatId, [replyToId], { revoke: true });
            }
        },
    ],
    [
        /^editing:li:\d+$/,
        async function handleEditing(event) {
            await event.answer({ message: 'Editing mode is active' });
        },
    ],
    [
        /^edit:li:(?<index>\d+)$/,
        async function handleEditItem(event) {
            const msg = await event.getMessage();
            const editIndex = Number(event.patternMatch.groups.index);

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];

            for (let i = 0; i < rows.length; i += 1) {
                const row = rows[i];
                const [, editButton] = row.buttons;

                if (i !== editIndex && editButton.data.toString().startsWith('editing:li:')) {
                    return event.answer({
                        message: 'Finish or cancel editing current item first!',
                        alert: true,
                    });
                }

                if (i === editIndex) {
                    editButton.text = `${E}`;
                    editButton.data = Buffer.from(`editing:li:${i}`);
                }
            }

            // const replyTo = await event.respond({
            const replyTo = await event.client.sendMessage(event.chatId, {
                message: 'Reply to this to edit list item!\n'
                    + 'Type `/cancel_edit` or press Cancel button on the list to cancel edit.',
                replyTo: msg.id,
                buttons: new ReplyKeyboardForceReply({
                    placeholder: 'Type new item name ...',
                    singleUse: false,
                }),
            });

            const [cancelEditButton] = rows[rows.length - 1].buttons;
            cancelEditButton.data = Buffer.from(`cancelEdit:replyToId-${replyTo.id}`);

            return msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });
        },
    ],
    [
        RegExp(`^(?:(?:(?:confirm|cancel)-)?un)?save:(?:(?<owner>${OWNER_RE})|(?<rmListId>${OID_RE}))$`),
        async function handleSaveOperations(event) {
            const cmd = event.data.toString();

            const save = cmd.startsWith('save');
            const unsave = cmd.startsWith('unsave:');
            const confirmUnsave = cmd.startsWith('confirm-unsave:');
            const cancelUnsave = cmd.startsWith('cancel-unsave:');

            const msg = await event.getMessage();
            const { rmListId } = event.patternMatch.groups;

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];

            const [editButton, saveUnsaveButton] = rows[rows.length - 1].buttons;

            if (save) {
                const { id, peerId: peer } = msg;

                const savedListId = await Transactor.withTransaction(async (session) => {
                    const message = await MessageService.getByIdAndPeer(id, peer, session);
                    const list = await ListService.create(
                        List.fromChatMessage(msg),
                        session,
                    );

                    const { _id: listId } = list;
                    const { _id: msgId } = message;

                    await ListMessageService.upsert(
                        listId.toString(),
                        msgId.toString(),
                        session,
                    );

                    return listId.toString();
                });

                await event.answer({
                    message: 'List has been saved!',
                });

                saveUnsaveButton.text = `${D} Unsave`;
                saveUnsaveButton.data = Buffer.from(`unsave:${savedListId}`);
            } else if (unsave) {
                const [confirm, cancel] = [editButton, saveUnsaveButton];

                if (editButton.data.toString().startsWith('cancelEdit')) {
                    return event.answer({
                        message: 'Finish or cancel editing current item first!',
                        alert: true,
                    });
                }

                await event.answer({
                    alert: true,
                    message:
                        'This will remove the list from your saved list'
                        + ' and the message list will be unlinked. Continue?',
                });

                cancel.text = `${X} No, keep the list`;
                cancel.data = Buffer.from(`cancel-unsave:${rmListId}`);

                confirm.text = `${Y} Delete saved list`;
                confirm.data = Buffer.from(`confirm-unsave:${rmListId}`);
            } else if (cancelUnsave) {
                saveUnsaveButton.text = `${D} Unsave`;
                saveUnsaveButton.data = Buffer.from(`unsave:${rmListId}`);

                editButton.text = `${P} Edit`;
                editButton.data = Buffer.from('startEdit');
            } else if (confirmUnsave) {
                const deletedList = await Transactor.withTransaction(async (session) => {
                    const list = await ListService.deleteOne(
                        { _id: new ObjectId(`${rmListId}`) },
                        session,
                    );
                    await ListMessageService.delete(`${rmListId}`, null, session);

                    return list;
                });

                let ownerType = deletedList?.owner?.ownerType;
                let ownerId = deletedList?.owner?.ownerId;

                if (!ownerType || !ownerId) {
                    ownerType = getTypeOfPeer(msg.peerId);
                    ownerId = getIdOfPeer(msg.peerId);
                }

                await event.answer({
                    alert: true,
                    message:
                        'List has been removed from your saved list and'
                        + ' the message list has been unlinked.',
                });

                saveUnsaveButton.text = `${S} Save`;
                saveUnsaveButton.data = Buffer.from(`save:${ownerType}Id:${ownerId}`);

                editButton.text = `${P} Edit`;
                editButton.data = Buffer.from('startEdit');
            }

            return msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });
        },
    ],
    [
        RegExp(`^saved-list:(?<id>${OID_RE})$`),
        async function handleSavedList(event) {
            const { id: listId } = event.patternMatch.groups;
            let msg = await event.getMessage();

            const list = List.from(await ListService.getOne({ _id: new ObjectId(`${listId}`) }));

            msg = await updateMessageFromList(msg, list);

            await saveMessage(msg);

            // Bind this message to the list
            await Transactor.withTransaction(async (session) => {
                const { id, peerId: peer } = msg;
                const message = await MessageService.getByIdAndPeer(id, peer, session);

                const { _id: msgId } = message;

                await ListMessageService.upsert(
                    listId.toString(),
                    msgId.toString(),
                    session,
                );
            });
        },
    ],
    [
        /^li:(?<i>\d+)$/,
        async function handleToggleItem(event) {
            const msg = await event.getMessage();

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];

            const i = Number(event.patternMatch.groups.i);

            const cReg = RegExp(`^${C}`);
            const uReg = RegExp(`^${U}`);

            const [itemButton] = rows[i].buttons;

            const checked = itemButton.text.match(cReg);
            const unchecked = itemButton.text.match(uReg);

            if (!checked && !unchecked) return;

            if (unchecked) {
                itemButton.text = itemButton.text.replace(uReg, C);
            }

            if (checked) {
                itemButton.text = itemButton.text.replace(cReg, U);
            }

            const [, saveUnsaveButton] = rows[rows.length - 1].buttons;
            const isSaved = saveUnsaveButton.data.toString()
                .match(RegExp(`^(cancel-)?unsave:(?<listId>${OID_RE})`));

            if (isSaved) {
                const { listId } = isSaved.groups;
                const { client } = event;

                await syncAllList(client, msg, listId);
            }

            await msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });
        },
    ],
];
