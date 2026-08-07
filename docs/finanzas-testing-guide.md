# Testing Guide — Finanzas

**Who this is for:** someone testing the Finanzas screen who has never seen it before. No prior
knowledge of the codebase is assumed. Read section 1 first — three rules there explain almost every
surprise this screen produces, and without them you will file bugs that are actually design.

**What you need:** a running instance (backend on :4000, frontend on :3000, local Postgres), and an
`admin` or `super_admin` login. The screen lives at `/finanzas`, in the sidebar under
**Administración**.

Reference material, if you want the reasoning behind a rule:
[ADR-008](./adr/008-finance-owns-payments.md) · [design](./design-prompts/finanzas.md) ·
[business-rules.md](./business-rules.md).

---

## 1. What this screen is — and the three rules

Finanzas is a **cash register**: money in, money out, one month at a time. It is deliberately not
an accounting system, an invoicing tool, or a profit-and-loss report.

Three rules drive nearly all of its behaviour. If something looks wrong, check these first.

### Rule 1 — Income is never entered by hand

There is a **"Registrar gasto"** button and there is **no "Registrar ingreso" button**. That
asymmetry is correct and intentional.

Every income row is created automatically when an admin marks a client's subscription as **paid**.
All income in this business is subscription revenue, so there is nothing else it could be. If you
want an income row to appear for testing, you must go and mark a subscription paid — see §3.

**This also means income rows cannot be edited or deleted.** They carry no edit or delete button at
all, not even a greyed-out one. That is a deliberate choice: offering a disabled control only
invites the question of how to enable it.

### Rule 2 — A movement is dated the day the money moved

This is called _cash basis_. A payment is dated the day it was received; an expense is dated the
day it was paid. Neither is dated the period it relates to.

Consequence: an expense **cannot** be dated in the future — money that has not moved yet is not a
movement. Backdating _is_ allowed, because the daily delivery payment often gets entered a day or
two late.

### Rule 3 — Nothing here tracks debt

No "pendiente", no "saldo", no overdue anything, on either side. The register records money that
moved. If you see any wording implying someone owes something, that _is_ a bug worth reporting.

---

## 2. Reading the screen

| Element                  | What it shows                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Month selector**       | Top left. Arrows page backwards and forwards; everything below is scoped to the chosen month.                                                                                                         |
| **Ingresos**             | Total money received this month, and how many payments make it up.                                                                                                                                    |
| **Egresos**              | Total money spent this month, and how many expenses make it up.                                                                                                                                       |
| **Balance**              | Ingresos − Egresos. Carries a sign, and takes its colour from that sign — olive when positive, terracotta when negative. Wider than the other two on purpose: it is the number people look for first. |
| **Gastos por categoría** | Expense totals per category, biggest first, with a proportion bar. Categories with nothing spent are omitted entirely, not shown as zero.                                                             |
| **Movimientos**          | One chronological list, newest first, with income and expenses **interleaved** — not two tabs. Splitting them would make the reader do the balance arithmetic themselves.                             |

Amounts display in Bolivian format (`34.800` — dot as thousands separator) and are **rounded to
whole bolivianos**. Cents are stored but not shown here, so an expense of 120.50 displays as `121`.
That is expected.

---

## 3. Setting up test data

Expenses you can create directly on the screen. **Income you cannot** — you have to produce it
elsewhere. Two ways:

**Option A — create a client who pays immediately.** Clientes → Agregar cliente → complete the
wizard, choosing a plan and a price. This writes one payment for the agreed price, dated today.

**Option B — mark an existing unpaid subscription paid.** Evaluaciones → find a resolution under
"Pendientes de pago" → mark it paid, confirming in the dialog. This writes the payment at the
moment of confirmation.

> **Watch out:** in Option B the confirmation dialog is easy to miss. Clicking the initial action
> opens a dialog with a **"Confirmar pago"** button; nothing is written until you click that. If no
> income row appears, this is the first thing to check.

Remember what you create — §9 covers cleaning up.

---

## 4. Core scenarios

Work through these in order; several build on the previous one.

### 4.1 Register an expense

1. Click **Registrar gasto**.
2. Confirm focus has landed in the **Monto** field already, without you clicking it.
3. Type `180`. Choose category **Transporte**. Leave the date as today. Type a description.
4. Click **Registrar**.

**Expect:** the modal closes, a success toast appears, and _four things move together_:
Egresos increases by 180; the count reads "1 gasto"; Balance drops by 180; a new row appears at the
top of Movimientos showing today's date, `Transporte`, a `Gasto` tag, your description, and `−180`
in terracotta. A `Transporte` line appears in Gastos por categoría.

**Why this matters:** the four figures are computed from the same data by different code paths. If
one moves and another doesn't, that's a real bug.

### 4.2 The form is built for speed

This form is filled in **every single day** — delivery is paid daily and is the highest-frequency
record in the system. So:

- Focus lands on Monto automatically (§4.1 step 2).
- Pressing **Enter** submits, without reaching for the mouse.
- The category **remembers the last one you used** — register a Transporte expense, then open the
  form again, and Transporte should be pre-selected.

### 4.3 Edit an expense

1. Hover the expense row. Three buttons appear: **Editar**, **Duplicar**, **Eliminar**.
2. Click **Editar**.

**Expect:** the modal is titled **"Editar gasto"**, pre-filled with that expense's amount,
category, date _and_ description. Change the amount to `250` and save — Egresos, Balance, the
category line and the row all follow.

### 4.4 Duplicate an expense

This is the primary path for the daily delivery payment and for rent instalments, which is why it
sits on the row rather than hidden in a menu.

1. First create an expense dated a **few days ago** (backdate it) so this test means something.
2. Hover that row and click **Duplicar**.

**Expect:**

- The modal is titled **"Registrar gasto"** — _not_ "Editar gasto". A duplicate creates a new
  expense; it never modifies the one you copied from.
- Amount, category and description are carried across.
- **The date is today, not the original's date.** This is the whole point of the feature.
- After confirming, there are now **two** rows. The original still sits at its own date, unchanged.

**Why this matters:** if duplicating ever edits the original instead of creating a copy, a month's
totals silently lose a day's delivery payment.

### 4.5 Delete an expense

1. Click **Eliminar** on a row.

**Expect:** a confirmation dialog first — never a one-click delete — summarising the expense and
warning "Los totales del mes se recalculan." Confirm, and the row, its category line and its
contribution to Egresos and Balance all disappear.

### 4.6 Income rows have no actions

Hover an income row (one with a `Suscripción` tag).

**Expect:** **no buttons appear at all.** Not greyed out — absent. See Rule 1.

---

## 5. Validation and edge cases

| #   | Try this                                                   | Expect                                                                                                                                                                               |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | Open the form and click Registrar without typing an amount | Button is disabled                                                                                                                                                                   |
| 5.2 | Enter amount `0`                                           | Button stays disabled                                                                                                                                                                |
| 5.3 | Enter a negative amount                                    | Cannot be typed — the field strips anything that isn't a digit or a decimal point                                                                                                    |
| 5.4 | Open the date picker and try to choose tomorrow            | Not selectable (the field caps at today). See Rule 2                                                                                                                                 |
| 5.5 | Backdate to last week                                      | Accepted. If it falls in a previous month, it appears in _that_ month, not this one                                                                                                  |
| 5.6 | Leave the description empty                                | Accepted — it is optional                                                                                                                                                            |
| 5.7 | Page to a month with nothing in it                         | Movimientos reads "Aún no hay movimientos" with an explanatory line; Gastos por categoría reads "Todavía no hay gastos este mes." Neither should look like an error                  |
| 5.8 | Page backwards repeatedly                                  | The back arrow **disables** at the earliest month that has any data, with a tooltip naming that month. There is no data before then and no backfill, so empty months are not offered |
| 5.9 | Try to page forward past the current month                 | Forward arrow is disabled — no future month has moved any money                                                                                                                      |

---

## 6. Money-accuracy checks

These are the tests that actually matter. A cosmetic bug is annoying; a wrong total is the whole
product failing.

### 6.1 Ingresos agrees with what the client pays

1. Note a client's name on an income row and the amount beside it.
2. Open that client: Clientes → search → their row → **Plan + facturación** tab.

**Expect:** the **Total** on their page equals the income row's amount. Two different screens,
computed from the same stored figure by different queries — they must agree.

### 6.2 Correcting a client's price moves the payment

A price edit on a subscription is always a _correction_ — a genuine renegotiation happens at the
next renewal — so the register follows it.

1. Find a client with an income row this month. Open **Plan + facturación** → **Plan y precio** →
   **Editar**.
2. Change the price and save.
3. Return to Finanzas.

**Expect:** that client's income row and the Ingresos total both show the **new** figure.

### 6.3 Changing a client's plan does _not_ move the payment

This is the counterpart to 6.2, and the more important of the two.

1. On the same card, change only the **plan** — leave the price alone. Note the price field becomes
   read-only while a plan change is in progress; that is deliberate.
2. Save, and return to Finanzas.

**Expect:** the income row is **unchanged**. A plan change generates no charge and no refund — the
difference is settled in delivery days, not money.

**Why this matters:** if a plan change moved the register, every plan change would silently rewrite
a month that had already been closed.

### 6.4 Totals survive a deleted client

A client can be deleted while their payments remain part of a closed month.

1. Note the Ingresos total and a client with an income row.
2. Delete that client (Clientes → their page → Más acciones → delete).
3. Return to Finanzas.

**Expect:** Ingresos is **unchanged** and the income row is still listed. The client is
soft-deleted, and the register deliberately still counts them — dropping their payments would
quietly lower a month that has already been reported.

### 6.5 Decimals do not drift

Register several expenses with cents (e.g. `10.10`, `20.20`, `30.30` — five or six of them).

**Expect:** Egresos matches the exact sum, rounded once for display. Totals are summed in the
database rather than by adding numbers up in the browser, precisely to avoid the tiny errors that
repeated decimal addition produces.

---

## 7. Roles and access

Only **admin** and **super_admin** may see Finanzas. Test with a `kitchen`, `delivery` or
`nutritionist` login:

| Check                                             | Expect                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Sidebar                                           | No **Finanzas** item. For kitchen/delivery/nutritionist there should be no Administración section at all |
| Navigate directly to `/finanzas`                  | Redirected to `/sin-acceso`                                                                              |
| API `GET /api/finance` with their token           | `403`                                                                                                    |
| API `POST /api/finance/expenses` with their token | `403`                                                                                                    |

A plain **admin** (not super*admin) \_should* see the Administración section — containing Finanzas
only, since Usuarios and Health remain super_admin. That is not a bug; it is new with this feature.

---

## 8. Things that look like bugs but are not

Report anything not on this list. These are deliberate:

- **No "Registrar ingreso" button.** Rule 1.
- **Income rows have no edit or delete.** Rule 1.
- **Cents are not displayed.** §2 — they are stored, just not shown here.
- **No charts, no trends, no month-over-month comparison, no Excel/PDF export.** All explicitly out
  of scope, not "not yet".
- **No payment method** (efectivo/transferencia) on an expense. Out of scope.
- **No recurring or scheduled expenses.** Repetition is **Duplicar** and nothing else (§4.4).
- **The earliest selectable month is not the business's founding month.** The register only knows
  about movements recorded since it went live. There is no backfill, by decision.
- **The first month understates income.** Clients who paid before the register existed were already
  marked paid and generated no payment row. This corrects itself as renewals come through.
- **Category dropdown is alphabetical** (Alquiler first, Otros in the middle) where the spec
  describes a fixed order ending with Otros. _Known open question — flagged, not yet decided._

---

## 9. Cleaning up

Anything you create during testing is real data in the register.

- **Expenses** — delete them through the UI (§4.5). They are soft-deleted, so the rows remain in
  the database with a `deletedAt` timestamp but stop counting toward any total.
- **Income** — **cannot be removed from the screen.** If you produced income rows by marking
  subscriptions paid, the only way to remove them is at the database level, or by deleting the
  client and subscription that produced them.

> **Be careful producing test income.** Marking a subscription paid has **no undo** — nothing in
> the application reverses it. Prefer a throwaway test client over an existing one.

---

## 10. Reporting a problem

Include: the month you were viewing, your role, the exact figures on screen (Ingresos, Egresos,
Balance and the counts), what you did, and what you expected. For any total that looks wrong, say
which of the checks in §6 you ran — "Ingresos disagrees with the client's own page" is a far more
actionable report than "the total looks wrong".
