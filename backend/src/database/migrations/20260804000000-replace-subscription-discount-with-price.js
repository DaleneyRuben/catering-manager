'use strict';

// The subscription total was derived on read as `plan.price - discount`, which made the plan's
// current price retroactively rewrite what every existing client is shown to owe, and capped the
// total at the plan price — `discount` is unsigned, so no subscription could cost more than the
// plan it came from. A plan's price is quoted for 20 delivery days, and contracts are routinely
// negotiated longer, so that cap was unrepresentable business rather than a missing feature.
//
// Storing the agreed total on the subscription fixes both at once: the number is frozen at the
// moment it was agreed, and it is bounded only by zero. `discount` becomes a display value
// (`plan.price - subscription.price`), shown as "Descuento" when positive and "Recargo" when
// negative, so nothing is lost from the UI.
//
// The backfill is exact rather than approximate: `plan.price - discount` is precisely what the
// application displayed for every one of these rows the moment before this ran, so no client's
// total moves across the migration.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscriptions', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE subscriptions s
      SET "price" = GREATEST(p."price" - s."discount", 0)
      FROM plans p
      WHERE p.id = s."planId";
    `);

    // Any row whose plan has since been removed cannot be reconstructed from a join; it keeps the
    // only total still knowable about it, which is none. Zero is chosen over leaving the column
    // nullable so every later read can treat price as present.
    await queryInterface.sequelize.query(`
      UPDATE subscriptions SET "price" = 0 WHERE "price" IS NULL;
    `);

    await queryInterface.changeColumn('subscriptions', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.removeColumn('subscriptions', 'discount');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscriptions', 'discount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Lossy by nature, and deliberately so: a surcharge has no representation in the column being
    // restored, so any price above its plan's comes back as a zero discount — the same full-price
    // reading the old model would have given it.
    await queryInterface.sequelize.query(`
      UPDATE subscriptions s
      SET "discount" = GREATEST(ROUND(p."price" - s."price"), 0)
      FROM plans p
      WHERE p.id = s."planId";
    `);

    await queryInterface.removeColumn('subscriptions', 'price');
  },
};
