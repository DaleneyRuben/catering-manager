'use strict';

// Six of the eleven event keys named only the verb (`paused`, `deleted`) while five named subject
// and verb (`plan_renewed`, `renewal_deleted`), so nothing in the key told you what a row was about.
// Every key is now <subject>_<verb>.
//
// Two keys also changed meaning rather than just shape. `plan_changed` fires on a discount change
// as well as a plan change — in practice almost always the discount, since that is the half with a
// button behind it — so it becomes `terms_changed`. `contract_updated` only ever records a move in
// the contract's dates, so it becomes `dates_changed`.
//
// `eventType` is a plain string column, not an enum, so each rename is one UPDATE and the whole
// migration reverses exactly.

const RENAMES = [
  ['reactivated', 'plan_reactivated'],
  ['paused', 'plan_paused'],
  ['resumed', 'plan_resumed'],
  ['finalized', 'plan_finalized'],
  ['suspended', 'days_suspended'],
  ['deleted', 'client_deleted'],
  ['contract_updated', 'dates_changed'],
  ['plan_changed', 'terms_changed'],
];

const rename = async (queryInterface, pairs) => {
  for (const [from, to] of pairs) {
    await queryInterface.sequelize.query(
      'UPDATE client_history SET "eventType" = :to WHERE "eventType" = :from',
      { replacements: { from, to } },
    );
  }
};

module.exports = {
  async up(queryInterface) {
    await rename(queryInterface, RENAMES);
  },

  async down(queryInterface) {
    await rename(
      queryInterface,
      RENAMES.map(([from, to]) => [to, from]),
    );
  },
};
