const { Sequelize } = require('sequelize');
require('dotenv').config(); // متغیرها را از .env می‌خواند

// بررسی وجود DB_URL
if (!process.env.DB_URL) {
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
    console.log('✅ Connection to the database has been established successfully.');
  })
  .catch((error) => {
    console.error('❌ Unable to connect to the database:', error);
  });

// صدور نمونه ساخته شده برای استفاده در فایل‌های دیگر
module.exports = sequelize;