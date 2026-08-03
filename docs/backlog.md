# Backlog — Plan change and Finanzas

Tracks one body of work: the plan-change control, and the Finanzas register it unblocks. The
design behind it is in [CONTEXT.md](../CONTEXT.md), [business-rules.md](./business-rules.md)
(Change of plan) and [ADR-008](./adr/008-finance-owns-payments.md).

**This file is deleted when its last item lands.** A previous backlog tracked the
domain-ownership work (#115–#141) and was removed the same way — a backlog that outlives its
work becomes fiction, and anything worth keeping belongs in the documents above, not here.

Order matters: **Finanzas cannot ship before the plan-change control.** Until it exists, admins
simulate a plan change by finalizing the plan and creating a new one, which would record two paid
subscriptions for a client who paid once, and double-count their payment in the register.

---

## 1. Plan change control

Replaces the finalize-and-recreate workaround. Backend already accepts a new `planId` on an
existing subscription and writes `terms_changed`; the gap is the UI.

| #   | Item                                                                                    | Status |
| --- | --------------------------------------------------------------------------------------- | ------ |
| 1.1 | Design signed off — business rule written into `business-rules.md` (Change of plan)     | ✅     |
| 1.2 | Plan selector + duration in `ActivePlanCard`'s edit mode, sending `planId` on the PATCH | ⬜     |
| 1.3 | End-to-end verification via Playwright; workaround retired                              | ⬜     |

Prompts: [design](./design-prompts/plan-change.md) ·
[implementation](./implementation-prompts/plan-change-implementation.md).

Resolved: the admin enters the **total** duration, not remaining days — `duración` already means
total plan length in the wizard, `RenewalModal` and reactivation, and a second meaning for the word
would appear only on the screen where a contract gets shortened. The card shows
`Vence el {fecha} · {n} días restantes` live instead, so the number being negotiated is on screen
without changing what the field means.

## 2. Finanzas

`finance` domain owning `payments`, `expenses`, `expense_categories`. One screen: month selector,
Ingresos / Egresos / Balance tiles, expenses by category, one chronological list of movements,
"Registrar gasto". Admin + super_admin.

Prompts: [design](./design-prompts/finanzas.md) ·
[implementation](./implementation-prompts/finanzas-implementation.md).

| #   | Item                                                                                        | Status |
| --- | ------------------------------------------------------------------------------------------- | ------ |
| 2.1 | Design signed off — ADR-008 and the Finanzas section of `CONTEXT.md`                        | ✅     |
| 2.2 | Migrations: `payments`, `expenses`, `expense_categories` (seeded with the eight categories) | ⬜     |
| 2.3 | `finance` domain — `recordPayment`, expense CRUD, category CRUD, monthly aggregates         | ⬜     |
| 2.4 | `subscription.create` (paid) and `subscription.markPaid` call `finance.recordPayment`       | ⬜     |
| 2.5 | Finanzas screen + sidebar entry under Administración                                        | ⬜     |
| 2.6 | Duplicate-an-expense action — the primary entry path, since delivery is paid daily          | ⬜     |

---

## Known limitations, accepted

- **`markPaid` has no undo.** Nothing reverses `paid: true`. Once it also writes a Payment, a
  mis-click puts permanent income in the register. Reversing it means un-deferring history,
  un-finalizing overlapped subscriptions and restoring pause state — out of scope, and it needs
  its own design conversation before anyone attempts it.
- **The first month understates income.** No backfill: clients who paid before go-live are
  already `paid: true` and generate no Payment. Corrects itself as renewals come through.

## Not in scope

Recorded so they are not re-proposed. Full reasoning in `CONTEXT.md`.

- Partial payments and outstanding balances, on either side of the register
- Automatic/recurring expense generation
- Per-client expense tagging and client profitability reporting
- Payment method (efectivo/transferencia) on an expense
- Manual income entry — all income is subscription revenue
- Converting `Subscription.discount` from `INTEGER` to `DECIMAL(10,2)`, so cents work the same
  way everywhere. A real inconsistency, but it touches every subscription and every price
  calculation, for a problem that has never occurred.
