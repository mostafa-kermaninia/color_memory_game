require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');

const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error('Telegram BOT_TOKEN is not configured in .env file.');
}

const bot = new TelegramBot(token);

// --- توابع ارسال پیام ---

async function sendWinnerMessage(telegramId, userName, score, rewardLink) {
    const message = 
`🏆 *تبریک, ${userName}!* 🏆

شما یکی از بازیکنان برتر در تورنومنت اخیر بودید!

*امتیاز نهایی شما:* *${score}*

شما یک جایزه ویژه کسب کرده‌اید. برای دریافت جایزه روی دکمه زیر کلیک کنید.`;

    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: '🎁 دریافت جایزه', url: rewardLink }]]
        }
    };
    try {
        await bot.sendMessage(telegramId, message, options);
        logger.info(`Winner message sent to user ${telegramId}`);
    } catch (error) {
        logger.error(`Failed to send winner message to ${telegramId}. Reason: ${error.message}`);
    }
}

async function sendConsolationMessage(telegramId, userName, topScore) {
    const message = 
`👋 سلام, *${userName}*!

از شرکت شما در تورنومنت اخیر سپاسگزاریم. این بار شما جزو ۱۰ نفر برتر نبودید.

*بالاترین امتیاز شما:* *${topScore}*

تورنومنت اکنون به پایان رسیده است. برای رویداد بعدی به تمرین ادامه دهید!`;

    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ 
                text: '🚀 تمرین در حالت آزاد', 
                web_app: { url: 'https://memory.momis.studio' } // <--- تغییر: آدرس به بازی جدید آپدیت شد
            }]]
        }
    };
    try {
        await bot.sendMessage(telegramId, message, options);
        logger.info(`Consolation message sent to user ${telegramId}`);
    } catch (error) {
        logger.error(`Failed to send consolation message to ${telegramId}. Reason: ${error.message}`);
    }
}

// --- تابع گوش دادن ربات ---

function startListening() {
    bot.onText(/\/start/, (msg) => {
        // <--- تغییر: متن خوش‌آمدگویی برای بازی جدید آپدیت شد
        const welcomeText = `🎉 خوش آمدی, *${msg.from.first_name}*!\n\nبرای شروع بازی **حافظه رنگی** روی دکمه زیر کلیک کن!`;
        const options = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ 
                    text: '🚀 شروع بازی!', 
                    web_app: { url: 'https://memory.momis.studio' } // <--- تغییر: آدرس به بازی جدید آپدیت شد
                }]]
            }
        };
        bot.sendMessage(msg.chat.id, welcomeText, options);
    });

    bot.startPolling();

    bot.on('polling_error', (error) => {
        logger.error(`Telegram Polling Error: ${error.message}`);
    });

    logger.info('Telegram Bot initialized and is now listening for commands...');
}

module.exports = {
    sendWinnerMessage,
    sendConsolationMessage,
    startListening,
};