'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscriptions', 'renewalType', {
      type: Sequelize.ENUM('renewal', 'reactivation'),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('subscriptions', 'renewalType');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_subscriptions_renewalType";');
  },
};
