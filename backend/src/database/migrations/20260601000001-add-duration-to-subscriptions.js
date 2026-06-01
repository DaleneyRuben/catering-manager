'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscriptions', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 20,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('subscriptions', 'duration');
  },
};
