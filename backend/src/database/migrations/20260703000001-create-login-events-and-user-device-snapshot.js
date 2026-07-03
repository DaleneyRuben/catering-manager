'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('login_events', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        field: 'userId',
      },
      deviceType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'deviceType',
      },
      os: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      browser: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'userAgent',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'createdAt',
      },
    });
    await queryInterface.addColumn('users', 'lastDeviceType', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'lastOs', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'lastBrowser', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'lastBrowser');
    await queryInterface.removeColumn('users', 'lastOs');
    await queryInterface.removeColumn('users', 'lastDeviceType');
    await queryInterface.dropTable('login_events');
  },
};
