'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscriptions', 'suspendedDates', {
      type: Sequelize.ARRAY(Sequelize.DATEONLY),
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('subscriptions', 'suspendedDates');
  },
};
