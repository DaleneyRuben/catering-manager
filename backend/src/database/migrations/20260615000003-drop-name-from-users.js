'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('users', 'name');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });
  },
};
