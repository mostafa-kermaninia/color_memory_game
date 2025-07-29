module.exports = {
  apps : [{
    name   : "memory-api",
    script : "./Server.js",
    env: {
      "NODE_ENV"             : "production",
      "PORT"                 : 10001,
      "BOT_TOKEN"            : "7589278133:AAE8fBGtWd7nXEuVjMfSlN5Kd865X15Gh8g",
      "JWT_SECRET"           : "d08f8623a9b7c5f4e2d1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d",
      "DB_URL"               : "mysql://colormemory_user:13831383@localhost:3306/colormemory_db"
    }
  }, {
    name   : "memory-bot",
    script : "./run-bot.js",
    env: {
      "NODE_ENV"             : "production",
      "BOT_TOKEN"            : "7589278133:AAE8fBGtWd7nXEuVjMfSlN5Kd865X15Gh8g"
    }
  }]
}
