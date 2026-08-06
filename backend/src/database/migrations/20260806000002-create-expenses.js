'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expenses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'expense_categories', key: 'id' },
        field: 'categoryId',
      },
      spentAt: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'spentAt',
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // ON DELETE SET NULL, not the CASCADE used by login_events.userId: User is hard-deleted
      // (domains/user/remove.ts calls destroy()), so a cascade here would erase a month of
      // expenses along with the admin who entered them.
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
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deletedAt',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('expenses');
  },
};
