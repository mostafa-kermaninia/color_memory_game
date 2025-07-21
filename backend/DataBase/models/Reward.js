// backend/DataBase/models/Reward.js

const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Reward = sequelize.define(
    "Reward",
    {
        // ستون جدید برای ذخیره لینک پاداش از ONTON
        rewardLink: {
            type: DataTypes.STRING,
            allowNull: false, // لینک پاداش همیشه باید وجود داشته باشد
        },
        // ستون جدید برای ذخیره شناسه رویداد
        eventId: {
            type: DataTypes.STRING,
            allowNull: true, // اختیاری، اما برای پیگیری بهتر است باشد
        },
        // userTelegramId از طریق ارتباط با مدل User اضافه خواهد شد
    },
    {
        tableName: "rewards",
        timestamps: true,
    }
);

module.exports = Reward;