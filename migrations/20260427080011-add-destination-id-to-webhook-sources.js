'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('WebhookSources', 'destinationId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Destinations', // Nama tabel tujuan
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('WebhookSources', 'destinationId');
  }
};