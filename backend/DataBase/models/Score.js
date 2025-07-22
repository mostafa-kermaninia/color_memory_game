'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Score extends Model {
    static associate(models) {
      Score.belongsTo(models.User, { foreignKey: 'userTelegramId', targetKey: 'telegramId', as: 'user' });
    }
  }
  Score.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    userTelegramId: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'Users', key: 'telegramId' } },
    eventId: { type: DataTypes.UUID, allowNull: true }
  }, { sequelize, modelName: 'Score', tableName: 'Scores' });
  return Score;
};