'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('clients');

    if (!table.deliveryZone) {
      await queryInterface.addColumn('clients', 'deliveryZone', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      });
      await queryInterface.sequelize.query(
        `UPDATE clients SET "deliveryZone" = zone`,
      );
    }

    if (table.zone) {
      await queryInterface.removeColumn('clients', 'zone');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'zone', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });
    await queryInterface.sequelize.query(
      `UPDATE clients SET zone = "deliveryZone"`,
    );
  },
};
