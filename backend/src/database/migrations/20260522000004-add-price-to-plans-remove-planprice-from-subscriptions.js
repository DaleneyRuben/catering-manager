'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('plans', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
    await queryInterface.addColumn('plans', 'discount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    });
    await queryInterface.removeColumn('subscriptions', 'planPrice');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('plans', 'price');
    await queryInterface.removeColumn('plans', 'discount');
    await queryInterface.addColumn('subscriptions', 'planPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  },
};
