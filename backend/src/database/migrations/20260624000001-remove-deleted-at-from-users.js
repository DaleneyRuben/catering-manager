'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('users', 'deletedAt');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },
};
