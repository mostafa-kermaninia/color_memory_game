// server.js
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
const { sequelize2, user_db_sequelize } = require('./DataBase/database');
const db = require("./DataBase/models");
const { spawn } = require("node:child_process");
const ffmpegPath = require("ffmpeg-static") || "ffmpeg";

const {
  gameSessions,
  endSessions,
  generateRandomSequence,
  handleGameOver,
  MainTimeManager,
  timePerRound,
  randomColorSequence,
  drawFrame,
  padColors,
  padLayout,
  createCanvas,
} = require("./gameEngine");

const app = express();
app.use(express.json());

// --- پیکربندی CORS (بدون تغییر) ---
const allowedOrigins = [
  "https://momis.studio",
  "https://www.momis.studio",
  "https://web.telegram.org",
  "https://memory.momis.studio",
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
    return res.status(401).json({ message: "Authentication token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error(`JWT verification failed: ${err.message}`);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

async function getActiveReferredFriendsCount(currentUserId) {
    try {
        const [results] = await user_db_sequelize.query(`
            SELECT
                COUNT(DISTINCT u.telegramId) AS invited_num
            FROM
                momis_users.Users AS u
            WHERE
                u.referrerTelegramId = '180085203'
                AND (
                  EXISTS (
                      SELECT 1
                      FROM colormemory_db.Scores AS cs
                      WHERE cs.userTelegramId = u.telegramId
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM my_2048_db.Scores AS ms
                      WHERE ms.userTelegramId = u.telegramId
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM momisdb.scores AS mo_s
                      WHERE mo_s.userTelegramId = u.telegramId
                  )
                )
        `, {
            replacements: { currentUserId: currentUserId },
            type: user_db_sequelize.QueryTypes.SELECT,
        });
        console.log(results);
        const invitedNum = results.length > 0 ? results[0].invited_num : 0;

        console.log(
            `User ${currentUserId} has invited ${invitedNum} active friends across all games.`
        );
        return invitedNum;
    } catch (error) {
        console.error(
            `Error fetching active referred friends count for user ${currentUserId}:`,
            error
        );
        return 0;
    }
}
app.post("/api/telegram-auth", async (req, res) => {
  logger.info(`Auth request received from origin: ${req.headers.origin}`);
  logger.info("Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { initData } = req.body;
    if (!initData)
      return res
        .status(400)
        .json({ valid: false, message: "initData is required" });

    const userData = validateTelegramData(initData);

    const isMember = await isUserMember(userData.id);
    if (!isMember) {
      logger.info(`Auth blocked for non-member user: ${userData.id}`);
      return res.status(403).json({
        valid: false,
        message: "To play the game, you must join our channel and group first.",
        membership_required: true,
      });
    }

    const [user, created] = await db.User_Momis.findOrCreate({
      where: { telegramId: userData.id },
      defaults: {
        firstName: userData.first_name,
        lastName: userData.last_name || "",
        username: userData.username || "",
        photo_url: userData.photo_url || null,
      },
    });

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

// ⭐️ تغییر: endpoint شروع بازی برای ارسال آدرس WebM ⭐️
app.post("/api/start-game", authenticateToken, (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.userId;
  logger.info(`[start-game] User ${userId} is starting a new game.`);

  // تولید یک دنباله کاملاً جدید به طول ۱
  const sequence = generateRandomSequence(1);

  gameSessions[userId] = { level: 1, sequence: sequence, eventId: eventId };
  MainTimeManager.addPlayer(userId, eventId);

  // ارسال آدرس ویدیوی WebM به فرانت‌اند
  const videoUrl = `/sequence.webm?t=${new Date().getTime()}`;
  res.json({ status: "success", videoUrl: videoUrl, time: timePerRound });
});

app.post("/api/runTimer", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  MainTimeManager.runTimer(userId);
  logger.info(`[start-timer] User ${userId} is answering.`);

  res.json({
    status: "success",
    time: timePerRound * gameSessions[userId].level,
  });
});

// ⭐️ تغییر: endpoint ولیدیت حرکت برای ارسال آدرس WebM ⭐️
app.post("/api/validate-move", authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { playerSequence } = req.body;
  const userSession = gameSessions[userId];
  MainTimeManager.stopTimer(userId);

  if (!userSession || !Array.isArray(playerSequence)) {
    logger.error(`[validate-move] Invalid request for user ${userId}.`);
    return res
      .status(400)
      .json({ status: "error", message: "Invalid request." });
  }

  const correctSequence = userSession.sequence;
  const isCorrect =
    JSON.stringify(playerSequence) === JSON.stringify(correctSequence);

  if (isCorrect) {
    userSession.level += 1;
    const newSequence = generateRandomSequence(userSession.level);
    userSession.sequence = newSequence;
    MainTimeManager.updatePlayerTime(userId);

    logger.info(
      `[validate-move] User ${userId} CORRECT. New level: ${userSession.level}`
    );

    // ارسال آدرس ویدیوی WebM برای مرحله بعدی
    const videoUrl = `/sequence.webm?t=${new Date().getTime()}`;
    console.log(videoUrl);
    res.json({
      status: "success",
      action: "next_level",
      time: gameSessions[userId].level * timePerRound,
      videoUrl: videoUrl,
    });
  } else {
    logger.info(
      `[validate-move] User ${userId} FAILED. Expected ${correctSequence}, got ${playerSequence}`
    );
    MainTimeManager.deletePlayer(userId);

    const finalScore = userSession.level - 1;
    handleGameOver(userId, userSession.eventId);

    res.json({
      status: "success",
      action: "game_over",
      score: finalScore,
    });
  }
});

// ... (بقیه endpointها مانند قبل) ...
app.post("/api/gameOver", authenticateToken, async (req, res) => {
  const { score, eventId } = req.body;
  const userId = req.user.userId;

  try {
    if (typeof score !== "number" || score < 0) {
      logger.error(
        `Invalid score received in /api/gameOver for user ${userId}: ${score}`
      );
      return res
        .status(400)
        .json({ status: "error", message: "Invalid score." });
    }

    await Score.create({
      score: score,
      userTelegramId: userId,
      eventId: eventId || null,
    });

    logger.info(
      `Score ${score} saved successfully for user ${userId} via /api/gameOver.`
    );

    res.status(201).json({
      status: "success",
      message: "Score saved successfully.",
    });
  } catch (error) {
    logger.error(
      `Failed to save score for user ${userId} via /api/gameOver: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Could not save score due to a server error.",
    });
  }
});

app.post("/api/timeOut", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const score = gameSessions[user.userId]
      ? gameSessions[user.userId].level - 1
      : endSessions[user.userId].level - 1;

    MainTimeManager.timeHandler(user.userId);
    const result = {
      status: "game_over",
      score: score,
    };
    if (gameSessions[user.userId]) delete gameSessions[user.userId];
    if (endSessions[user.userId]) delete endSessions[user.userId];

    res.json(result);
  } catch (e) {
    logger.error(`API answer error: ${e.message}`, {
      stack: e.stack,
    });

    res.status(500).json({
      status: "error",
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        details: e.message,
      }),
    });
  }
});

app.get("/api/referral-leaderboard", async (req, res) => {
    logger.info("Fetching referral leaderboard...");
    try {
        const [results] = await user_db_sequelize.query(`
            SELECT
                u.firstName AS firstName,
                u.username AS username,
                COUNT(DISTINCT u2.telegramId) AS referral_count
            FROM momis_users.Users u2
            INNER JOIN momis_users.Users u ON u2.referrerTelegramId = u.telegramId
            WHERE
                u2.referrerTelegramId IS NOT NULL
                AND (
                    EXISTS (
                        SELECT 1
                        FROM colormemory_db.Scores AS cs
                        WHERE cs.userTelegramId = u2.telegramId
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM my_2048_db.Scores AS ms
                        WHERE ms.userTelegramId = u2.telegramId
                    )
                    OR EXISTS (
                        SELECT 1 
                        FROM momisdb.scores AS mo_s
                        WHERE mo_s.userTelegramId = u2.telegramId
                    )
                )
            GROUP BY u2.referrerTelegramId, u.firstName, u.username
            ORDER BY referral_count DESC
            LIMIT 3;
        `);

        res.status(200).json(results);
    } catch (error) {
        logger.error(`Referral leaderboard error: ${error.message}`, {
            stack: error.stack,
        });
        res.status(500).json({
            status: "error",
            message: "Internal server error on referral leaderboard",
        });
    }
});

app.get("/api/leaderboard", authenticateToken, async (req, res) => {
  try {
    const currentUserTelegramId = req.user.userId;
    const { eventId } = req.query;

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

    const allScores = await Score.findAll({
      where: whereCondition,
      attributes: [
        "userTelegramId",
        [sequelize.fn("MAX", sequelize.col("score")), "max_score"],
      ],
      group: ["userTelegramId"],
      order: [[sequelize.col("max_score"), "DESC"]],
      raw: true,
    });

    let rank = 0;
    let lastScore = Infinity;
    const allRanks = allScores.map((entry, index) => {
      if (entry.max_score < lastScore) {
        rank = index + 1;
        lastScore = entry.max_score;
      }
      return {
        userTelegramId: entry.userTelegramId,
        score: entry.max_score,
        rank: rank,
      };
    });

    const top5Players = allRanks.slice(0, 5);
    const currentUserData = allRanks.find(
      (p) => p.userTelegramId == currentUserTelegramId
    );

    const userIdsToFetch = [
      ...new Set([
        ...top5Players.map((p) => p.userTelegramId),
        ...(currentUserData ? [currentUserData.userTelegramId] : []),
      ]),
    ];

    const users = await db.User_Momis.findAll({
      where: { telegramId: userIdsToFetch },
      raw: true,
    });

    const userMap = users.reduce((map, user) => {
      map[user.telegramId] = user;
      return map;
    }, {});

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

    res.json({
      status: "success",
      leaderboard: {
        top: top5Players.map(formatPlayer),
        currentUser: formatPlayer(currentUserData),
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

app.get("/api/events", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const activeEvents = [];
  if (process.env.ONTON_EVENT_UUID) {
    activeEvents.push({
      id: process.env.ONTON_EVENT_UUID,
      name: "Main Tournament",
      description: "Compete for the grand prize in the main event!",
    });
  }
  const invitedNum = await getActiveReferredFriendsCount(userId);

    res.json({
        invitedNum: invitedNum,
        status: "success",
        events: activeEvents,
    });
});

app.get("/api/avatar", async (req, res) => {
  try {
    const externalUrl = req.query.url;
    if (!externalUrl || !externalUrl.startsWith("https://t.me/")) {
      return res.status(400).send("Invalid URL");
    }
    const response = await fetch(externalUrl);
    if (!response.ok) throw new Error("Failed to fetch image");

    res.setHeader("Content-Type", response.headers.get("content-type"));
    res.setHeader("Cache-Control", "public, max-age=86400");
    response.body.pipe(res);
  } catch (error) {
    logger.error(`Avatar proxy error: ${error.message}`);
    res.status(404).json({ message: "Avatar not found" });
  }
});

// این قسمت از کد شماست که تغییر یافته است
app.get("/sequence.webm", cors(), authenticateToken, async (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    console.log("Video endpoint hit for user:", req.user.userId);
    const userId = req.user.userId;
    const userSession = gameSessions[userId];

    if (!userSession || !userSession.sequence) {
        return res.status(404).send("Sequence not found");
    }

    const sequence = userSession.sequence;
    const canvasSize = Math.max(200, parseInt(req.query.size || "300", 10));
    const playerTurn = req.query.playerTurn !== "false";

    const width = canvasSize;
    const height = canvasSize;

    const TARGET_FPS = 10;
    const FRAME_DURATION_MS = 1000 / TARGET_FPS;

    const initialDelayFrames = Math.round(1000 / FRAME_DURATION_MS);
    const litDurationFrames = Math.round(400 / FRAME_DURATION_MS);
    const offDurationFrames = Math.round(200 / FRAME_DURATION_MS);

    const codec = (req.query.codec || "vp9").toLowerCase();

    const codecArgs =
        codec === "vp8"
            ? [
                  "-c:v", "libvpx",
                  "-deadline", "realtime",
                  "-cpu-used", "8",
                  "-pix_fmt", "yuv420p"
            ]
            : [
                  "-c:v", "libvpx-vp9",
                  "-row-mt", "1",
                  "-speed", "8",
                  "-tile-columns", "2",
                  "-pix_fmt", "yuv420p",  
                  "-auto-alt-ref", "1",
                  "-lag-in-frames", "25"
            ];

    const ff = spawn(ffmpegPath, [
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "image2pipe",
        "-framerate",
        String(TARGET_FPS),
        "-i",
        "pipe:0",
        ...codecArgs,
        "-b:v",
        "0",
        "-crf",
        "32",
        "-an",
        "-f",
        "webm",
        "pipe:1",
    ]);

    res.setHeader("Content-Type", "video/webm");
    res.setHeader("Cache-Control", "no-store");

    ff.stdout.pipe(res);

    const abort = () => {
        ff.kill("SIGKILL");
    };
    res.on("close", abort);
    res.on("error", abort);

    ff.on("error", (err) => {
        console.error("ffmpeg error:", err);
        if (!res.headersSent) res.status(500).end("ffmpeg error");
    });

    ff.on("close", (code) => {
        if (code !== 0) console.error("ffmpeg exited with code", code);
    });

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    try {
        // فریم‌های تأخیر اولیه
        for (let i = 0; i < initialDelayFrames; i++) {
            drawFrame(ctx, { width, height, litPad: null, playerTurn });
            const png = canvas.toBuffer("image/png");
            ff.stdin.write(png);
        }

        // تولید فریم‌ها برای نمایش توالی
        for (const litColor of sequence) {
            // فریم‌های پد روشن
            for (let i = 0; i < litDurationFrames; i++) {
                drawFrame(ctx, { width, height, litPad: litColor, playerTurn });
                const png = canvas.toBuffer("image/png");
                ff.stdin.write(png);
            }
            // فریم‌های پد خاموش (بین دو پد)
            for (let i = 0; i < offDurationFrames; i++) {
                drawFrame(ctx, { width, height, litPad: null, playerTurn });
                const png = canvas.toBuffer("image/png");
                ff.stdin.write(png);
            }
        }
        
        ff.stdin.end();
    } catch (e) {
        console.error("frame gen error:", e);
        ff.stdin.destroy(e);
    }
});

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.set({
    "Cache-Control":
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

const PORT = process.env.PORT || 10001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});