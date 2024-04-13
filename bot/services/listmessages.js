/**
 * @typedef {import('mongodb').ObjectId} ObjectId
 */

const { ObjectId } = require('mongodb');
const mongo = require('../db.mongo');
const { OIDValidator } = require('../validators/common');

class ListMessageService {
    /**
     * Create a new list-message service
     */
    constructor() {
        this.ListMessage = mongo.db('bot').collection('listmessages');

        this.ListMessage.createIndex({ listId: 1, msgId: 1 });
    }

    /**
     * Create a new list-message binder
     * @param {ObjectId | string} listId ID of the list
     * @param {ObjectId | string} msgId ID of the message
     */
    async upsert(listId, msgId) {
        if (typeof listId === 'string') await OIDValidator.validateAsync(listId);
        if (typeof msgId === 'string') await OIDValidator.validateAsync(msgId);

        return this.ListMessage.updateOne(
            {
                listId: new ObjectId(listId),
                msgId: new ObjectId(msgId),
            },
            [
                {
                    $set: {
                        updatedAt: new Date(),
                        createdAt: { $cond: ['$createdAt', '$createdAt', new Date()] },
                    },
                },
            ],
            { upsert: true },
        );
    }

    /**
     * Delete a list-message binder
     * @param {ObjectId | string} listId ID of the list
     * @param {ObjectId | string} msgId ID of the message
     * @returns {Promise<import('mongodb').DeleteResult>}
     */
    async delete(listId, msgId) {
        if (typeof listId === 'string') await OIDValidator.validateAsync(listId);
        if (typeof msgId === 'string') await OIDValidator.validateAsync(msgId);

        if (!msgId) {
            return this.ListMessage.deleteMany({
                listId: new ObjectId(listId),
            });
        }

        return this.ListMessage.deleteOne({
            listId: new ObjectId(listId),
            msgId: new ObjectId(msgId),
        });
    }
}

module.exports = new ListMessageService();
