const { MongoClient } = require('mongodb');

if (!process.env.MONGO_URI) process.exit(1);

const client = new MongoClient(process.env.MONGO_URI);

module.exports = client;
