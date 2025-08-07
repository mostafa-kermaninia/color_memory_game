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

// --- Channel Membership Check ---
async function isUserInChannel(userId) {
    const CHANNEL_ID = '@MOMIS_studio';
    const GROUP_ID = '@MOMIS_community';
    try {
        const member1 = await bot.getChatMember(CHANNEL_ID, userId);
        const member2 = await bot.getChatMember(GROUP_ID, userId);
        console.log('in channel: ' + member1.status);
        console.log('in group: ' + member2.status);
        return ['member', 'administrator', 'creator'].includes(member1.status) &&
            ['member', 'administrator', 'creator'].includes(member2.status) ;
    } catch (error) {
        logger.error(`Failed to check channel membership for ${userId}: ${error.message}`);
        return false;
    }
}

function startListening() {
    bot.onText(/\/start/, async(msg) => {
        console.log("poooooooooooooooooooo");
        try {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const firstName = msg.from.first_name;

            // بررسی عضویت در کانال
            const isMember = await isUserInChannel(userId);
            
            if (!isMember) {
                // ارسال پیام عضویت در کانال
                const channelLink = 'https://t.me/MOMIS_studio'; 
                const groupLink = 'https://t.me/MOMIS_community'; 
                const message = `👋 Hello, *${firstName}*!\n\nTo play Color Memory, please join our community group and channel first then /start again.`;
                
                const options = {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📢 Join Community Group', url: groupLink }],
                            [{ text: '📢 Join Channel', url: channelLink }]
                            // , [{ text: '✅ I Joined', url: `https://t.me/Momis_game_bot?start` }]
                            // ,[{ text: '✅ I Joined', callback_data: 'check_membership' }]
                        ]
                    }
                };
                
                return await bot.sendMessage(chatId, message, options);
            }


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
        bot.sendMessage(msg.chat.id, welcomeText, options);}
        catch (error) {
            logger.error(`Error in /start handler: ${error.message}`);
            await bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
        }
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
