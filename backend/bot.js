'use strict';
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');

const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error('Telegram BOT_TOKEN is not configured in .env file.');
}

const { User, Score, Reward, sequelize } = require("./DataBase/models");

// خواندن متغیرها از فایل تنظیمات برای انعطاف‌پذیری بیشتر
const REQUIRED_CHANNEL_ID = process.env.REQUIRED_CHANNEL_ID;
const REQUIRED_GROUP_ID = process.env.REQUIRED_GROUP_ID;
const GROUP_INVITE_LINK = process.env.GROUP_INVITE_LINK;
const WEB_APP_URL = 'https://memory.momis.studio'; // آدرس بازی

const bot = new TelegramBot(token);

// --- Channel Membership Check (Improved with Logging) ---
async function isUserMember(userId) {
    // **مهم:** مطمئن شوید این شناسه‌ها در فایل .env یا ecosystem.config.js شما تعریف شده‌اند
    const CHANNEL_ID = process.env.REQUIRED_CHANNEL_ID || '@MOMIS_studio';
    const GROUP_ID = process.env.REQUIRED_GROUP_ID || '@MOMIS_community';
    
    try {
        const validStatuses = ['member', 'administrator', 'creator'];

        const [channelMember, groupMember] = await Promise.all([
            bot.getChatMember(CHANNEL_ID, userId),
            bot.getChatMember(GROUP_ID, userId)
        ]);

        // --- لاگ تشخیصی برای دیدن وضعیت دقیق کاربر ---
        logger.info(`Membership check for user ${userId}: Channel status='${channelMember.status}', Group status='${groupMember.status}'`);
        // ---

        const inChannel = validStatuses.includes(channelMember.status);
        const inGroup = validStatuses.includes(groupMember.status);

        return inChannel && inGroup;

    } catch (error) {
        // اگر کاربر عضو نباشد، تلگرام خطای "user not found" می‌دهد که طبیعی است
        if (error.response?.body?.description.includes('user not found')) {
            logger.warn(`User ${userId} not found in channel/group, considered as not a member.`);
            return false;
        }
        // سایر خطاها را به عنوان مشکل در نظر می‌گیریم
        logger.error(`Failed to check channel membership for ${userId}: ${error.message}`);
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


function startListening() {
    bot.onText(/\/start (.+)/, async (msg, match) => {
        const userId = msg.from.id;
        const firstName = msg.from.first_name;
        const username = msg.from.username;
        const lastName = msg.from.last_name;
        const payload = match[1];

        let referrerTelegramId = null;
        if (payload.startsWith('invite_')) {
            referrerTelegramId = parseInt(payload.substring(7), 10);
            if (isNaN(referrerTelegramId) || referrerTelegramId === userId) {
                referrerTelegramId = null; 
            }
        }

        try {
            let user = await User.findByPk(userId);

            if (!user) {
                user = await User.create({
                    telegramId: userId,
                    username: username,
                    firstName: firstName,
                    lastName: lastName,
                    referrerTelegramId: referrerTelegramId,
                });
                logger.info(`New user registered: ${userId}. Referrer: ${referrerTelegramId || 'None'}`);

                if (referrerTelegramId) {
                    const referrer = await User.findByPk(referrerTelegramId);
                    const referrerName = referrer ? (referrer.firstName || referrer.username) : 'a friend';
                    await bot.sendMessage(userId, 
                        `👋 Welcome, *${firstName}*! You were invited by *${referrerName}* to join the game.`, 
                        { parse_mode: "Markdown" }
                    );
                } else {
                    await bot.sendMessage(userId, 
                        `🎉 Welcome, *${firstName}*!`, 
                        { parse_mode: "Markdown" }
                    );
                }
            } else {
                logger.info(`Existing user ${userId} started bot.`);
            }
            
            const isMember = await isUserMember(userId);
            
            if (!isMember) {
                // ارسال پیام الزام به عضویت با دکمه‌های بهبودیافته
                const channelLink = `https://t.me/${(process.env.REQUIRED_CHANNEL_ID || '@MOMIS_studio').replace('@', '')}`;
                const groupLink = process.env.GROUP_INVITE_LINK || 'https://t.me/MOMIS_community';
                const message = `👋 Hello, *${firstName}*!\n\nTo play the game, please join our community channels first, then click the button below.`;
                
                const options = {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📢 Join Channel', url: channelLink }],
                            [{ text: '💬 Join Community Group', url: groupLink }],
                            [{ text: '✅ I\'ve Joined!', callback_data: 'check_membership' }] // دکمه جدید
                        ]
                    }
                };
                
                return await bot.sendMessage(userId, message, options);
            }

            // اگر کاربر از قبل عضو بود، پیام خوش‌آمدگویی را ارسال کن
            const welcomeText = `🎉 Welcome, *${firstName}*!\n\nReady to test your memory? Click the button below to start playing **Color Memory**!`;
            const options = {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "🚀 Play Game!", web_app: { url: "https://memory.momis.studio" } }]]
                }
            };
            await bot.sendMessage(userId, welcomeText, options);

        } catch (error) {
            logger.error(`Error in /start handler: ${error.message}`);
            await bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again later.');
        }
    });

    bot.onText(/^\/start$/, async (msg) => {
        const userId = msg.from.id;
        const firstName = msg.from.first_name;

        try {
            const isMember = await isUserMember(userId);
            
            if (!isMember) {
                // ارسال پیام الزام به عضویت با دکمه‌های بهبودیافته
                const channelLink = `https://t.me/${(process.env.REQUIRED_CHANNEL_ID || '@MOMIS_studio').replace('@', '')}`;
                const groupLink = process.env.GROUP_INVITE_LINK || 'https://t.me/MOMIS_community';
                const message = `👋 Hello, *${firstName}*!\n\nTo play the game, please join our community channels first, then click the button below.`;
                
                const options = {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📢 Join Channel', url: channelLink }],
                            [{ text: '💬 Join Community Group', url: groupLink }],
                            [{ text: '✅ I\'ve Joined!', callback_data: 'check_membership' }] // دکمه جدید
                        ]
                    }
                };
                
                return await bot.sendMessage(userId, message, options);
            }

            // اگر کاربر از قبل عضو بود، پیام خوش‌آمدگویی را ارسال کن
            const welcomeText = `🎉 Welcome, *${firstName}*!\n\nReady to test your memory? Click the button below to start playing **Color Memory**!`;
            const options = {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [[{ text: "🚀 Play Game!", web_app: { url: "https://memory.momis.studio" } }]]
                }
            };
            await bot.sendMessage(userId, welcomeText, options);

        } catch (error) {
            logger.error(`Error in /start handler: ${error.message}`);
            await bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again later.');
        }
    });

    // مدیریت دکمه "عضو شدم"
    bot.on('callback_query', async (callbackQuery) => {
        const msg = callbackQuery.message;
        const userId = callbackQuery.from.id;

        if (callbackQuery.data === 'check_membership') {
            const isMember = await isUserMember(userId);

            if (isMember) {
                // اگر عضو شده بود، پیام قبلی را ویرایش کرده و به او تبریک بگو
                const successText = `✅ **Thank you, ${callbackQuery.from.first_name}!**\n\nYou're all set. Click the button below to start playing!`;
                const playOptions = {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🚀 Play Game!', web_app: { url: "https://memory.momis.studio" } }]]
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

    bot.startPolling();
    bot.on("polling_error", (error) => logger.error(`Telegram Polling Error: ${error.message}`));
    logger.info("Telegram Bot initialized and is now listening for commands...");
}

// **مهم:** آبجکت bot و تابع isUserMember را هم export کنید
module.exports = {
    bot,
    isUserMember,
    sendWinnerMessage,
    sendConsolationMessage,
    startListening,
};