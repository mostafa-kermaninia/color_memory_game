// backend/logger.js

// یک لاگر ساده که در کل پروژه قابل استفاده است
const logger = {
  info: (message, ...args) =>
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args),
  error: (message, ...args) =>
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args),
};

module.exports = logger;