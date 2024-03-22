/**
 * @typedef {import('telegram/events/CallbackQuery').CallbackQueryEvent} CallbackQueryEvent
 * @typedef {Array<[RegExp, (event: CallbackQueryEvent) => Promise<void>]>} PatternHandlers
*/

const { Api: { KeyboardButtonCallback, ReplyKeyboardForceReply } } = require('telegram/tl/api');

const {
    C, U, P, X, E,
} = require('../consts/char');

const rU = RegExp(`^${U}`);
const rC = RegExp(`^${C}`);

// List of pair of regex and function to handle incoming messages
/**
 * @type {PatternHandlers}
 */
module.exports = [
    [
        /^(un)?checkAll$/,
        async (event) => {
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

            await msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });
        },
    ],
    [
        /^startEdit$/,
        async (event) => {
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
                    const cancelEditButton = row.buttons[1];

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
        async (event) => {
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

                if (i === rows.length - 1) {
                    const [, cancelEditButton] = row.buttons;
                    const editButton = cancelEditButton;

                    editButton.text = `${P} Edit`;
                    editButton.data = Buffer.from('startEdit');
                }
            }

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
        async (event) => {
            await event.answer({ message: 'Editing mode is active' });
        },
    ],
    [
        /^edit:li:\d+$/,
        async (event) => {
            const msg = await event.getMessage();

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];

            for (let i = 0; i < rows.length; i += 1) {
                const row = rows[i];
                const [, editButton] = row.buttons;
                const editIndex = parseInt(event.data.toString().split(':')[2], 10);

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

            const cancelEditButton = rows[rows.length - 1].buttons[1];
            cancelEditButton.data = Buffer.from(`cancelEdit:replyToId-${replyTo.id}`);

            return msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });
        },
    ],
    [
        /^li:\d+$/,
        async (event) => {
            const msg = await event.getMessage();

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];

            const i = parseInt(event.data.toString().split(':')[1], 10);

            const cReg = RegExp(`^${C}`);
            const uReg = RegExp(`^${U}`);

            const checked = rows[i].buttons[0].text[0].match(cReg);
            const unchecked = rows[i].buttons[0].text[0].match(uReg);

            if (unchecked) {
                rows[i].buttons[0].text = rows[i].buttons[0].text.replace(uReg, C);
            }

            if (checked) {
                rows[i].buttons[0].text = rows[i].buttons[0].text.replace(cReg, U);
            }

            if (!checked && !unchecked) return;

            await msg.edit({
                formattingEntities: msg.entities,
                text: msg.rawText,
            });
        },
    ],
];
