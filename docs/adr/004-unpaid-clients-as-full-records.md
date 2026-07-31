# Unpaid clients are full Client + Subscription records, filtered by a `paid` flag

When a Nutricionista converts an Appointment for a client who hasn't paid yet, we create a
complete Client + Subscription record immediately — same wizard, same fields, same history
events as a normal client creation — with the subscription's `paid` flag set to `false`,
rather than storing a lightweight draft/staging entity that only becomes a real Client once
payment is confirmed.

We chose this because the alternative (a separate "pending client" entity) would duplicate
the entire client/subscription schema and the wizard's validation, plan-pricing, and
history-recording logic a second time, only to migrate that data into a real Client later. The
full-record approach reuses 100% of the existing creation path unchanged.

This means an unpaid client's row is fully queryable by id the instant it's created, which
raises an obvious question: does `GET /api/clients/:id` (and the client detail page — pause,
renew, suspend, history) work on it? We decided no — that lookup requires `paid = true` too,
returning 404 otherwise, identical to a nonexistent client. The alternative (leave the
single-record lookup unguarded, only filter list/aggregate queries) would mean an unpaid client
is fully operable through a side door — pausable, renewable, suspendable — while nominally "not
existing yet" everywhere else. Blocking it keeps the invariant simple: until an Admin confirms
payment, the only surface that can touch this record at all is Evaluaciones' own
"Pendientes de pago" card (mark paid / delete).

The trade-off this creates: every place that lists "active clients" — the dashboard, Producción,
Entregas, chef reports, and the Clientes table itself — must filter on `paid = true`, not just
on the existing `deriveClientStatus` rules. This is a single predicate added at the query level
(alongside the existing active-subscription rule in
`domains/subscription/find-active-subscriptions-for-date.ts` and equivalent Clientes queries),
not a new `ClientStatus` value threaded through `deriveClientStatus`, `find-all.ts`, and the
status UI constants. An unpaid client should never reach `deriveClientStatus` at all — it's
excluded upstream of it, and only ever surfaced through the Evaluaciones screen's own
"Pendientes de pago" query.
