'use strict';

// Subscriptions are deleted permanently, never soft-deleted, so deletedAt has no reader left.
// The unpaid-uniqueness index predicated on it and has to be rebuilt without that term.
const INDEX_NAME = 'subscriptions_client_id_unpaid_unique';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex('subscriptions', INDEX_NAME);
    await queryInterface.removeColumn('subscriptions', 'deletedAt');
    await queryInterface.addIndex('subscriptions', {
      fields: ['clientId'],
      unique: true,
      where: { paid: false },
      name: INDEX_NAME,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('subscriptions', INDEX_NAME);
    await queryInterface.addColumn('subscriptions', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addIndex('subscriptions', {
      fields: ['clientId'],
      unique: true,
      where: { paid: false, deletedAt: null },
      name: INDEX_NAME,
    });
  },
};
