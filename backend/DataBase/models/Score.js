// backend/DataBase/models/Score.js

const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Score = sequelize.define(
    "Score",
    {
        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        eventId: {
            type: DataTypes.STRING,
            // Allow this field to be null for "Free Play" games.
            allowNull: true, // <-- This is the only change here.
            comment: "The UUID of the ONTON event. NULL if it's a free play.",
        },
    },
    {
        tableName: "scores",
        timestamps: true,
    }
);

module.exports = Score;