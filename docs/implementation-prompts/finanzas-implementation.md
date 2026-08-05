# Implementation prompt: Finanzas

> Companion to [`finanzas.md`](../design-prompts/finanzas.md), which covers layout and copy. This is the work breakdown.

Implement in the catering-manager repo following `.claude/skills/project-standards/skill.md`: TDD (failing test first, always), one public function per file under `backend/src/domains/<domain>/`, feature-folder colocation on the frontend, no `../../` imports, no `import * as`, files under 400 lines, neutral Spanish copy, English identifiers. Read [`ADR-008`](../adr/008-finance-owns-payments.md), [`ADR-007`](../adr/007-domain-ownership.md), `CONTEXT.md` → "Finanzas" and [`domains.md`](../architecture/domains.md) before starting. Business logic may not be changed without asking the user.

**Prerequisites: the subscription price model (backlog 0) and the plan-change control must ship first** ([`plan-change-implementation.md`](./plan-change-implementation.md)). Until it does, admins simulate plan changes by finalizing and recreating a subscription, which produces two paid subscriptions for a client who paid once — and this register would count both.

## 1. Migrations and models

Three tables, all owned by a new `finance` domain.

- **`expense_categories`** — `name`, `active` (boolean, default true), timestamps. Seed the eight: Insumos, Personal, Transporte, Empaques, Servicios, Alquiler, Equipamiento, Otros. `Otros` seeded last; the list is otherwise ordered as written.
- **`expenses`** — `amount` `DECIMAL(10,2)` (must be > 0), `categoryId` FK, `spentAt` `DATEONLY`, `description` (nullable), `registeredBy` FK to `users`, timestamps, **`paranoid`** (soft delete, as `Client` already is).
- **`payments`** — `clientId` FK **not null**, `subscriptionId` FK **nullable with `ON DELETE SET NULL`**, `amount` `DECIMAL(10,2)`, `paidAt` `DATEONLY`, `registeredBy` FK to `users` **nullable with `ON DELETE SET NULL`**, timestamps. Not paranoid, never deleted.

`registeredBy` on both tables must be `ON DELETE SET NULL`, following `client_history.actorId` — **not** the `CASCADE` used by `login_events.userId`. `User` is hard-deleted (`domains/user/remove.ts` calls `destroy()` on a non-paranoid model), so a cascade there would erase a whole month of expenses and payments along with the admin who entered them.

Every query joining `Client` must pass `paranoid: false`, and no total may depend on a required join to it: `Client` is soft-deleted, so a default include would drop a deleted client's payments and quietly lower a closed month's Ingresos.

The `ON DELETE SET NULL` is the point of ADR-008, not an incidental choice: `subscription/delete-upcoming-subscription.ts` hard-deletes any renewal that hasn't started **without checking `paid`**, so a paid renewal can be destroyed today. The payment must survive it, attributed to the client.

Add the three rows to the ownership table in `docs/architecture/domains.md` in the same PR — that document says to.

## 2. `finance` domain

`backend/src/domains/finance/`, one public function per file, `index.ts` re-exporting them, `_helpers.ts` for anything shared. Every write function takes an optional `transaction` as its last parameter (ADR-007 rule 3).

- `record-payment.ts` → `recordPayment(data, actor, transaction?)`. The **only** way a payment is created.
- `adjust-payment.ts` → called only from `subscription/update.ts` when a subscription's `price` is corrected, so the register follows the correction (see ADR-008). No delete, and nothing on the Finanzas screen reaches either function — don't add a general edit "for symmetry".
- `create-expense.ts`, `update-expense.ts`, `delete-expense.ts`.
- `find-categories.ts`, `create-category.ts`, `deactivate-category.ts` — deactivate, never destroy, so historical totals don't move under a category that gets removed.
- `find-month-summary.ts` → the three totals plus the per-category breakdown for a month.
- `find-movements.ts` → payments and expenses for a month, merged and sorted by date descending.

**Totals are summed in SQL — `SUM(amount)` in the query — never by mapping rows into JS and reducing.** `pg` returns `DECIMAL` as a string (which is why `ActivePlanCard.tsx` does `Number(sub.plan.price)`), and JS float addition over a few hundred rows drifts.

## 3. Wire payments into the subscription workflow

Payments are born in exactly two places, both owned by `subscription`. Under ADR-007 rule 1, `subscription` calls the owner rather than writing the table:

- `subscription/create.ts` — when the subscription is created **paid**, in the same transaction and next to the existing `client-history` call.
- `subscription/mark-paid.ts` — when an unpaid one is confirmed, alongside the deferred history write.

Amount is the subscription's `price` — already the agreed total, stored on the row and frozen when it was agreed. Never recompute income from a join to `plans`: a plan's price edit would silently rewrite past months. `paidAt` is the day it happens. `registeredBy` is the acting `Actor`.

An unpaid subscription writes **no** payment — money hasn't arrived. That falls out of putting the call on the paid branch, but assert it in a test, because it's the one mistake that would quietly inflate every month.

## 4. Routes and permissions

`/api/finance/*`, gated to `ADMIN` and `SUPER_ADMIN`. Controllers import from the domain index only and never touch models.

Note the asymmetry worth a comment: an admin creates payments implicitly by marking a subscription paid in Evaluaciones, and reads them back here. There is no endpoint that creates a payment directly.

## 5. Frontend

`frontend/src/features/finance/` — hooks, components, types. The page is a thin orchestrator in `pages/FinancePage.tsx`. Sidebar entry under Administración, role-gated to admin/super_admin, following the existing nav pattern.

- The month selector's lower bound comes from the server, not a frontend constant — same principle as `weekStarts` in Producción, where the navigable window is server-owned.
- Money formatting is `toLocaleString('es-BO')`, as everywhere else in the app.
- All date math via `date-fns`.

## 6. Verification

Playwright, against the running app, before opening the PR:

1. Register an expense; confirm it appears in Movimientos and moves both Egresos and its category line.
2. Duplicate it; confirm the modal pre-fills and dates to today.
3. Edit it, then delete it; confirm the totals follow.
4. Mark a subscription paid from Evaluaciones; confirm an income row appears for the right client and the right amount, and that **Ingresos matches what the client's own detail page says they pay** — a cross-check against a second surface, not just the screen that wrote it.
5. Confirm an income row offers no edit or delete affordance.
6. Confirm a `kitchen`, `delivery` or `nutritionist` login sees no Finanzas item and gets rejected by the endpoints.
