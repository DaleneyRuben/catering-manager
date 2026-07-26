'use strict';

module.exports = {
  async up(queryInterface) {
    // Backstop for the resolveRenewal in-app check, which is a plain SELECT and can't
    // prevent two near-simultaneous requests from both passing it before either commits.
    await queryInterface.addIndex('subscriptions', {
      fields: ['clientId'],
      unique: true,
      where: { paid: false, deletedAt: null },
      name: 'subscriptions_client_id_unpaid_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('subscriptions', 'subscriptions_client_id_unpaid_unique');
  },
};
