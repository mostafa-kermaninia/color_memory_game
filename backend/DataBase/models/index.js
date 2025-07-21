// Import the sequelize instance
const sequelize = require('../database');

// Import all models
const User = require('./User');
const Score = require('./Score');
const Reward = require('./Reward');

// Create an object to hold our models and sequelize instance
const db = {};

// Add models to the db object
db.User = User;
db.Score = Score;
db.Reward = Reward;

// Define associations between models

// User <-> Score: A User can have many Scores; A Score belongs to one User.
db.User.hasMany(db.Score, {
    foreignKey: {
        name: 'userTelegramId', // Foreign key in the Scores table
        allowNull: false
    },
    sourceKey: 'telegramId',      // The User.telegramId is the source key for this association
    as: 'Scores'                  // Alias for easy access (e.g., user.getScores(), user.addScore())
});
db.Score.belongsTo(db.User, {
    foreignKey: {
        name: 'userTelegramId',
        allowNull: false
    },
    targetKey: 'telegramId'       // The Score.userTelegramId targets User.telegramId
});

// User <-> Reward: A User can have many Rewards; A Reward belongs to one User.
db.User.hasMany(db.Reward, {
    foreignKey: {
        name: 'userTelegramId', // Foreign key in the Rewards table
        allowNull: false
    },
    sourceKey: 'telegramId',
    as: 'Rewards'                 // Alias for easy access (e.g., user.getRewards(), user.addReward())
});
db.Reward.belongsTo(db.User, {
    foreignKey: {
        name: 'userTelegramId',
        allowNull: false
    },
    targetKey: 'telegramId'
});

// Add the sequelize instance to the db object
db.sequelize = sequelize;
// Add Sequelize library itself if needed elsewhere (optional)
// db.Sequelize = Sequelize;

// Export the db object
module.exports = db;