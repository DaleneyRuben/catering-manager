'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'clientId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'clientId',
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('appointments', 'clientId');
  },
};
