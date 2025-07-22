require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const logger = require("./logger");

const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error("Telegram BOT_TOKEN is not configured in .env file.");
}

const bot = new TelegramBot(token);

async function sendWinnerMessage(telegramId, userName, score, rewardLink) {
    const message = `🏆 *Congratulations, ${userName}!* 🏆

You were one of the top players in the last tournament!

*Your final score:* *${score}*

You have earned a special reward. Click the button below to claim your prize.`;

    const options = {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎁 Claim Your Reward", url: rewardLink }],
            ],
        },
    };
    try {
        await bot.sendMessage(telegramId, message, options);
        logger.info(`Winner message sent to user ${telegramId}`);
    } catch (error) {
        logger.error(
            `Failed to send winner message to ${telegramId}. Reason: ${error.message}`
        );
    }
}

async function sendConsolationMessage(telegramId, userName, topScore) {
    const message = `👋 Hello, *${userName}*!

Thank you for participating in our latest tournament.

*Your highest score:* *${topScore}*

The tournament has now officially ended. Keep practicing for the next event!`;

    const options = {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "🚀 Practice in Free Mode!",
                        web_app: { url: "https://memory.momis.studio" }, // <--- تغییر: آدرس به بازی جدید آپدیت شد
                    },
                ],
            ],
        },
    };
    try {
        await bot.sendMessage(telegramId, message, options);
        logger.info(`Consolation message sent to user ${telegramId}`);
    } catch (error) {
        logger.error(
            `Failed to send consolation message to ${telegramId}. Reason: ${error.message}`
        );
    }
}

function startListening() {
    bot.onText(/\/start/, (msg) => {
        console.log("poooooooooooooooooooo");
        const welcomeText = `🎉 Welcome, *${msg.from.first_name}*!\n\nReady to test your memory? Click the button below to start playing **Color Memory**!`;
        const options = {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🚀 Play Game!",
                            web_app: { url: "https://memory.momis.studio" }, // <--- تغییر: آدرس به بازی جدید آپدیت شد
                        },
                    ],
                ],
            },
        };
        bot.sendMessage(msg.chat.id, welcomeText, options);
    });

    bot.startPolling();

    bot.on("polling_error", (error) => {
        logger.error(`Telegram Polling Error: ${error.message}`);
    });

    logger.info(
        "Telegram Bot initialized and is now listening for commands..."
    );
}

module.exports = {
    sendWinnerMessage,
    sendConsolationMessage,
    startListening,
};
