const { MongoClient } = require('mongodb');

let client = null;

const TESTING = process.env.NODE_ENV === 'test';

if (!TESTING && !process.env.MONGO_URI) process.exit(1);

if (TESTING) client = null;
else {
    client = new MongoClient(process.env.MONGO_URI, {
        connectTimeoutMS: 10000,
    });
}

module.exports = client;
