'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('client_history', 'occurredAt', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('client_history', 'occurredAt', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
