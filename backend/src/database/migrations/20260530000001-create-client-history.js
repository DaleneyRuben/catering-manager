'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('client_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onDelete: 'CASCADE',
        field: 'clientId',
      },
      eventType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'eventType',
      },
      occurredAt: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'occurredAt',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('client_history');
  },
};
