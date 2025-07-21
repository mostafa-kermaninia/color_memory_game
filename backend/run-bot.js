// backend/run-bot.js

// This file's only job is to start the bot's listening process.
const botManager = require('./bot');

botManager.startListening();