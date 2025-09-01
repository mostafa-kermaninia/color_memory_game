'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Score, { foreignKey: 'userTelegramId', sourceKey: 'telegramId', as: 'scores' });
      // یک کاربر می‌تواند چندین جایزه داشته باشد
      User.hasMany(models.Reward, { foreignKey: 'userTelegramId', sourceKey: 'telegramId', as: 'rewards' });
      // --- Self-referencing association for referrals ---
      // یک کاربر می‌تواند چندین کاربر دیگر را ارجاع دهد
      User.hasMany(models.User, {
        foreignKey: 'referrerTelegramId', // این فیلد در جدول User فعلی قرار می‌گیرد
        as: 'referredUsers',             // نام مستعار برای دسترسی به کاربرانی که این کاربر آن‌ها را دعوت کرده است
        sourceKey: 'telegramId',         // کلید مبدأ از مدل User (ارجاع‌دهنده)
        allowNull: true                  // NEW: اجازه می‌دهد این ارتباط Null باشد (کاربر بدون ارجاع‌دهنده)
      });

      // یک کاربر توسط یک ارجاع‌دهنده دعوت شده است (اختیاری)
      User.belongsTo(models.User, {
        foreignKey: 'referrerTelegramId', // کلید خارجی که به telegramId کاربر ارجاع‌دهنده اشاره می‌کند
        as: 'referrer',                  // نام مستعار برای دسترسی به ارجاع‌دهنده این کاربر
        targetKey: 'telegramId',         // کلید مقصد در مدل User (ارجاع‌دهنده)
        allowNull: true                  // NEW: اجازه می‌دهد این ارتباط Null باشد (کاربر بدون ارجاع‌دهنده)
      });
      // --- END NEW ASSOCIATIONS ---
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