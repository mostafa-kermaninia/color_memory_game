'use strict';

const sequelize = require('../database');
const { DataTypes, Sequelize } = require('sequelize'); 

const db = {};

// مدل‌ها را به درستی فراخوانی و با sequelize مقداردهی اولیه می‌کنیم
db.User = require('./User')(sequelize, DataTypes);
db.Score = require('./Score')(sequelize, DataTypes);
db.Reward = require('./Reward')(sequelize, DataTypes);

// حالا که مدل‌ها معتبر هستند، روابط (associations) را تعریف می‌کنیم
// این کار را با فراخوانی متد associate از هر مدل انجام می‌دهیم
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;