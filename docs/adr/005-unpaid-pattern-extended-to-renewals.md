# Extend the unpaid-subscription pattern to nutritionist-driven renewals

Status: accepted

ADR-004 established that an unpaid client is a full Client + Subscription record filtered by
a `paid` flag, with `GET /clients/:id` returning 404 while `paid: false` and the `plan_assigned`
history event deferred until payment is confirmed. That decision assumed the unpaid subscription
was always a client's very first — created via Evaluaciones' new-client conversion, with nothing
pre-existing to protect.

Evaluaciones now also covers renewals/reactivations for existing clients (an Appointment can
link to a pre-existing Client, and the Nutricionista can renew/reactivate their plan with the
same paid/unpaid choice). This breaks three of ADR-004's assumptions:

1. **History deferral.** ADR-004 only deferred `plan_assigned`; `plan_renewed`/`reactivated`
   were always written immediately, because no renewal path had an unpaid state until now. We
   extend the same deferral to all three event types. Since the deferred write needs to know
   which event type to log and that's not otherwise recoverable later, `Subscription` gains a
   persisted `renewalType` (`renewal` | `reactivation` | `null`).

2. **The `GET /clients/:id` unpaid-block.** ADR-004 blocks the lookup whenever the client's
   latest subscription is unpaid, reasoning that an unpaid client "isn't real yet." That's false
   once the client already has prior (paid) subscriptions — blocking the lookup would 404 an
   established, previously-functioning client's entire detail page (pause, suspend, history)
   just because a renewal payment hasn't been confirmed. We narrow the block: it fires only
   when the unpaid subscription is the client's only subscription ever. An existing client stays
   fully reachable and manageable throughout a pending unpaid renewal.

3. **Unpaid-cleanup action.** ADR-004's only cleanup ("Pendientes de pago" → delete) soft-deletes
   the whole client, safe only because a brand-new unpaid client has nothing else attached. For
   an existing client's unpaid renewal, that same action would destroy a real client's history
   over an unconfirmed renewal payment. The cleanup action now branches: a still-unpaid
   **new-client appointment** keeps ADR-004's delete-the-client behavior unchanged; a
   still-unpaid **existing-client appointment**'s renewal instead deletes only the
   `Subscription` row it created and resets the Appointment back to pending — the Client and its
   other records are untouched.

   That subscription delete is **permanent**: `Subscription` is not paranoid. A row is only ever
   deleted when it should never have existed, so keeping a tombstone buys nothing, and
   `client/find-all.ts` counts subscriptions through raw subqueries that no `deletedAt` scope
   would apply to — a soft-deleted row would keep being counted as a live plan there.
