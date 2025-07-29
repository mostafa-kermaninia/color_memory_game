'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rewards', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      rewardLink: { type: Sequelize.STRING, allowNull: false },
      eventId: { type: Sequelize.UUID, allowNull: false },
      userTelegramId: {
        type: Sequelize.BIGINT, allowNull: false,
        references: { model: 'Users', key: 'telegramId' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
    await queryInterface.addIndex('Rewards', ['eventId', 'userTelegramId'], {
      unique: true,
      name: 'unique_reward_per_user_event'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Rewards');
  }
};
