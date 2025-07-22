'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reward extends Model {
    static associate(models) {
      Reward.belongsTo(models.User, { foreignKey: 'userTelegramId', targetKey: 'telegramId', as: 'user' });
    }
  }
  Reward.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    // لینک جایزه‌ای که از API دریافت می‌شود
    rewardLink: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // شناسه رویدادی که این جایزه متعلق به آن است
    eventId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    // شناسه تلگرام کاربری که جایزه را دریافت کرده
    userTelegramId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Users', key: 'telegramId' }
    }
  }, {
    sequelize,
    modelName: 'Reward',
    tableName: 'Rewards',
    // ایجاد یک ایندکس ترکیبی برای جلوگیری از ثبت جایزه تکراری برای یک کاربر در یک رویداد
    indexes: [
        {
            unique: true,
            fields: ['eventId', 'userTelegramId']
        }
    ]
  });
  return Reward;
};