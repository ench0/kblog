const mongoose = require('mongoose')
const mongoDB = process.env.MONGODB_URI || 'mongodb://localhost/eblog';
mongoose.Promise = require('bluebird')

console.log('connecting to MongoDB...')

try {
    mongoose.connect(mongoDB, { useMongoClient: true })
} catch(err) {
    console.log('connection failed...', err)    
}

module.exports = console.log('connected to MongoDB...')