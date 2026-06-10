'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('clients');
    if (!tableDesc.pausedSince) {
      await queryInterface.addColumn('clients', 'pausedSince', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }

    // Migrate paused clients: use the latest 'paused' history event date when available,
    // fall back to NOW() so resume logic has a valid reference point.
    await queryInterface.sequelize.query(`
      UPDATE clients c
      SET "pausedSince" = COALESCE(
        (
          SELECT h."occurredAt"
          FROM client_history h
          WHERE h."clientId" = c.id
            AND h."eventType" = 'paused'
          ORDER BY h."occurredAt" DESC
          LIMIT 1
        ),
        NOW()
      )
      WHERE c."isActive" = false
        AND EXISTS (
          SELECT 1 FROM subscriptions s
          WHERE s."clientId" = c.id
            AND (s."contractEndDate" IS NULL OR s."contractEndDate" > CURRENT_DATE)
        )
    `);

    const desc = await queryInterface.describeTable('clients');
    if (desc.isActive) {
      await queryInterface.removeColumn('clients', 'isActive');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    // Restore isActive from pausedSince
    await queryInterface.sequelize.query(`
      UPDATE clients SET "isActive" = false WHERE "pausedSince" IS NOT NULL
    `);

    await queryInterface.removeColumn('clients', 'pausedSince');
  },
};
