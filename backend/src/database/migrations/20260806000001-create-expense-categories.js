'use strict';

// Deactivate, never destroy: a category still referenced by past expenses must not disappear
// out from under those historical totals (see ADR-008 / finanzas implementation prompt).
const CATEGORIES = [
  'Insumos',
  'Personal',
  'Transporte',
  'Empaques',
  'Servicios',
  'Alquiler',
  'Equipamiento',
  'Otros',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expense_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    const now = new Date();
    await queryInterface.bulkInsert(
      'expense_categories',
      CATEGORIES.map((name) => ({ name, active: true, createdAt: now, updatedAt: now }))
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('expense_categories');
  },
};
