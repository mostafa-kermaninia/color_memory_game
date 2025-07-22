
const { Sequelize } = require('sequelize');
console.log("🟡 [database.js] File execution started.");

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// --- لاگ تشخیصی شماره ۲: بررسی متغیر DB_URL ---
console.log("🟡 [database.js] Attempting to read DB_URL from process.env...");
console.log(`🟡 [database.js] DB_URL value is: ${process.env.DB_URL}`);
// ---
if (!process.env.DB_URL) {
  console.error("🔴 [database.js] FATAL ERROR: DB_URL is not defined in the .env file.");
  throw new Error('DB_URL is not defined in the .env file');
}

// ساخت یک نمونه از Sequelize با استفاده از DB_URL
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'mysql',
  logging: false, // لاگ کردن کوئری‌ها را غیرفعال می‌کند
});

// تست اتصال به دیتابیس
sequelize.authenticate()
  .then(() => {
    console.log('✅ [database.js] Connection to the database has been established successfully.');
  })
  .catch((error) => {
    console.error('❌ [database.js] Unable to connect to the database:', error.message);
  });

// صدور نمونه ساخته شده برای استفاده در فایل‌های دیگر
module.exports = sequelize;