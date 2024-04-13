const mongo = require('../db.mongo');

class Transactor {
    /**
     * Run a transaction
     * @typedef {import('mongodb').ClientSession} ClientSession
     * @typedef {<T = any>(session: ClientSession) => Promise<T>} CallbackFunc
     * @param {CallbackFunc} callback Transaction callback
     * @returns {Promise<ReturnType<typeof callback>>} Result of the transaction
     */
    static async withTransaction(callback) {
        return mongo.withSession(async (session) => session.withTransaction(callback));
    }
}

module.exports = { Transactor };
