'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'zone', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('clients', 'delivery', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.renameColumn('clients', 'allergies', 'restrictions');
    await queryInterface.addColumn('clients', 'nit', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('clients', 'businessName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('clients', 'isPaused', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'deliveryZone', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.removeColumn('clients', 'zone');
    await queryInterface.removeColumn('clients', 'delivery');
    await queryInterface.renameColumn('clients', 'restrictions', 'allergies');
    await queryInterface.removeColumn('clients', 'nit');
    await queryInterface.removeColumn('clients', 'businessName');
    await queryInterface.removeColumn('clients', 'isPaused');
  },
};
