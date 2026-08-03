'use strict';

// A pause applies to a plan, not to a person. Holding it on clients meant one flag spoke for
// every subscription a client had, so a "sin fecha" renewal took the plan still running off the
// delivery route with it. Moving the column scopes the pause to the plan it describes.
//
// The backfill attaches each existing pause to the subscription that describes the client today,
// mirroring getCurrentSubscription's rule (paid first, then the contract covering today, then the
// newest row) so the flag lands where the application would already have looked for it.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscriptions', 'pausedSince', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.sequelize.query(`
      UPDATE subscriptions s
      SET "pausedSince" = c."pausedSince"
      FROM clients c
      WHERE c."pausedSince" IS NOT NULL
        AND s.id = (
          SELECT s2.id FROM subscriptions s2
          WHERE s2."clientId" = c.id
          ORDER BY
            s2.paid DESC,
            (s2."finalizedAt" IS NULL
              AND s2."startDate" IS NOT NULL AND s2."startDate" <= CURRENT_DATE
              AND s2."contractEndDate" IS NOT NULL AND s2."contractEndDate" >= CURRENT_DATE) DESC,
            s2.id DESC
          LIMIT 1
        );
    `);

    await queryInterface.removeColumn('clients', 'pausedSince');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'pausedSince', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    // Collapsing back to one flag per client keeps the earliest pause among their subscriptions:
    // it is the one whose remaining-days calculation is still owed.
    await queryInterface.sequelize.query(`
      UPDATE clients c
      SET "pausedSince" = sub.paused
      FROM (
        SELECT "clientId", MIN("pausedSince") AS paused
        FROM subscriptions WHERE "pausedSince" IS NOT NULL GROUP BY "clientId"
      ) sub
      WHERE sub."clientId" = c.id;
    `);

    await queryInterface.removeColumn('subscriptions', 'pausedSince');
  },
};
