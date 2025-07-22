// این فایل را فقط زمانی اجرا کنید که مدل‌های دیتابیس را تغییر داده‌اید
require('dotenv').config();
const { sequelize } = require('./models'); // مسیر صحیح به مدل‌ها

console.log('Starting database synchronization...');

// تمام مدل‌های تعریف شده را با دیتابیس همگام‌سازی می‌کند
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database & tables altered successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  });