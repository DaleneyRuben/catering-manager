'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menus', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
      },
      breakfast: { type: Sequelize.TEXT },
      morning_snack: { type: Sequelize.TEXT },
      salad: { type: Sequelize.TEXT },
      lunch: { type: Sequelize.TEXT },
      afternoon_snack: { type: Sequelize.TEXT },
      dinner: { type: Sequelize.TEXT },
      juice: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('menus');
  },
};
