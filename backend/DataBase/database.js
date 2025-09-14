'use strict';
const { Sequelize } = require('sequelize');
console.log("🟡 [database.js] File execution started.");

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// --- لاگ تشخیصی: بررسی متغیرهای DB_URL و USER_DB_URL ---
console.log("🟡 [database.js] Attempting to read DB_URL and USER_DB_URL from process.env...");
console.log(`🟡 [database.js] DB_URL value is: ${process.env.DB_URL}`);
console.log(`🟡 [database.js] USER_DB_URL value is: ${process.env.USER_DB_URL}`);
// ---

if (!process.env.DB_URL) {
  console.error("🔴 [database.js] FATAL ERROR: DB_URL is not defined in the .env file.");
  throw new Error('DB_URL is not defined in the .env file');
}

if (!process.env.USER_DB_URL) {
  console.error("🔴 [database.js] FATAL ERROR: USER_DB_URL is not defined in the .env file.");
  throw new Error('USER_DB_URL is not defined in the .env file');
}

// ساخت یک نمونه از Sequelize برای دیتابیس اصلی (بر اساس نام اصلی)
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'mysql',
  logging: false,
});

// ساخت یک نمونه جدید از Sequelize برای دیتابیس مرکزی کاربران (momis_users)
const user_db_sequelize = new Sequelize(process.env.USER_DB_URL, {
  dialect: 'mysql',
  logging: false,
});

// تست اتصال به دیتابیس اصلی
sequelize.authenticate()
  .then(() => {
    console.log('✅ [database.js] Connection to the main database has been established successfully.');
  })
  .catch((error) => {
    console.error('❌ [database.js] Unable to connect to the main database:', error.message);
  });

// تست اتصال به دیتابیس کاربران
user_db_sequelize.authenticate()
  .then(() => {
    console.log('✅ [database.js] Connection to the user database has been established successfully.');
  })
  .catch((error) => {
    console.error('❌ [database.js] Unable to connect to the user database:', error.message);
  });

// صدور هر دو نمونه برای استفاده در فایل‌های دیگر
module.exports = {
  sequelize,
  user_db_sequelize
};