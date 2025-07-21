// backend/sync-db.js

// این فایل را فقط زمانی اجرا کنید که مدل‌های دیتابیس را تغییر داده‌اید

require('dotenv').config(); // این خط را اضافه کنید تا به متغیرهای .env دسترسی داشته باشد
const { sequelize } = require('./models'); // مسیر صحیح به مدل‌ها

console.log('Starting database synchronization...');

// Synchronize all defined models to the database.
sequelize.sync({ alter: true }) // alter: true سعی می‌کند جدول‌ها را با مدل‌ها هماهنگ کند
  .then(() => {
    console.log('✅ Database & tables altered successfully!');
    // پس از اتمام موفقیت‌آمیز، پروسه را به صورت خودکار پایان می‌دهد
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error syncing database:', error);
    // در صورت بروز خطا، با کد خطا از پروسه خارج می‌شود
    process.exit(1);
  });