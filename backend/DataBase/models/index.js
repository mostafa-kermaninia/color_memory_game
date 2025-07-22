'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// --- تغییر اصلی اینجاست ---
// اتصال مستقیم به دیتابیس با استفاده از آدرس کامل
const sequelize = new Sequelize(
  'mysql://colormemory_user:13831383@localhost:3306/colormemory_db',
  {
    dialect: 'mysql',
    logging: console.log // لاگ کردن کوئری‌های دیتابیس برای دیباگ
  }
);
// --- پایان تغییر ---

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;