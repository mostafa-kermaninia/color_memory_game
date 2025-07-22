// ۱. وارد کردن نمونه sequelize از فایل database.js
const sequelize = require('../database');

// ۲. وارد کردن تمام مدل‌ها
const User = require('./User');
const Score = require('./Score');
const Reward = require('./Reward');

// ساخت یک آبجکت برای نگهداری همه چیز
const db = {};

db.User = User;
db.Score = Score;
db.Reward = Reward;

// ۳. تعریف روابط بین مدل‌ها
// رابطه یک به چند بین کاربر و امتیاز
db.User.hasMany(db.Score, {
  foreignKey: { name: 'userTelegramId', allowNull: false },
  sourceKey: 'telegramId',
  as: 'Scores'
});
db.Score.belongsTo(db.User, {
  foreignKey: { name: 'userTelegramId', allowNull: false },
  targetKey: 'telegramId'
});

// رابطه یک به چند بین کاربر و جایزه
db.User.hasMany(db.Reward, {
  foreignKey: { name: 'userTelegramId', allowNull: false },
  sourceKey: 'telegramId',
  as: 'Rewards'
});
db.Reward.belongsTo(db.User, {
  foreignKey: { name: 'userTelegramId', allowNull: false },
  targetKey: 'telegramId'
});

// ۴. اضافه کردن نمونه sequelize به آبجکت نهایی
db.sequelize = sequelize;

// ۵. صدور آبجکت نهایی برای استفاده در سرور
module.exports = db;