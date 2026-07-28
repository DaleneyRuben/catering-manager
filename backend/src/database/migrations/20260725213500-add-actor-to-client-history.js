'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('client_history', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      field: 'userId',
    });
    await queryInterface.addColumn('client_history', 'username', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('client_history', 'username');
    await queryInterface.removeColumn('client_history', 'userId');
  },
};
