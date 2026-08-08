# Design Prompt: Finanzas — the money register

> New screen. Sidebar item **Finanzas**, in the **Administración** section next to Usuarios. Visible to `admin` and `super_admin`.
>
> Read [`CONTEXT.md`](../../CONTEXT.md) → "Finanzas" and [`ADR-008`](../adr/008-finance-owns-payments.md) first — they define every term used here and, just as importantly, what was deliberately left out.

## What this is

A cash register: money in, money out, one month at a time. It is **not** an accounting system, an invoicing tool, or a P&L. Every design decision below follows from that.

Two things it must never imply:

- **That it tracks debt.** No "pendiente", no "saldo", no overdue anything, on either side. It records money that moved.
- **That income is typed.** All income is subscription revenue, created automatically when an admin marks a subscription paid. There is a "Registrar gasto" button and there is no "Registrar ingreso" button — that asymmetry is correct and deliberate.

## Layout

Standard page shell — eyebrow "ADMINISTRACIÓN", serif title "Finanzas".

### Month selector

Top of the page, above everything. Current month by default, arrows to page backwards. Everything below is scoped to it.

**It cannot page earlier than the month the register went live** — there is no data before that and no backfill, so the back arrow disables at that bound rather than showing empty months that look like months with no money.

### Three tiles

Same `KpiCard` treatment already used on the dashboard:

| Tile         | Value   |
| ------------ | ------- |
| **Ingresos** | 34.800  |
| **Egresos**  | 21.450  |
| **Balance**  | +13.350 |

Balance carries a sign and takes colour from it — the olive/positive token when up, the warn token when down. It is the only number on the page a person looks for first, so give it the visual weight of the other two combined.

### Gastos por categoría

A compact breakdown beneath the tiles: category name, amount, and a proportion bar. **Sorted by amount descending**, so the biggest cost is always the first line. Categories with nothing spent this month are omitted, not shown as zero.

### Movimientos

One chronological list, newest first — income and expenses interleaved, **not** two tabs. A register is money moving in both directions, and splitting it makes the reader do the balance arithmetic themselves.

Each row: date, a description, and a signed amount right-aligned in mono, coloured by direction.

- **Income row** — the client's name as the description, plus a quiet "Suscripción" tag. Not clickable in v1.
- **Expense row** — the category as a tag, plus the free-text description if there is one. Hovering reveals its edit and duplicate actions.

Empty state, for the first days of a new month: something that reads as "nothing yet", not as an error.

## Registrar gasto

A modal, opened by a primary button beside the month selector. Fields:

- **Monto** — number, two decimals, required, must be greater than zero.
- **Categoría** — select from the catalog, required. Never free text.
- **Fecha** — defaults to today, may be backdated, **cannot be in the future**.
- **Descripción** — free text, optional.

This form is filled in **every single day** — delivery is paid daily and is the highest-frequency record in the system. Design it for speed: focus lands on Monto, the category remembers the last one used, Enter submits.

### Duplicar

Every expense row offers a duplicate action. It opens the same modal, pre-filled with that expense's amount, category and description, dated **today**, for the admin to confirm. This is the primary path for the daily delivery payment and for the rent instalments — it is not a secondary convenience, so give it real affordance rather than burying it in an overflow menu.

## Editing and deleting

- **Expenses** — freely editable and deletable. A delete asks for confirmation, since it moves the month's totals.
- **Income** — neither editable nor deletable. No edit affordance on an income row at all: nothing on one is a human's to revise, and offering a disabled control invites the question.

## Out of scope

Not "later" — deliberately absent, and the design must not gesture at them:

- Charts, trends, month-over-month comparison
- Export to Excel or PDF
- Any per-client cost, margin or profitability figure
- Payment method (efectivo/transferencia) on an expense
- Recurring or scheduled expenses — repetition is **Duplicar** and nothing else
- Manual income entry
