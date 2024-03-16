/**
 * @typedef {import('telegram/events/CallbackQuery').CallbackQueryEvent} CallbackQueryEvent
 * @typedef {Array<[RegExp, (event: CallbackQueryEvent) => Promise<void>]>} PatternHandlers
*/

const { C, U } = require('../consts/char');

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

            /**
             * @type {import('telegram/tl/api').Api.TypeKeyboardButtonRow[]}
             */
            const rows = msg.replyMarkup?.rows || [];

            for (let i = 0; i < rows.length; i += 1) {
                if (rows[i].buttons[0].data.toString().match(/^li:\d+$/)) {
                    rows[i].buttons[0].text = checkAll
                        ? rows[i].buttons[0].text.replace(/^./, C)
                        : rows[i].buttons[0].text.replace(/^./, U);
                }
            }

            await msg.edit({
                text: msg.text,
            });
        },
    ],
    [
        /^li:\d/,
        async (event) => {
            const msg = await event.getMessage();
            const rows = [...(msg.replyMarkup?.rows || [])];

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
                text: msg.text,
            });
        },
    ],
];
