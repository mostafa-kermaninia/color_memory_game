// gameEngine.js
const { Score } = require("./DataBase/models");
const logger = require("./logger");

const timePerRound = 1;
const gameSessions = {};
const endSessions = {};
const colors = ["green", "red", "yellow", "blue"];

// --- اضافه شدن منطق WebM ---
const { createCanvas } = require("canvas");

// تعریف رنگ‌ها و موقعیت‌ها
const padColors = {
  green: { normal: "#22c55e", lit: "#4ade80" },
  red: { normal: "#ef4444", lit: "#f87171" },
  yellow: { normal: "#facc15", lit: "#fde047" },
  blue: { normal: "#3b82f6", lit: "#60a5fa" },
};

const padLayout = {
  green: { x: 0, y: 0 },
  red: { x: 1, y: 0 },
  yellow: { x: 0, y: 1 },
  blue: { x: 1, y: 1 },
};

// تولید یک دنباله تصادفی از کلیدهای رنگی (مثلاً ['red', 'blue', 'green', 'yellow'])
const randomColorSequence = (length) => {
    return Array.from(
        { length },
        () => colors[Math.floor(Math.random() * colors.length)]
    );
};

// تابع جدید رسم فریم با استفاده از منطق WebM
function drawFrame(ctx, { width, height, litPad, playerTurn }) {
    const canvasSize = width;
    const padding = canvasSize * 0.08;
    const baseSize = canvasSize - padding * 2;
    const gap = baseSize * 0.05;
    const padSize = (baseSize - gap) / 2;

    // --- افزودن پس‌زمینه گرادیان ---
    // 1. گرادیان را ایجاد می‌کنیم.
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    // رنگ‌های گرادیان (gray-800 و gray-900) را تنظیم می‌کنیم.
    gradient.addColorStop(0, '#1f2937'); // gray-800
    gradient.addColorStop(1, '#111827'); // gray-900

    // 2. کل بوم را با گرادیان پر می‌کنیم.
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 3. حالا فیلتر را اعمال می‌کنیم و پدها را روی گرادیان می‌کشیم.
    ctx.filter = playerTurn ? "brightness(1)" : "brightness(0.6)";

    // --- بقیه کد شما بدون تغییر ---
    for (const color in padLayout) {
        const layout = padLayout[color];
        const colors = padColors[color];
        ctx.fillStyle = litPad === color ? colors.lit : colors.normal;

        const x = padding + layout.x * (padSize + gap);
        const y = padding + layout.y * (padSize + gap);

        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, padSize, padSize, [padSize * 0.15]);
        } else {
            ctx.rect(x, y, padSize, padSize);
        }
        ctx.fill();

        if (litPad === color) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
            ctx.shadowBlur = padSize * 0.2;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    ctx.filter = "none";
}
// --- پایان منطق WebM ---

// تابع تولید دنباله تصادفی
const generateRandomSequence = (length) => {
  return Array.from(
    { length },
    () => colors[Math.floor(Math.random() * colors.length)]
  );
};

// تابع مدیریت پایان بازی و ذخیره امتیاز
const handleGameOver = async (userId, eventId) => {
  if (!gameSessions[userId]) return;
  const userSession = gameSessions[userId];
  const score = userSession.level - 1;

  if (gameSessions[userId]) {
    delete gameSessions[userId];
    logger.info(`[gameOver] Cleared game session for user ${userId}.`);
  }

  logger.info(
    `[gameOver] Received score: ${score} for user: ${userId} in event: ${
      eventId || "Free Play"
    }`
  );

  if (typeof score !== "number" || score < 0) {
    logger.error(`Invalid score received for user ${userId}: ${score}`);
    throw new Error("Invalid score.");
  }

  await Score.create({
    score: score,
    userTelegramId: userId,
    eventId: eventId || null,
  });

  return score;
};

// کلاس مدیریت زمان بازی
class TimeManager {
  constructor() {
    this.players = {};
  }

  timeHandler(userId) {
    if (!this.players[userId]) return;
    console.log(`Time for user ${userId} has expired. Saving score...`);
    endSessions[userId] = { level: gameSessions[userId].level };
    handleGameOver(
      userId,
      this.players[userId].eventId ? this.players[userId].eventId : null
    );
    this.deletePlayer(userId);
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
        console.log(
          `Player ${userId} server-side timer expired. Triggering final save...`
        );
        this.timeHandler(userId);
        return;
      }

      player.timer = setTimeout(tick, 1000);
    };

    player.timer = setTimeout(tick, 1000);
  }

  stopTimer(userId) {
    if (this.players[userId]) {
      clearTimeout(this.players[userId].timer);
      this.players[userId].should_stop = true;
    }
  }

  addPlayer(userId, eventId) {
    logger.info(`Adding user: ${userId} Timer ${eventId}`);
    this.players[userId] = {
      eventId: eventId ? eventId : null,
      game_active: true,
      time_left: gameSessions[userId].level * timePerRound,
      should_stop: false,
      timer: null,
    };
  }

  updatePlayerTime(userId) {
    if (this.players[userId]) {
      clearTimeout(this.players[userId].timer);
      this.players[userId].time_left = gameSessions[userId].level * timePerRound;
    }
  }

  deletePlayer(userId) {
    if (this.players[userId]) {
      clearTimeout(this.players[userId].timer);
      delete this.players[userId];
    }
  }
}

const MainTimeManager = new TimeManager();

// خروجی ماژول برای استفاده در فایل‌های دیگر
module.exports = {
  gameSessions,
  endSessions,
  generateRandomSequence,
  handleGameOver,
  MainTimeManager,
  timePerRound,
  // ⭐️ اضافه شدن خروجی توابع WebM ⭐️
  randomColorSequence,
  drawFrame,
  padColors,
  padLayout,
  createCanvas,
};