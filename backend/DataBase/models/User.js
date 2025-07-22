'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Score, { foreignKey: 'userTelegramId', sourceKey: 'telegramId', as: 'scores' });
      // یک کاربر می‌تواند چندین جایزه داشته باشد
      User.hasMany(models.Reward, { foreignKey: 'userTelegramId', sourceKey: 'telegramId', as: 'rewards' });
    }
  }
  User.init({
    telegramId: { type: DataTypes.BIGINT, primaryKey: true, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: true },
    username: { type: DataTypes.STRING, allowNull: true, unique: true },
    photo_url: { type: DataTypes.STRING, allowNull: true }
  }, { sequelize, modelName: 'User', tableName: 'Users' });
  return User;
};