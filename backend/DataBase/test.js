// Import sequelize instance and models from the central db object
const { sequelize, User, Score, Reward } = require('./models'); // Path to models/index.js

// --- User Functions ---
async function createUser({ telegramId, username, firstName, lastName }) {
  try {
    // Find an existing user or create a new one if not found
    const [user, created] = await User.findOrCreate({
      where: { telegramId: telegramId },
      defaults: {
        username: username,
        firstName: firstName,
        lastName: lastName,
      },
    });

    if (created) {
      console.log('User created:', user.toJSON());
    } else {
      console.log('User found:', user.toJSON());
      // Optionally update user details if found and changed
      user.username = username === undefined ? user.username : username;
      user.firstName = firstName === undefined ? user.firstName : firstName;
      user.lastName = lastName === undefined ? user.lastName : lastName;
      if (user.changed()) { // Only save if there were actual changes
        await user.save();
        console.log('User details updated:', user.toJSON());
      }
    }
    return user;
  } catch (error) {
    console.error(`Error creating/finding user with telegramId ${telegramId}:`, error.message);
    return null;
  }
}

// --- Score Functions ---
async function addScoreToUser(userTelegramId, scoreValue) {
  try {
    // Find the user by their primary key (telegramId)
    const user = await User.findByPk(userTelegramId);

    if (!user) {
      console.log(`Cannot find user with telegramId: ${userTelegramId} to add score.`);
      return null;
    }

    // Create a new score record associated with the user
    const newScore = await Score.create({
      score: scoreValue,
      userTelegramId: user.telegramId, // Set the foreign key
    });

    console.log(`Score ${scoreValue} for user ${user.firstName || user.telegramId} (ID: ${user.telegramId}) added:`, newScore.toJSON());
    return newScore;
  } catch (error) {
    console.error(`Error adding score for user telegramId ${userTelegramId}:`, error.message);
    return null;
  }
}

async function getUserScores(userTelegramId) {
  try {
    // Find the user by their primary key
    const user = await User.findByPk(userTelegramId);

    if (!user) {
      console.log(`Cannot find user with telegramId: ${userTelegramId} to get scores.`);
      return null;
    }

    // Use the association method (e.g., user.getScores()) to get related scores
    // This method is available because of User.hasMany(Score, { as: 'Scores' })
    const scores = await user.getScores(); // Uses the 'Scores' alias

    if (scores && scores.length > 0) {
      console.log(`Scores for user ${user.firstName || user.telegramId} (ID: ${user.telegramId}):`);
      scores.forEach(s => console.log(s.toJSON()));
      return scores;
    } else {
      console.log(`No scores found for user ${user.firstName || user.telegramId} (ID: ${user.telegramId}).`);
      return [];
    }
  } catch (error) {
    console.error(`Error getting scores for user telegramId ${userTelegramId}:`, error.message);
    // Log stack trace for better debugging of association errors
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    return null;
  }
}

// --- Reward Functions (Commented out for now, can be enabled for testing Rewards) ---
/*
async function addRewardToUser(userTelegramId, rewardType, rewardValue) {
  try {
    const user = await User.findByPk(userTelegramId);

    if (!user) {
      console.log(`Cannot find user with telegramId: ${userTelegramId} to add reward.`);
      return null;
    }

    const newReward = await Reward.create({
      reward_type: rewardType,
      reward_value: rewardValue,
      userTelegramId: user.telegramId,
    });

    console.log(`Reward '${rewardType}' (Value: ${rewardValue}) for user ${user.firstName || user.telegramId} (ID: ${user.telegramId}) added:`, newReward.toJSON());
    return newReward;
  } catch (error) {
    console.error(`Error adding reward for user telegramId ${userTelegramId}:`, error.message);
    return null;
  }
}

async function getUserRewards(userTelegramId) {
  try {
    const user = await User.findByPk(userTelegramId);
     if (!user) {
      console.log(`Cannot find user with telegramId: ${userTelegramId} to get rewards.`);
      return null;
    }
    // Uses the 'Rewards' alias from User.hasMany(Reward, { as: 'Rewards' })
    const rewards = await user.getRewards();

    if (rewards && rewards.length > 0) {
        console.log(`Rewards for user ${user.firstName || user.telegramId} (ID: ${user.telegramId}):`);
        rewards.forEach(r => console.log(r.toJSON()));
        return rewards;
    } else {
        console.log(`No rewards found for user ${user.firstName || user.telegramId} (ID: ${user.telegramId}).`);
        return [];
    }
  } catch (error) {
    console.error(`Error getting rewards for user telegramId ${userTelegramId}:`, error.message);
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    return null;
  }
}
*/

// --- Main Test Execution Function ---
async function runTests() {
  try {
    // Synchronize the database: drop all tables and recreate them.
    // This ensures a clean state for each test run.
    // sequelize.sync knows about all models (User, Score, Reward) and their associations
    // because they are all managed through the 'db' object imported from models/index.js.
    await sequelize.sync({ force: true });
    console.log("Database synchronized successfully (tables dropped and recreated).");
    console.log("------------------------------------");

    // Test user creation
    const userMammad = await createUser({
      telegramId: 123456789,
      username: "mammad_tg",
      firstName: "Mammad",
      lastName: "Mammadian"
    });

    const userAli = await createUser({
      telegramId: 987654321,
      username: "ali_tg",
      firstName: "Ali",
      lastName: "Alivian"
    });

    const userAaaaa = await createUser({
      telegramId: 111111111,
      firstName: "Aaaaa", // No username or lastName for this user
    });
    console.log("------------------------------------");

    // Test adding scores to users
    if (userMammad) {
      await addScoreToUser(userMammad.telegramId, 125);
      await addScoreToUser(userMammad.telegramId, 1258);
    }
    if (userAli) {
      await addScoreToUser(userAli.telegramId, 864);
    }
     if (userAaaaa) {
      await addScoreToUser(userAaaaa.telegramId, 68);
    }
    console.log("------------------------------------");

    // Test retrieving scores for users
    if (userMammad) {
      await getUserScores(userMammad.telegramId);
    }
    if (userAli) {
      await getUserScores(userAli.telegramId);
    }
    if (userAaaaa) {
      await getUserScores(userAaaaa.telegramId);
    }
    console.log("------------------------------------");

    // --- Reward Test Calls (Commented out, enable if needed) ---
    /*
    if (userMammad) {
      await addRewardToUser(userMammad.telegramId, "Coin", "100");
    }
     if (userAli) {
      await addRewardToUser(userAli.telegramId, "Coin", "50");
    }
    console.log("------------------------------------");

    if (userMammad) {
      await getUserRewards(userMammad.telegramId);
    }
    if (userAli) {
      await getUserRewards(userAli.telegramId);
    }
    console.log("------------------------------------");
    */

  } catch (error) {
    // Log detailed error information
    const errorMessage = error.original && error.original.sqlMessage ? error.original.sqlMessage : error.message;
    console.error("An error occurred during the test run:", errorMessage);
    if (error.original && error.original.sql) {
        console.error("Offending SQL:", error.original.sql);
    }
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
  } finally {
    // Ensure the database connection is closed after tests
    await sequelize.close();
    console.log("Database connection closed.");
  }
}

// Run the test function
runTests();