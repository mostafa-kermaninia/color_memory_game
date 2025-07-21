// Import DataTypes from Sequelize and the sequelize instance
const { DataTypes } = require("sequelize");
const sequelize = require("../database"); // Path to the sequelize instance from database.js

// Define the User model
const User = sequelize.define(
    "User", // Model name
    {
        telegramId: {
            type: DataTypes.BIGINT,    // Use BIGINT for large Telegram IDs
            allowNull: false,          // This field cannot be null
            unique: true,              // Must be unique across the table
            primaryKey: true,          // This field serves as the primary key
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,           // Telegram users might not have a username
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,          // Telegram usually provides a first name
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,           // Last name is optional on Telegram
        },
          photo_url: {
            type: DataTypes.STRING,
            allowNull: true, // ممکن است برخی کاربران عکس پروفایل نداشته باشند
        },
    },
    {
        tableName: "users",         // Explicitly define the table name
        timestamps: true,           // Automatically add createdAt and updatedAt fields
    }
);

// Export the User model
module.exports = User;