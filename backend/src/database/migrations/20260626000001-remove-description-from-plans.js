'use strict';

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('plans');
    if (table.description) {
      await queryInterface.removeColumn('plans', 'description');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('plans', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
