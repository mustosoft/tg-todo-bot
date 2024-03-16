const mongo = require('../db.mongo');

class MessageService {
    /**
     * Create a new message service
     */
    constructor() {
        this.Message = mongo.db('bot').collection('messages');

        // Create a text index on message field
        this.Message.createIndex({ message: 'text' });
        this.Message.createIndex({ date: 1 });
        this.Message.createIndex({ 'chat.id': 1 });
        this.Message.createIndex({ 'chat.username': 1 });
    }

    /**
     * Create a new message
     * @param {import('telegram/tl/api').Api.Message} message Message entity
     */
    async create(message) {
        const doc = JSON.parse(JSON.stringify(message));

        doc.chat = await message.getChat().catch(() => ({}));
        doc.date = new Date(message.date * 1000);

        (async () => { doc.chat.id = Number(doc.chat.id); })().catch(() => {});

        await this.Message.insertOne(doc);
    }
}

module.exports = new MessageService();
