# Backlog — Plan change and Finanzas

Tracks one body of work: the plan-change control, and the Finanzas register it unblocks. The
design behind it is in [CONTEXT.md](../CONTEXT.md), [business-rules.md](./business-rules.md)
(Change of plan) and [ADR-008](./adr/008-finance-owns-payments.md).

**This file is deleted when its last item lands.** A previous backlog tracked the
domain-ownership work (#115–#141) and was removed the same way — a backlog that outlives its
work becomes fiction, and anything worth keeping belongs in the documents above, not here.

Order matters: **the price model ships first, then the plan-change control, then Finanzas.** With
the control in place (section 1), a plan change stays on one subscription, so the register cannot
double-count a client who paid once — the finalize-and-recreate workaround that would have caused
it is retired.

Sections 0–2 have landed. Section 3 is the second pass over the register now that it is in daily
use.

---

## 0. Subscription price model

Prerequisite to both sections below. The subscription total was derived on read as
`plan.price - discount`, which let a plan's price edit retroactively rewrite what existing clients
owed, and capped every subscription at the plan price — so a contract longer than the plan's quoted
20 days could not be charged at all. Finanzas would have recorded that understated figure as income.

| #   | Item                                                                                      | Status |
| --- | ----------------------------------------------------------------------------------------- | ------ |
| 0.1 | `subscriptions.price` replaces `discount`; migration backfills `plan.price - discount`    | ✅     |
| 0.2 | Price inputs uncapped; the gap against the plan reads Descuento or Recargo by sign        | ✅     |
| 0.3 | `terms_changed` keys off price; history reads both the new and the legacy metadata shapes | ✅     |
| 0.4 | End-to-end verification via Playwright                                                    | ✅     |

---

## 1. Plan change control

Replaces the finalize-and-recreate workaround. Backend already accepts a new `planId` on an
existing subscription and writes `terms_changed`; the gap is the UI.

| #   | Item                                                                                    | Status |
| --- | --------------------------------------------------------------------------------------- | ------ |
| 1.1 | Design signed off — business rule written into `business-rules.md` (Change of plan)     | ✅     |
| 1.2 | Plan selector + duration in `ActivePlanCard`'s edit mode, sending `planId` on the PATCH | ✅     |
| 1.3 | End-to-end verification via Playwright; workaround retired                              | ✅     |

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

| #   | Item                                                                                                     | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| 2.1 | Design signed off — ADR-008 and the Finanzas section of `CONTEXT.md`                                     | ✅     |
| 2.2 | Migrations: `payments`, `expenses`, `expense_categories` (seeded with the eight categories)              | ✅     |
| 2.3 | `finance` domain — `recordPayment`, expense CRUD, category CRUD, monthly aggregates                      | ✅     |
| 2.4 | `subscription.create` (paid) and `subscription.markPaid` call `finance.recordPayment`                    | ✅     |
| 2.5 | `finance.adjustPayment`, called from `subscription.update` when a paid subscription's price is corrected | ✅     |
| 2.6 | Finanzas screen + sidebar entry under Administración                                                     | ✅     |
| 2.7 | Duplicate-an-expense action — the primary entry path, since delivery is paid daily                       | ✅     |

---

## 3. Finanzas v2 — categories, filters, and a screen worth looking at

The register shipped and is in use; this is a pass over what it is like to _use_ every day. It is
not a redesign of what it means — still a cash book, still one month at a time, still no debt and
no manual income. The three rules of section 2 all survive unchanged.

Prompts: [design](./design-prompts/finanzas-v2.md) · design sign-off in `design/README.md` §10
(_v2 — supersedes v1_) and `design/prototypes/Finanzas.dc.html`.

**Two things v2 overturns deliberately**: income rows are now clickable (v1 said they were not),
and the two-column body is replaced by stacked full-width bands.

### 3a. Backend

The screen cannot be built without these; they land first.

| #   | Item                                                                                                                                                                                                                      | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 3.0 | **Decided: Finanzas is admin + super_admin.** The UI gate (`Layout.tsx`, route guard) moves to match the API, which already answers an `admin` token — and 3.18's who-chip earns its place                                | ✅     |
| 3.1 | Movement rows gain identity: `clientId` + a soft-deleted flag on income, `categoryId` on expenses — the link target and the category-tag filter both need them                                                            | ✅     |
| 3.2 | Movement rows gain provenance: `registeredBy` name (already stored on both `payments` and `expenses`, never read) — a read only, no new writes                                                                            | ✅     |
| 3.3 | `GET /finance` accepts `direction`, `categoryId` and `q`; returns the filtered rows plus a **filtered `SUM` and count**. Never a JS reduction over the page — `pg` returns `DECIMAL` as a string                          | ✅     |
| 3.4 | The three tiles stay unfiltered in the same response — they are the month's truth, and only the list responds                                                                                                             | ✅     |
| 3.5 | `find-month-summary`'s `byCategory` gains `active`, so a category spent this month but since archived still renders, tagged ARCHIVADA                                                                                     | ✅     |
| 3.6 | Category reads gain usage counts (this month + all-time) and can include archived — the modal states usage per row before anyone archives                                                                                 | ✅     |
| 3.7 | `renameCategory` and `reactivateCategory` domain functions (`createCategory` and `deactivateCategory` already exist)                                                                                                      | ✅     |
| 3.8 | Category routes: `POST /finance/categories`, `PATCH /finance/categories/:id` (rename · archive · restore). Creating a duplicate name folds into the existing category, accent- and case-insensitive, rather than erroring | ✅     |

### 3b. Frontend

| #    | Item                                                                                                                                                                                         | Status |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 3.9  | **Row actions always visible** — the hover-only Editar/Duplicar/Eliminar becomes one 28px ⋯ menu per expense row. The clearest defect in v1: invisible on touch, tabbed blind by keyboard    | ✅     |
| 3.10 | Layout: the two-column body becomes stacked full-width bands — Gastos por categoría above, Movimientos below                                                                                 | ✅     |
| 3.11 | Filter bar in the Movimientos header: search · segmented direction · category select, with active filters as removable chips and "Limpiar todo"                                              | ✅     |
| 3.12 | Count + subtotal at the right of that row; label reads NETO DEL MES with no filter active and equals the Balance tile                                                                        | ✅     |
| 3.13 | Filter interaction rules: "Ingresos" replaces the category select with a muted note and clears the category; picking any category sets direction to Gastos; filters survive a month change   | ✅     |
| 3.14 | Two distinct empty states — "Ningún movimiento coincide" (names the real month count, offers Limpiar filtros) vs "Aún no hay movimientos" (teaches where income comes from)                  | ✅     |
| 3.15 | Income/expense contrast: directional glyph tile + tinted income row background, replacing the 7px dot                                                                                        | ✅     |
| 3.16 | Income row links to the client's profile — **the client's name is the link**, not a chevron, so it reads as a property of the row's subject and not a fourth action                          | ✅     |
| 3.17 | A soft-deleted client keeps counting: name muted, no link, mono "CLIENTE ARCHIVADO" tag. No dead link, no dead end                                                                           | ✅     |
| 3.18 | Who-chip: 26px initials between tag and amount, **click/tap** (not hover) opens "REGISTRADO POR / nombre / el dd/mm"                                                                         | ✅     |
| 3.19 | Category cells become filter buttons (active = olive + bold, clicking again clears); responsive `auto-fill` grid; ARCHIVADA sub-label                                                        | ✅     |
| 3.20 | "Administrar categorías" modal: add row, ACTIVAS/ARCHIVADAS sections with usage lines, inline Renombrar, Archivar, Restaurar                                                                 | ✅     |
| 3.21 | Archiving a category with expenses this month confirms with the arithmetic stated plainly, not a vague warning. The word is **Archivar**, never Eliminar                                     | ✅     |
| 3.22 | Expense form stripped: no placeholders, no "Enter para guardar" caption. **Both behaviours stay** — focus lands on Monto, Enter submits; the quieter affordance is a `↵` glyph in the button | ✅     |
| 3.23 | Categoría becomes a wrapping chip row (one click, whole list visible) with a **+ Nueva** chip that creates and selects without leaving the form                                              | ✅     |
| 3.24 | Chip order: most-used this month → most-used all-time → alphabetical, `Otros` pinned last. Alphabetical buried `Otros` and ranked `Alquiler` above `Insumos`                                 | ✅     |
| 3.25 | Open-month marker: MES EN CURSO pill beside the stepper + "Al {fecha}" on the Balance tile, **absent entirely** on a closed month so paging back reads as settled                            | ☐      |
| 3.26 | Saving an expense dated outside the shown month jumps the view to that month instead of filing it out of sight                                                                               | ☐      |
| 3.27 | Responsive pass below 900px: tiles stack, category grid two-up, filter bar wraps with search on its own row. Consulting is the target; recording a gasto on a phone is not                   | ☐      |
| 3.28 | End-to-end verification via Playwright                                                                                                                                                       | ☐      |

### Decided

- **Finanzas is admin + super_admin** (3.0). The API already answered an `admin` token; the UI gate
  moves to match, and `business-rules.md` (User Roles) records it.
- **Accent-insensitive search uses SQL `translate()`, not the `unaccent` extension** (3.3). Search
  has to run in SQL because the subtotal is a filtered `SUM`, but no extension means no migration
  and nothing to enable on the hosted database. Over one month of rows the lost index is irrelevant.
  Note this makes Finanzas search _more_ forgiving than the Clientes search, which is plain `ILIKE`
  (`client/search.ts`) and folds no accents — a deliberate inconsistency, not an oversight.
- **The chip order is computed server-side** (3.24), as an `ORDER BY` over the usage counts 3.6
  already gathers. The expense form and the category modal then cannot disagree about which
  category is most used.
- **Creating a category folds onto an archived one and restores it** (3.8). Asking for a category
  by name is asking to file against it, so handing back an archived row the form cannot offer
  would read as the button doing nothing. A fold answers `200` rather than `201` — nothing was
  created — and either way returns the category for "+ Nueva" to select.
- **Renaming never folds; a taken name is a `409`** (3.8). Merging two categories would have to
  move every expense filed against one of them, which is a different operation from correcting a
  label. A category matching only itself is not a collision, so recasing its own name is allowed.
- **Category usage counts scope to a `month` query param** (3.6), defaulting to the current month.
  The modal passes the month on screen, so "usado 4 veces este mes" describes the register the
  user is actually looking at rather than today's calendar month.

### Notes for whoever implements it

- `MovementsList.tsx` (132 lines) and `FinancePage.tsx` (168) both grow past 400 under this list.
  Split as you go: `MovementRow`, the ⋯ menu, the who-chip, the filter bar and the category modal
  are each their own file.
- Nothing here changes how money is recorded. Every item is a read, a filter or a category write —
  `recordPayment`, `adjustPayment` and the expense write path are untouched.

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
- Automatic/recurring expense generation — repetition is **Duplicar** and nothing else
- Per-client expense tagging and client profitability reporting
- Payment method (efectivo/transferencia) on an expense
- Manual income entry — all income is subscription revenue
- Charts, trends and month-over-month comparison — v2 re-confirmed this
- Export to Excel or PDF
- A proportional price calculator. A plan's price is quoted for 20 delivery days, but a longer
  contract is priced by negotiation, not by dividing and multiplying. The admin enters the price.
