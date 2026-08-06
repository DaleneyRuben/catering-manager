'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        field: 'clientId',
      },
      // Nullable with ON DELETE SET NULL: subscription/delete-upcoming-subscription.ts hard-deletes
      // any renewal that hasn't started yet without checking `paid`, so a payment must be able to
      // outlive its subscription. The business takes no refunds, so it still counts toward income,
      // attributed to the client but no longer to a plan (see ADR-008).
      subscriptionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'subscriptions', key: 'id' },
        onDelete: 'SET NULL',
        field: 'subscriptionId',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      paidAt: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'paidAt',
      },
      // ON DELETE SET NULL, not the CASCADE used by login_events.userId: User is hard-deleted,
      // so a cascade here would erase a month of payments along with the admin who entered them.
      registeredBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        field: 'registeredBy',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'createdAt',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updatedAt',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
  },
};
