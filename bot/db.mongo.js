const { MongoClient } = require('mongodb');

if (!process.env.MONGO_URI) process.exit(1);

const client = new MongoClient(process.env.MONGO_URI, {
    connectTimeoutMS: 10000,
});

module.exports = client;
