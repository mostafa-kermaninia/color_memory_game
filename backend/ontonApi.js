// backend/ontonApi.js

const fetch = require('node-fetch');
const logger = require('./logger');

const ONTON_API_BASE = 'https://app.onton.live/api/v1'; 
const API_KEY = process.env.ONTON_API_KEY ? process.env.ONTON_API_KEY.trim() : null;
const EVENT_UUID = process.env.ONTON_EVENT_UUID;

async function rewardUser(userTelegramId) {
    if (!API_KEY || !EVENT_UUID) {
        logger.error('ONTON_API_KEY or ONTON_EVENT_UUID is not set in .env file.');
        throw new Error('Server configuration error for ONTON API.');
    }

    const endpoint = `${ONTON_API_BASE}/reward`;
    
    // 1. ابتدا Body و Headers را تعریف می‌کنیم
    const body = {
        event_uuid: EVENT_UUID,
        reward_user_id: parseInt(userTelegramId, 10),
    };
    
    const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'api_key': API_KEY,
    };

    // 2. حالا که متغیرها تعریف شده‌اند، آن‌ها را لاگ می‌کنیم
    logger.info(`Sending reward request to ONTON. URL: ${endpoint}`);
    logger.info('DIAGNOSTIC: Sending request with these exact headers:', headers);
    logger.info('DIAGNOSTIC: Sending request with this exact body:', body);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers, // ارسال هدرهای تعریف شده
            body: JSON.stringify(body), // ارسال body تعریف شده
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const responseData = await response.json();
            
            logger.info('Full JSON response from ONTON:', responseData);

            
            if (!response.ok) {
                const errorMessage = responseData.error || responseData.message || 'Unknown ONTON API error';
                logger.error(`ONTON API Error (Status: ${response.status}): ${errorMessage}`, { body: responseData });
                throw new Error(errorMessage);
            }
            logger.info(`SUCCESS: Received JSON response from ONTON.`);
            return responseData;
        } else {
            const responseText = await response.text();
            logger.error(`ONTON returned a non-JSON response (Status: ${response.status}). Response text:`, responseText);
            throw new Error(`ONTON returned a non-JSON response. Status: ${response.status}`);
        }

    } catch (error) {
        logger.error(`Failed to communicate with ONTON API: ${error.toString()}`);
        throw error;
    }
}

module.exports = {
    rewardUser,
};