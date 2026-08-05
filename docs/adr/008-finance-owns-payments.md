# ADR 008 — `finance` Owns Payments, Even Though `subscription` Creates Them

**Date:** 2026-08-03
**Status:** Accepted
**Deciders:** Ruben Daleney

---

## Context

Finanzas records money in and money out. Money out is straightforward: an admin types an
Expense, and nothing else in the system has an opinion about it.

Money in is not. **All income is subscription revenue** — there is no one-off catering, no
extra-meal sales, no equipment resale, and therefore no manual income entry anywhere in the
product. Every boliviano that arrives does so because a client paid for a plan.

That means a Payment is only ever born in two places, both of which belong to `subscription`:

- `subscription/create.ts`, when a subscription is created already paid
- `subscription/mark-paid.ts`, when an Admin confirms payment on one created unpaid

Under [ADR-007](./007-domain-ownership.md), exactly one domain may write a table. So the
question is which domain owns `payments` when the only two writers live in another one.

A third option was available and is the one a reader is most likely to expect: **derive income
instead of storing it.** `Subscription.paid` already says the money arrived, and
`client_history` already records `plan_assigned` / `plan_renewed` / `plan_reactivated` with
`planPrice` and `discount` in its metadata and an `occurredAt` that — because unpaid
subscriptions defer their history entry until `markPaid` — is exactly the moment payment was
confirmed. A ledger could be projected from that with no new table at all.

## Decision

**A `finance` domain owns `payments`, `expenses` and `expense_categories`.** `subscription`
calls `finance.recordPayment(...)` inside its existing transaction, the same way it already
calls `client-history.record(...)` for the history entry it defers.

A Payment stores its own `amount` (`DECIMAL(10,2)`, matching `subscription.price`), its own
`paidAt`, its own `clientId`, and a **nullable** `subscriptionId` with `ON DELETE SET NULL`.

It exposes two write functions and no delete: `recordPayment`, and `adjustPayment` — called only
when a subscription's `price` is corrected, never from the Finanzas screen. Within one
subscription's life there is no legitimate reason for the price to change other than fixing a
mistake: a genuine renegotiation happens at the next renewal, which is a new subscription with its
own payment, and a plan change moves no money by rule. So a price edit is always a correction, and
the register must follow it rather than preserve a number the business never received. Nothing on
the Finanzas screen is editable; there are no adjustment or reversal rows.

## Considered options

**Derive income from subscriptions and history.** Rejected on two grounds, either sufficient:

1. **A plan change would rewrite the past.** Income computed by joining subscription → plan
   reads today's plan price. A client who switches from Ligero to Completo in September would
   retroactively change what July shows they paid. Cash basis requires the amount to be frozen
   at the moment money moved, which means storing it.
2. **`client_history` is incomplete as a ledger.** Rows written before the `dates_changed` split
   are `plan_assigned` entries carrying only dates, with no `planPrice` at all. A projection
   over them would be silently partial, and partial financial totals are worse than absent ones.

**`subscription` owns `payments`, a separate `expense` domain owns the rest.** Rejected because
the invariant that matters most here — _a Payment is immutable, and nothing that happens to a
subscription can unmake it_ — is a financial rule, not a subscription rule. `subscription`
already hard-deletes rows: `delete-upcoming-subscription.ts` destroys any renewal that has not
started yet, **without checking `paid`**, so an admin deleting a renewal a client already paid
for is reachable today. Making the domain that deletes subscriptions also the guardian of the
income those subscriptions produced puts both sides of that conflict in one place. It would
also grow `subscription`, already the largest domain in the codebase.

## Consequences

- **A payment outlives its subscription.** After `ON DELETE SET NULL`, the row still counts
  toward the month's income, attributed to the client but no longer to a plan. This is correct:
  the business takes no refunds, so deleting a renewal never means the money went back.
  `client_history` keeps the `renewal_deleted` entry, so the ledger holds the _what_ and history
  holds the _why_.
- **`markPaid` has no undo, and now it moves money.** Nothing in the codebase reverses
  `paid: true`. A mis-click has always activated a subscription early; it now also writes an
  income row that cannot be removed — its amount can be corrected, its existence cannot. Reversing it would mean un-deferring history, un-finalizing
  overlapped subscriptions and restoring pause state — deliberately left out of scope here.
- **Correcting a price can move a closed month's total.** A price fixed in October adjusts the
  payment it produced, wherever that payment sits. For a cash book kept by the owner this is the
  honest outcome — the alternative is a register that knowingly reports a figure nobody paid — but
  it would not be acceptable in filed accounts, and it is the reason `adjustPayment` exists rather
  than a general edit.
- **Totals are summed in SQL, never in JavaScript.** `pg` returns `DECIMAL` as a string (which is
  why `ActivePlanCard.tsx` already does `Number(sub.price)`). Aggregations use `SUM(amount)`
  in the query; mapping rows into JS numbers and reducing them reintroduces float error.
- **The register has no history before go-live.** No backfill migration exists, deliberately —
  see the reasoning recorded in `CONTEXT.md`. The first month understates income, because
  clients who paid before launch were already `paid: true` and generate no Payment.
