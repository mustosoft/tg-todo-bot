const joi = require('joi');
const { BigIntValidator } = require('./common');
const { OWNER_RE, OID_RE } = require('../consts/var');

/**
 * Validate the message peer
 * @function
 * @param {import('telegram').Api.Message} msg Telegram message
 * @returns {boolean} Whether the message is a list message
 */
const messageIsList = (msg) => msg
    && msg.rawText
    && msg.replyMarkup?.rows?.every?.((row, i, rows) => (i < rows.length - 2
        && row.buttons?.[0]?.data.toString().match(/^li:\d+$/)
        && row.buttons?.[1]?.data.toString().match(/^edit(ing)?:li:\d+$/))
        || (i === rows.length - 2
            && row.buttons?.[0]?.data.toString().match(/^checkAll$/)
            && row.buttons?.[1]?.data.toString().match(/^uncheckAll$/)
        ) || (i === rows.length - 1
            && row.buttons?.[0]?.data.toString().match(/^cancelEdit(?::replyToId-(\d+))?$/)
            && row.buttons?.[1]?.data.toString().match(RegExp(`^(?:un)?save:(?:(${OWNER_RE})|(${OID_RE}))?$`))));

module.exports = {
    messageIsList,
    messagePeer: joi.object({
        userId: BigIntValidator,
        chatId: BigIntValidator,
        channelId: BigIntValidator,
        className: joi.string().required(),
    }).min(2)
        .options({ stripUnknown: true }),
};
