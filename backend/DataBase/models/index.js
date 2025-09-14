'use strict';

const { sequelize, user_db_sequelize } = require('../database');
const { DataTypes, Sequelize } = require('sequelize');

const db = {};

// Load models for the main database
db.User = require('./User')(sequelize, DataTypes);
db.Score = require('./Score')(sequelize, DataTypes);
db.Reward = require('./Reward')(sequelize, DataTypes);

// Load models for the user-centric database (momis_users)
// This model will use the separate user_db_sequelize instance
db.User_Momis = require('./User')(user_db_sequelize, DataTypes);

// Associate models for the main database
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;