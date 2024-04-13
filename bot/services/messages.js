/**
 * @typedef {import('mongodb').ClientSession} ClientSession
 */

const { ObjectId } = require('mongodb');
const mongo = require('../db.mongo');

const { bufferParser } = require('../util/json');
const { messagePeer } = require('../validators/message');

class MessageService {
    /**
     * Create a new message service
     */
    constructor() {
        this.Message = mongo.db('bot').collection('messages');
        this.ListMessage = mongo.db('bot').collection('listmessages');

        // Create a text index on message field
        this.Message.createIndex({ message: 'text' });
        this.Message.createIndex({ date: 1 });
        this.Message.createIndex({ 'chat.id': 1 });
        this.Message.createIndex({ 'chat.username': 1 });

        this.Message.createIndex({ 'peerId.userId': 1 });
        this.Message.createIndex({ 'peerId.channelId': 1 });
        this.Message.createIndex({ 'peerId.chatId': 1 });
        this.Message.createIndex({ 'peerId.className': 1 });

        this.Message.createIndex({ 'replyMarkup.rows.buttons.data.string': 1 });
    }

    /**
     * Create a new message
     * @param {import('telegram/tl/api').Api.Message} message Message entity
     * @param {ClientSession} session Session entity
     */
    async create(message, session = null) {
        const doc = JSON.parse(JSON.stringify(message, bufferParser));

        doc.chat = await message.getChat().catch(() => ({}));
        doc.date = new Date(message.date * 1000);

        (async () => { doc.chat.id = Number(doc.chat.id); })().catch(() => { });

        await this.Message.insertOne(doc, { session });
    }

    /**
     * Get a message by id and peer
     * @param {number} id Message ID
     * @param {import('telegram/tl/api').Api.TypePeer} peer Peer entity
     * @param {ClientSession} session Session entity
     */
    async getByIdAndPeer(id, peer, session = null) {
        // Avoid circular dependency error
        // eslint-disable-next-line global-require
        const { getTypeOfPeer, getIdOfPeer } = require('../util/message');

        await messagePeer.validateAsync(peer.toJSON());

        const peerId = getIdOfPeer(peer);
        const peerType = getTypeOfPeer(peer);
        const fieldName = `${peerType}Id`;

        const query = {
            id,
            [`peerId.${fieldName}`]: peerId.toString(),
        };

        const doc = await this.Message.findOne(query, { session });
        if (!doc) throw new Error('Message not found');

        return doc;
    }

    /**
     * Get messages by list ID
     * @param {string} listId List ID
     * @param {ClientSession} session Session entity
     */
    async getByListId(listId, limit = null, session = null) {
        const binder = await this.ListMessage
            .find({ listId: new ObjectId(listId) }, { session })
            .toArray();
        const msgIds = binder.map((e) => e.msgId);

        const options = {
            session,
            sort: { date: -1 },
            limit: limit ?? 100,
        };

        return this.Message.find({
            _id: { $in: msgIds },
        }, options).toArray();
    }
}

module.exports = new MessageService();
