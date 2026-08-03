'use strict';

// A cita the nutritionist has already resolved must never return to her queue. Her queue is
// "appointments with no subscriptionId", so SET NULL — the previous rule — put a resolved cita
// straight back into it whenever an admin deleted the renewal it had produced. CASCADE deletes the
// cita with the renewal instead.
//
// Nothing is lost by deleting it: her Historial joins the subscription row (required: true), so a
// cita whose subscription is gone had already dropped out of that view, and client_history keeps
// the appointment id in the plan_renewed metadata, so provenance survives the row.
//
// The unpaid path (discardPendingRenewal, deletePendingClient) already destroys the appointment
// explicitly before removing the subscription, so this changes nothing for it.

const CONSTRAINT = 'appointments_subscriptionId_fkey';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeConstraint('appointments', CONSTRAINT);
    await queryInterface.addConstraint('appointments', {
      fields: ['subscriptionId'],
      type: 'foreign key',
      name: CONSTRAINT,
      references: { table: 'subscriptions', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('appointments', CONSTRAINT);
    await queryInterface.addConstraint('appointments', {
      fields: ['subscriptionId'],
      type: 'foreign key',
      name: CONSTRAINT,
      references: { table: 'subscriptions', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};
