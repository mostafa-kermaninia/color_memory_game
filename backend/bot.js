'use strict';
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');

const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error('Telegram BOT_TOKEN is not configured in .env file.');
}

// خواندن متغیرها از فایل تنظیمات برای انعطاف‌پذیری بیشتر
const REQUIRED_CHANNEL_ID = process.env.REQUIRED_CHANNEL_ID;
const REQUIRED_GROUP_ID = process.env.REQUIRED_GROUP_ID;
const GROUP_INVITE_LINK = process.env.GROUP_INVITE_LINK;
const WEB_APP_URL = 'https://memory.momis.studio'; // آدرس بازی

const bot = new TelegramBot(token);

/**
 * تابع بهبودیافته برای بررسی عضویت کاربر
 */
async function isUserMember(userId) {
    if (!REQUIRED_CHANNEL_ID || !REQUIRED_GROUP_ID) {
        logger.warn("Required channel/group IDs are not set. Skipping membership check.");
        return true;
    }

    try {
        const validStatuses = ['creator', 'administrator', 'member'];
        const [channelMember, groupMember] = await Promise.all([
            bot.getChatMember(REQUIRED_CHANNEL_ID, userId),
            bot.getChatMember(REQUIRED_GROUP_ID, userId)
        ]);

        return validStatuses.includes(channelMember.status) && validStatuses.includes(groupMember.status);
    } catch (error) {
        if (error.response?.body?.description.includes('user not found')) {
            return false; // این خطا نیست، یعنی کاربر عضو نیست
        }
        logger.error(`Error checking membership for user ${userId}: ${error.message}`);
        return false;
    }
}

// این تابع بدون تغییر باقی می‌ماند
async function sendWinnerMessage(telegramId, userName, score, rewardLink) {
    const message = `🏆 *Congratulations, ${userName}!* 🏆

You were a top player in the last tournament!

*Your final score:* *${score}*

You have earned a special reward. Click the button below to claim your prize.`;
    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: "🎁 Claim Your Reward", url: rewardLink }]]
        }
    };
    try {
        await bot.sendMessage(telegramId, message, options);
        logger.info(`Winner message sent to user ${telegramId}`);
    } catch (error) {
        logger.error(`Failed to send winner message to ${telegramId}. Reason: ${error.message}`);
    }
}

// این تابع بدون تغییر باقی می‌ماند
async function sendConsolationMessage(telegramId, userName, topScore) {
    const message = `👋 Hello, *${userName}*!

Thank you for participating in our latest tournament.

*Your highest score:* *${topScore}*

The tournament has now ended. Keep practicing for the next event!`;
    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: "🚀 Practice in Free Mode!", web_app: { url: WEB_APP_URL } }]]
        }
    };
    try {
        await bot.sendMessage(telegramId, message, options);
        logger.info(`Consolation message sent to user ${telegramId}`);
    } catch (error) {
        logger.error(`Failed to send consolation message to ${telegramId}. Reason: ${error.message}`);
    }
}


/**
 * تابع اصلی برای گوش دادن به دستورات ربات (بازنویسی شده)
 */
function startListening() {
    bot.onText(/\/start/, async (msg) => {
        const userId = msg.from.id;
        const userName = msg.from.first_name;

        try {
            const isMember = await isUserMember(userId);

            if (isMember) {
                // اگر کاربر عضو بود، پیام خوش‌آمدگویی و دکمه بازی را نشان بده
                const welcomeText = `🎉 **Welcome, ${userName}!**\n\nReady to test your memory? Click the button below to start playing **Color Memory**!`;
                const options = {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🚀 Play Game!', web_app: { url: WEB_APP_URL } }]]
                    }
                };
                await bot.sendMessage(userId, welcomeText, options);
            } else {
                // اگر کاربر عضو نبود، پیام الزام به عضویت با دکمه‌های بهبودیافته را نشان بده
                const joinMessage = `👋 **Hello, ${userName}!**\n\nTo play the game, you need to be a member of our community. Please join both channels and then click "I've Joined!"`;
                const options = {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📢 Join Official Channel', url: `https://t.me/${REQUIRED_CHANNEL_ID.replace('@', '')}` }],
                            [{ text: '💬 Join Community Group', url: GROUP_INVITE_LINK }],
                            [{ text: '✅ I\'ve Joined!', callback_data: 'check_membership' }]
                        ]
                    }
                };
                await bot.sendMessage(userId, joinMessage, options);
            }
        } catch (error) {
            logger.error(`Error in /start handler for user ${userId}: ${error.message}`);
            await bot.sendMessage(userId, '❌ An unexpected error occurred. Please try again in a few moments.');
        }
    });

    // مدیریت دکمه "عضو شدم" برای تجربه کاربری بهتر
    bot.on('callback_query', async (callbackQuery) => {
        const userId = callbackQuery.from.id;
        const msg = callbackQuery.message;

        if (callbackQuery.data === 'check_membership') {
            const isMember = await isUserMember(userId);

            if (isMember) {
                // اگر عضو شده بود، پیام قبلی را ویرایش کرده و به او تبریک بگو
                const successText = `✅ **Thank you, ${callbackQuery.from.first_name}!**\n\nYou're all set. Click the button below to start playing!`;
                const playOptions = {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🚀 Play Game!', web_app: { url: WEB_APP_URL } }]]
                    }
                };
                // ویرایش پیام به جای ارسال پیام جدید، تجربه بهتری است
                await bot.editMessageText(successText, {
                    chat_id: msg.chat.id,
                    message_id: msg.message_id,
                    ...playOptions
                });
            } else {
                // اگر هنوز عضو نشده بود، یک پیام هشدار به او نشان بده
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "You haven't joined our channel and group yet. Please join both first.",
                    show_alert: true
                });
            }
        }
    });

    bot.startPolling({ polling: { interval: 300 } });
    bot.on('polling_error', (error) => logger.error(`Telegram Polling Error: ${error.message}`));
    logger.info('Telegram Bot is listening for commands...');
}

// **مهم:** آبجکت bot و تابع isUserMember را هم export کنید
module.exports = {
    bot,
    isUserMember,
    sendWinnerMessage,
    sendConsolationMessage,
    startListening,
};