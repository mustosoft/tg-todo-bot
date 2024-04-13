const { ObjectId } = require('mongodb');
const mongo = require('../db.mongo');

const { createOneValidator } = require('../validators/list');

class ListService {
    /**
     * Create a new list service
     */
    constructor() {
        this.List = mongo.db('bot').collection('lists');

        // Create a text index on list field
        this.List.createIndex({ 'owner.ownerType': 1 });
        this.List.createIndex({ 'owner.ownerId': 1 });
        this.List.createIndex({ createdAt: -1 });
    }

    /**
     * Create a new list
     * @param {import('../value/list').List} list A cleaned list entity
     * @param {import('mongodb').ClientSession} session Session entity
     * @returns {{ _id: import('mongodb').ObjectId}}
     */
    async create(list, session = null) {
        const newList = await createOneValidator.validateAsync(list);

        newList.createdAt = new Date();
        newList.updatedAt = new Date();

        const res = await this.List.insertOne(newList, { session });

        return { ...newList, _id: res.insertedId };
    }

    /**
     * Get a list by query
     * @param {import('mongodb').Filter<import('../value/list').List>} query
     * @param {import('mongodb').ClientSession} session Session entity
     * @returns {Promise<import('../value/list').List>}
     */
    async getOne(query, session = null) {
        return this.List.findOne(query, { session });
    }

    /**
     * Get many lists by query
     * @param {import('mongodb').Filter<import('../value/list').List>} query
     * @param {import('mongodb').ClientSession} session Session entity
     * @returns {Promise<import('../value/list').List[]>}
     */
    async getMany(query, session = null) {
        return this.List.find(query, { sort: { createdAt: -1 }, session }).toArray();
    }

    /**
     * Delete a list by query returning the deleted entity
     * @param {import('mongodb').Filter<import('../value/list').List>} query
     * @param {import('mongodb').ClientSession} session Session entity
     */
    async deleteOne(query, session = null) {
        return this.List.findOneAndDelete(query, { session });
    }

    /**
     * Update a message from a list
     * @param {import('../value/list').List} list List entity
     * @param {ClientSession} session Session entity
     * @returns {Promise<import('mongodb').UpdateResult>}
     */
    async updateFromList(list, session = null) {
        if (!list.id) throw new Error('List ID not provided');

        const id = new ObjectId(list.id);

        return this.List.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    items: list.items,
                    updatedAt: new Date(),
                },
            },
            { session },
        );
    }
}

module.exports = new ListService();
