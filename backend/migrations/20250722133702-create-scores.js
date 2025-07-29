'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Scores', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      userTelegramId: {
        type: Sequelize.BIGINT, allowNull: false,
        references: { model: 'Users', key: 'telegramId' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      eventId: { type: Sequelize.UUID, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Scores');
  }
};
