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

The trade-off this creates: every place that lists "active clients" — the dashboard, Producción,
Entregas, chef reports, and the Clientes table itself — must filter on `paid = true`, not just
on the existing `deriveClientStatus` rules. This is a single predicate added at the query level
(alongside the existing active-subscription rule in
`services/subscription/find-active-subscriptions-for-date.ts` and equivalent Clientes queries),
not a new `ClientStatus` value threaded through `deriveClientStatus`, `find-all.ts`, and the
status UI constants. An unpaid client should never reach `deriveClientStatus` at all — it's
excluded upstream of it, and only ever surfaced through the Evaluaciones screen's own
"Pendientes de pago" query.
