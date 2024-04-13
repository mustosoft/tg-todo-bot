/* eslint-disable global-require */
/**
 * @typedef {import('big-integer').BigInteger | bigint} BigInt
 * @typedef {import('telegram/tl/api').Api.TypePeer} Peer
 * @typedef {'PeerUser' | 'PeerChannel' | 'PeerChat'} PeerClassName
 * @typedef {{className: PeerClassName, ['userId' | 'channelId'| 'chatId']: string}} PeerID
 */

const { Api } = require('telegram');
const {
    C, U, P, D,
} = require('../consts/char');

const { List } = require('../value/list');
const logger = require('../logger');
const { MAX_SYNCED_INSTANCES } = require('../consts/var');

/**
 * Get the ID of the peer
 * @param {Peer} peer Peer
 * @returns {BigInt} ID of the peer
 */
function getIdOfPeer(peer) {
    return peer.userId || peer.channelId || peer.chatId;
}

/**
 * Get the type of a peer
 * @param {Peer} peer Peer
 * @returns {'user' | 'channel' | 'chat'} Type of the peer
 */
function getTypeOfPeer(peer) {
    return (peer.className === 'PeerUser' && 'user')
        || (peer.className === 'PeerChannel' && 'channel')
        || 'chat';
}

/**
 * Get the field name of the peer ID
 * @param {Peer} peer Peer
 * @returns {string} Field name of the peer ID
 */
function getPeerIdFieldName(peer) {
    return (peer.userId && 'userId')
        || (peer.channelId && 'channelId')
        || 'chatId';
}

/**
 * Create a peer ID object
 * @param {'user' | 'userId' | 'channel' | 'channelId' | 'chat' | 'chatId'} type Type of the peer ID
 * @param {number} id ID of the peer
 * @returns {PeerID} Peer ID object
 */
function createPeerId(type, id) {
    const typeName = type.replace('Id', '');

    return {
        className: (typeName.includes('user') && 'User')
            || (typeName.includes('channel') && 'Channel')
            || 'Chat',
        [`${typeName}Id`]: id.toString(),
    };
}

/**
 * Update the message from a list
 * @param {import('telegram/tl/api').Api.Message} msg Message entity
 * @param {import('../value/list').List} list List entity
 * @returns {Promise<Api.Message>}
 */
async function updateMessageFromList(msg, list) {
    const { id } = list;

    const rows = [];

    list.items.forEach((item, i) => {
        const text = `${item.state === 'checked' ? C : U} ${item.text}`;
        const button = new Api.KeyboardButtonCallback({
            text,
            data: Buffer.from(`li:${i}`),
        });

        rows.push([button]);
    });

    rows.push([
        new Api.KeyboardButtonCallback({
            text: `${C} Check all`,
            data: Buffer.from('checkAll'),
        }),
        new Api.KeyboardButtonCallback({
            text: `${U} Uncheck all`,
            data: Buffer.from('uncheckAll'),
        }),
    ]);

    rows.push([
        new Api.KeyboardButtonCallback({
            text: `${P} Edit`,
            data: Buffer.from('startEdit'),
        }),
        new Api.KeyboardButtonCallback({
            requiresPassword: true,
            text: `${D} Unsave`,
            data: Buffer.from(`unsave:${id}`),
        }),
    ]);

    return msg.edit({
        formattingEntities: [new Api.MessageEntityBold({
            offset: 0,
            length: list.name.length,
        })],
        text: `${list.name}:`,
        buttons: rows,
    });
}

/**
 * Like updateMessageFromList, but preserves the original footer buttons
 * @param {import('telegram/tl/api').Api.Message} msg Message entity
 * @param {import('../value/list').List} list List entity
 * @returns {Promise<void>}
 */
async function patchMessageFromList(msg, list) {
    const rows = [];

    list.items.forEach((item, i) => {
        const text = `${item.state === 'checked' ? C : U} ${item.text}`;
        const button = new Api.KeyboardButtonCallback({
            text,
            data: Buffer.from(`li:${i}`),
        });

        rows.push([button]);
    });

    try {
        await msg.edit({
            formattingEntities: [new Api.MessageEntityBold({
                offset: 0,
                length: list.name.length,
            })],
            text: `${list.name}:`,
            buttons: [
                ...rows,
                ...msg.replyMarkup.rows.slice(-2).map((e) => e.buttons),
            ],
        });
    } catch (err) {
        if (err.errorMessage === 'MESSAGE_NOT_MODIFIED') return;

        throw err;
    }
}

/**
 * Get telegram messages by list ID
 * @param {string} listId List ID
 * @param {import('telegram').TelegramClient} client Telegram client
 * @returns {Promise<import('telegram/tl/api').Api.Message[]>} Messages
 */
async function getMessagesByListId(client, listId) {
    const MessageService = require('../services/messages');
    const messages = await MessageService.getByListId(listId, MAX_SYNCED_INSTANCES);

    if (!messages.length) return [];

    const peerIdsMap = messages.reduce((acc, cur) => {
        const peer = cur.peerId;
        const peerType = getTypeOfPeer(peer);
        const peerId = peer[`${peerType}Id`];
        const key = `${peerType}Id:${peerId}`;

        if (!acc[key]) acc[key] = [cur.id];
        else acc[key].push(cur.id);

        return acc;
    }, {});

    const chatMessages = await Promise.all(Object.entries(peerIdsMap).map(
        ([peer, ids]) => {
            const id = Number(peer.split(':')[1]);
            let entity;

            if (peer.startsWith('userId')) {
                entity = new Api.InputPeerUser({ userId: id });
            } else if (peer.startsWith('channelId')) {
                entity = new Api.InputPeerChannel({ channelId: id });
            } else {
                entity = new Api.InputPeerChat({ chatId: id });
            }

            return client.getMessages(entity, { ids });
        },
    ));

    return chatMessages.flatMap((m) => m).filter((m) => !!m);
}

/**
 * Sync all list messages
 * @param {import('telegram').Client} client Telegram client
 * @param {import('telegram/tl/api').Api.Message} srcMessage Source message
 * @param {string} listId List ID
 * @returns {Promise<void>}
 */
async function syncAllList(client, srcMessage, listId) {
    const ListService = require('../services/lists');

    const list = List.fromChatMessage(srcMessage);
    const chatMessages = await getMessagesByListId(client, listId);

    await ListService.updateFromList(list);

    await Promise.all(chatMessages.map(
        (chatMessage) => {
            const fieldName = `${getTypeOfPeer(chatMessage.peerId)}Id`;

            if (chatMessage.id === srcMessage.id
                && Number(chatMessage.peerId[fieldName])
                === Number(srcMessage.peerId[fieldName])) {
                return null;
            }

            return patchMessageFromList(chatMessage, list);
        },
    ));
}

/**
 * Save a message
 * @param {import('telegram/tl/api').Api.Message} msg Message entity
 * @returns {Promise<void>}
 */
async function saveMessage(msg) {
    const MessageService = require('../services/messages');
    return MessageService
        .create(msg)
        .then((saved) => logger.debug('Message saved:', saved));
}

module.exports = {
    getIdOfPeer,
    getTypeOfPeer,
    getPeerIdFieldName,
    createPeerId,
    updateMessageFromList,
    patchMessageFromList,
    getMessagesByListId,
    syncAllList,
    saveMessage,
};
