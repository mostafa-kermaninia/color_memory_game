console.log("✅ Server.js file is starting to execute...");
require("dotenv").config();
const { isUserMember } = require("./bot");

const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const logger = require("./logger");
const validateTelegramData = require("./telegramAuth");
const { User, Score, sequelize } = require("./DataBase/models");

const app = express();
app.use(express.json());

const gameSessions = {};
const colors = ["green", "red", "yellow", "blue"];

const generateRandomSequence = (length) => {
    return Array.from({ length }, () => colors[Math.floor(Math.random() * colors.length)]);
};
// --- پیکربندی CORS (بدون تغییر) ---
const allowedOrigins = [
    "https://momis.studio",
    "https://www.momis.studio",
    "https://web.telegram.org",
    "https://memory.momis.studio", // <-- این خط اضافه شود
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));

// --- Middleware برای احراز هویت توکن (بدون تغییر) ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res
            .status(401)
            .json({ message: "Authentication token required" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.error(`JWT verification failed: ${err.message}`);
            return res
                .status(403)
                .json({ message: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
};


class TimeManager {
  constructor() {
    this.players = {}; 
  }

  timeHandler(userId) {
    console.log(`Time for user ${userId} has expired. Saving score...`);
    handleGameOver(userId);
  }

  runTimer(userId) {
    const player = this.players[userId];
    if (!player) return;

    player.should_stop = false;

    const tick = () => {
      if (!player || player.should_stop || !player.game_active) {
        return;
      }

      player.time_left -= 1;

      if (player.time_left < 0) {
        // به جای logger.info، از console.log برای نمایش پیام استفاده می‌کنیم.
        console.log(
          `Player ${playerId} server-side timer expired. Triggering final save...`
        );
        this.timeHandler(userId);
        return;
      }

      player.timer = setTimeout(tick, 1000);
    };

    player.timer = setTimeout(tick, 1000);
  }

  // می‌توانید متدهای دیگری مثل `addPlayer`، `startGame` و... را هم اضافه کنید.
  addPlayer(userId) {
    this.players[userId] = {
      game_active: true,
      time_left: gameSessions[userId].level * 2, // به عنوان مثال، 60 ثانیه زمان اولیه
      should_stop: false,
      timer: null
    };
  }

  updatePlayerTime(userId) {
    this.players[userId].time_left = gameSessions[userId].level * 2;
  }

  deletePlayer(userId){
    if (this.players[userId])
        delete this.players[userId];
  }
}

const handleGameOver = async (userId) => {
    if (!gameSessions[userId])
        return ;
    const userSession = gameSessions[userId];
    const score = userSession.level - 1;

    // --- حذف سشن بازی کاربر پس از پایان بازی ---
    if (gameSessions[userId]) {
        delete gameSessions[userId];
        logger.info(`[gameOver] Cleared game session for user ${userId}.`);
    }

    logger.info(
        `[gameOver] Received score: ${score} for user: ${userId} in event: ${
            eventId || "Free Play"
        }`
    );

    // اعتبار سنجی امتیاز
    if (typeof score !== "number" || score < 0) {
        logger.warn(`Invalid score received for user ${userId}: ${score}`);
        return res
            .status(400)
            .json({ status: "error", message: "Invalid score." });
    }

    await Score.create({
        score: score,
        userTelegramId: userId,
        // اگر eventId وجود نداشته باشد، null ذخیره می‌شود (بازی آزاد)
        eventId: eventId || null,
    });
}


app.post("/api/telegram-auth", async (req, res) => {
    // --- لاگ تشخیصی برای دیدن مبدا درخواست ---
    logger.info(`Auth request received from origin: ${req.headers.origin}`);
    logger.info("Request body:", JSON.stringify(req.body, null, 2));
    // --- پایان لاگ تشخیصی ---

    try {
        const { initData } = req.body;
        if (!initData)
            return res
                .status(400)
                .json({ valid: false, message: "initData is required" });

        const userData = validateTelegramData(initData);
        // --- بخش جدید: بررسی عضویت اجباری ---
        const isMember = await isUserMember(userData.id);
        if (!isMember) {
            logger.info(`Auth blocked for non-member user: ${userData.id}`);
            // کد 403 به معنی "دسترسی ممنوع" است
            return res.status(403).json({
                valid: false,
                message:
                    "To play the game, you must join our channel and group first.",
                membership_required: true, // یک فلگ برای فرانت‌اند تا پیام مناسب را نمایش دهد
            });
        }
        // --- پایان بخش بررسی عضویت ---

        const [user, created] = await User.findOrCreate({
            where: { telegramId: userData.id },
            defaults: {
                firstName: userData.first_name,
                lastName: userData.last_name || "",
                username: userData.username || "",
                photo_url: userData.photo_url || null,
            },
        });

        // اگر کاربر از قبل وجود داشت، اطلاعاتش را آپدیت می‌کنیم
        if (!created) {
            user.firstName = userData.first_name;
            user.lastName = userData.last_name || "";
            user.username = userData.username || "";
            user.photo_url = userData.photo_url || null;
            await user.save();
        }

        const token = jwt.sign(
            { userId: userData.id, ...userData },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        logger.info(`Auth successful for user: ${userData.id}`);
        res.json({ valid: true, user: userData, token });
    } catch (error) {
        logger.error(`Telegram auth error: ${error.message}`);
        res.status(401).json({
            valid: false,
            message: "Authentication failed",
        });
    }
});

app.post("/api/start-game", authenticateToken, (req, res) => {
    const userId = req.user.userId;
    logger.info(`[start-game] User ${userId} is starting a new game.`);

    // تنظیم سطح بازی روی ۱
    gameSessions[userId] = { level: 1 };

    // ایجاد یک دنباله کاملاً جدید به طول ۱
    const sequence = generateRandomSequence(1);

    res.json({ status: "success", sequence: sequence });
});

app.post("/api/next-level", authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const userSession = gameSessions[userId];

    if (!userSession) {
        logger.warn(`[next-level] No active game session found for user ${userId}.`);
        return res.status(404).json({ status: "error", message: "No active game found." });
    }

    // افزایش سطح بازیکن
    userSession.level += 1;
    const newLevel = userSession.level;

    // ایجاد یک دنباله کاملاً جدید و تصادفی به طول سطح جدید
    const newSequence = generateRandomSequence(newLevel);

    logger.info(`[next-level] User ${userId} advanced to level ${newLevel}.`);
    
    // ارسال دنباله جدید به کاربر
    res.json({ status: "success", sequence: newSequence });
});
app.post("/api/gameOver", authenticateToken, async (req, res) => {
    const { score1, eventId } = req.body;
    const userId = req.user.userId;

    try {
        handleGameOver(userId);

        logger.info(
            `Score ${score} saved for user ${userId} in event ${
                eventId || "Free Play"
            }`
        );
        res.status(201).json({
            status: "success",
            message: "Score saved successfully.",
        });
    } catch (error) {
        logger.error(
            `Failed to save score for user ${userId}: ${error.message}`
        );
        res.status(500).json({
            status: "error",
            message: "Could not save score due to a server error.",
        });
    }
});

app.get("/api/leaderboard", authenticateToken, async (req, res) => {
    try {
        // شناسه‌ی کاربر فعلی از توکن گرفته می‌شود
        const currentUserTelegramId = req.user.userId;
        const { eventId } = req.query;

        // ساخت شرط فیلتر، دقیقا مانند کد اصلی شما
        const whereCondition = {};
        if (eventId && eventId !== "null" && eventId !== "undefined") {
            whereCondition.eventId = eventId;
        } else {
            whereCondition.eventId = null;
        }
        logger.info(
            `Fetching leaderboard for user ${currentUserTelegramId} with condition:`,
            whereCondition
        );

        // مرحله ۱: بهترین امتیاز *تمام* کاربران را بر اساس شرط پیدا می‌کنیم (بدون limit)
        const allScores = await Score.findAll({
            where: whereCondition,
            attributes: [
                "userTelegramId",
                [sequelize.fn("MAX", sequelize.col("score")), "max_score"],
            ],
            group: ["userTelegramId"],
            order: [[sequelize.col("max_score"), "DESC"]], // مرتب‌سازی بر اساس بیشترین امتیاز
            raw: true,
        });

        // مرحله ۲: رتبه‌بندی را در سرور محاسبه می‌کنیم
        let rank = 0;
        let lastScore = Infinity;
        const allRanks = allScores.map((entry, index) => {
            if (entry.max_score < lastScore) {
                rank = index + 1; // رتبه برابر با جایگاه در آرایه مرتب‌شده است
                lastScore = entry.max_score;
            }
            return {
                userTelegramId: entry.userTelegramId,
                score: entry.max_score,
                rank: rank, // اضافه کردن رتبه به هر بازیکن
            };
        });

        // مرحله ۳: ۵ نفر برتر و کاربر فعلی را از لیست رتبه‌بندی شده جدا می‌کنیم
        const top5Players = allRanks.slice(0, 5);
        const currentUserData = allRanks.find(
            (p) => p.userTelegramId == currentUserTelegramId
        );

        // مرحله ۴: اطلاعات کامل (نام، عکس و...) را برای کاربران مورد نیاز می‌گیریم
        const userIdsToFetch = [
            ...new Set([
                // با Set از ارسال ID تکراری جلوگیری می‌کنیم
                ...top5Players.map((p) => p.userTelegramId),
                ...(currentUserData ? [currentUserData.userTelegramId] : []), // اگر کاربر فعلی رکوردی داشت، ID او را هم اضافه کن
            ]),
        ];

        const users = await User.findAll({
            where: { telegramId: userIdsToFetch },
            raw: true,
        });

        const userMap = users.reduce((map, user) => {
            map[user.telegramId] = user;
            return map;
        }, {});

        // تابع کمکی برای ترکیب اطلاعات کاربر با رتبه و امتیاز
        const formatPlayer = (playerData) => {
            if (!playerData) return null;
            const userProfile = userMap[playerData.userTelegramId];
            return {
                telegramId: userProfile?.telegramId,
                username: userProfile?.username,
                firstName: userProfile?.firstName,
                photo_url: userProfile?.photo_url,
                score: playerData.score,
                rank: playerData.rank,
            };
        };

        // مرحله ۵: ساخت آبجکت نهایی برای ارسال به فرانت‌اند
        res.json({
            status: "success",
            leaderboard: {
                top: top5Players.map(formatPlayer), // لیست ۵ نفر برتر
                currentUser: formatPlayer(currentUserData), // اطلاعات کاربر فعلی
            },
        });
    } catch (e) {
        logger.error(`Leaderboard error: ${e.message}`, { stack: e.stack });
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});

app.get("/api/events", (req, res) => {
    const activeEvents = [];
    if (process.env.ONTON_EVENT_UUID) {
        activeEvents.push({
            id: process.env.ONTON_EVENT_UUID,
            name: "Main Tournament",
            description: "Compete for the grand prize in the main event!",
        });
    }
    res.json({ status: "success", events: activeEvents });
});

/**
 * @route GET /api/avatar
 * @desc پراکسی برای تصاویر آواتار (بدون تغییر)
 */
app.get("/api/avatar", async (req, res) => {
    try {
        const externalUrl = req.query.url;
        if (!externalUrl || !externalUrl.startsWith("https://t.me/")) {
            return res.status(400).send("Invalid URL");
        }
        const response = await fetch(externalUrl);
        if (!response.ok) throw new Error("Failed to fetch image");

        res.setHeader("Content-Type", response.headers.get("content-type"));
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
        response.body.pipe(res);
    } catch (error) {
        logger.error(`Avatar proxy error: ${error.message}`);
        res.status(404).json({ message: "Avatar not found" });
    }
});

app.use(express.static(path.join(__dirname, "../frontend/build")));

// مدیریت روت اصلی با هدرهای ضد کش برای فایل index.html
app.get("*", (req, res) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

// --- راه‌اندازی سرور ---
const PORT = process.env.PORT || 10001;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});
