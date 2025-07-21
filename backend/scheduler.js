// backend/scheduler.js

const cron = require('node-cron');
const logger = require('./logger');
const { findAndRewardTopPlayers } = require('./reward-top-players');

logger.info('Scheduler initialized.'); 

// A list of all your events and their end times
const events = [
    {
        id: 'fd426c01-b8fd-4878-9b49-5b2435fb92aa', // Main Tournament
        endTime: '42 21 19 7 *' // 23:59 on July 20th
    }
];

// Loop through the events and schedule a task for each one
events.forEach(event => {
    if (cron.validate(event.endTime)) {
        cron.schedule(event.endTime, () => {
            logger.info(`Event ${event.id} has ended. Triggering reward script.`);
            findAndRewardTopPlayers(event.id);
        }, {
            scheduled: true,
            timezone: "Asia/Tehran"
        });
        logger.info(`Reward task for event ${event.id} has been scheduled to run at ${event.endTime}`);
    } else {
        logger.error(`Invalid cron time format for event ${event.id}: ${event.endTime}`);
    }
});