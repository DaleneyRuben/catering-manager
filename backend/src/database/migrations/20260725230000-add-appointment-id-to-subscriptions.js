'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscriptions', 'appointmentId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'appointmentId',
      references: { model: 'appointments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('subscriptions', 'appointmentId');
  },
};
