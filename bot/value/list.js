/**
 * @typedef ListItem
 * @property {string} state
 * @property {string} text
 *
 * @typedef Owner
 * @property {string} ownerType
 * @property {number} ownerId
 *
 * @typedef List
 * @property {import('mongodb').ObjectId} id
 * @property {Owner} owner
 * @property {string} name
 * @property {ListItem[]} items
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const { C } = require('../consts/char');
const { ITEM_STATES: { CHECKED, UNCHECKED } } = require('../consts/list');
const { OWNER_RE, OID_RE } = require('../consts/var');

/**
 * Creates a new todo-list
 * @class List
 */
class List {
    /**
     * Create a new list from an object
     * @param {List} props
     * @returns {List}
     */
    static from({
        _id, id, owner, name, items, createdAt, updatedAt,
    }) {
        return new List(id ?? _id, owner, name, items, createdAt, updatedAt);
    }

    /**
     * Build a list from a telegram chat message
     * @param {import('telegram/tl/api').Api.Message} chatMessage Telegram message
     * @returns {List}
     */
    static fromChatMessage(chatMessage) {
        const { name } = chatMessage.rawText.match(/(?<name>.*):$/).groups;
        const items = [];

        if (!chatMessage.replyMarkup?.rows) throw new Error('Invalid message shape');

        const { rows } = chatMessage.replyMarkup;

        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            const [listButton] = row.buttons;

            if (listButton.data.toString().match(/^li:\d+$/)) {
                const state = listButton.text.startsWith(C) ? CHECKED : UNCHECKED;
                const { text } = listButton.text.match(/^..(?<text>.*)$/).groups;

                items.push({
                    state,
                    text,
                });
            }
        }

        const [, saveUnsaveButton] = rows[rows.length - 1].buttons;
        const owner = saveUnsaveButton
            .data
            .toString()
            .match(RegExp(`^save:${OWNER_RE}`))
            ?.groups;

        const id = saveUnsaveButton
            .data
            .toString()
            .match(RegExp(`^(cancel-)?unsave:(?<listId>${OID_RE})`))
            ?.groups?.listId;

        return new List(
            id || null,
            owner && {
                ownerType: owner.ownerType,
                ownerId: Number(owner.ownerId),
            },
            name,
            items,
        );
    }

    /**
     * Create a new list
     * @param {import('mongodb').ObjectId} id
     * @param {Owner} owner
     * @param {string} name
     * @param {ListItem[]} items
     * @param {Date} createdAt
     * @param {Date} updatedAt
     * @returns {List}
     */
    constructor(id, owner, name, items, createdAt, updatedAt) {
        this.id = id;
        this.owner = owner;
        this.name = name;
        this.items = items;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }
}

module.exports = {
    List,
};
