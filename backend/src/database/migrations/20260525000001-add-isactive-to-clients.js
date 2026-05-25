'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.removeColumn('clients', 'isPaused');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'isPaused', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.removeColumn('clients', 'isActive');
  },
};
