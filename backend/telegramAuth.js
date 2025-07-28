const { validate } = require("@telegram-apps/init-data-node"); // <-- از این پکیج جدید استفاده کنید

 function validateTelegramData(rawInitData) {
  try {
    // اعتبارسنجی داده‌ها
    validate(rawInitData, process.env.BOT_TOKEN);

    // استخراج پارامترها
    const initData = new URLSearchParams(rawInitData);
    const userJson = initData.get('user');
    
    if (!userJson) {
      throw new Error('User data not found in initData');
    }

    // تبدیل به شیء
    const userData = JSON.parse(userJson);

    // استخراج و بازگرداندن تمام فیلدهای ضروری
    return {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name || '',
      username: userData.username || '',
      language_code: userData.language_code || '',
      allows_write_to_pm: userData.allows_write_to_pm || false,
      photo_url: userData.photo_url || null // این خط حیاتی است
    };
    
  } catch (error) {
    console.error('Telegram data validation failed:', {
      error: error.message,
      rawInitData: rawInitData.substring(0, 50) + '...'
    });
    throw new Error('Authentication failed: ' + error.message);
  }
}

module.exports = validateTelegramData; // <-- به این صورت اکسپورت کنید
