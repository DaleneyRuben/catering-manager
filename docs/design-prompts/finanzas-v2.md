# Design Prompt: Finanzas v2 — categories, filters, and a screen worth looking at

> Second pass over the existing **Finanzas** screen (`/finanzas`, sidebar → Administración).
> Read [`finanzas.md`](./finanzas.md) — the v1 design — and [`ADR-008`](../adr/008-finance-owns-payments.md)
> first. Everything v1 established still holds unless this document explicitly overturns it; it
> overturns two things, both deliberately (§2 and §3).
>
> The register shipped and is in use. This is not a redesign of what it means — it is still a cash
> book, still one month at a time, still no debt and no manual income. It is a pass over what it is
> like to _use_ every day.

**Everything in §1–§6 is agreed scope.** §6.5 lists what stays excluded, and §7 is one open
question to settle before the design is finalised.

| §   | What                                                            |
| --- | --------------------------------------------------------------- |
| 1   | Add, rename and retire expense categories                       |
| 2   | Strip the expense form back — placeholders and Enter hint       |
| 3   | Income rows link to the client's profile                        |
| 4   | Filter by direction and category, plus free-text search         |
| 5   | Visual pass, including the hover-only actions defect            |
| 6   | Who registered a movement, filtered subtotal, open-month marker |

## The three rules still apply

Restated because every decision below has to survive them:

1. **Income is never entered by hand.** There is a "Registrar gasto" button and no "Registrar
   ingreso" button. Income rows are written when an admin marks a subscription paid.
2. **A movement is dated the day the money moved.** Expenses cannot be dated in the future;
   backdating is allowed.
3. **Nothing here tracks debt.** No pendiente, no saldo, no overdue, on either side.

---

## 1. Category management

**Current state, so the design starts from fact:** categories are _not_ hardcoded. They live in a
database table, seeded with eight (Insumos, Personal, Transporte, Empaques, Servicios, Alquiler,
Equipamiento, Otros) and served to the expense form. What is missing is any way for a user to
change that list. The backend already has "create" and "deactivate"; neither is reachable.

Design a way to **add**, **rename** and **retire** categories, and to use a new one immediately
when recording a gasto.

Hard constraints:

- **Retiring a category must not destroy it.** Expenses already filed against a category keep
  naming it forever — a closed month's per-category breakdown must never lose a line because
  someone tidied the list later. So a retired category disappears from the _form_ while remaining
  visible in _history_. The design needs a word for this that isn't "eliminar"; "Archivar" or
  "Desactivar" both work, "Eliminar" does not.
- **Retiring must be reversible.** A retired category has to remain visible somewhere and be
  restorable — see §6.3.
- **Renaming is in scope.** Nothing references a category by its name, so fixing a typo is free,
  and it updates that category's label everywhere in history — which is the desired behaviour, not
  a side effect to warn about.

Open questions for the designer to answer:

- **Where does management live?** A dedicated screen, a modal from Finanzas, or inline in the
  expense form? Consider that the expense form is filled _every single day_ and the category list
  changes perhaps twice a year — management should not be in the daily path, but creating one
  mid-entry ("this receipt doesn't fit any of these") probably should be.
- **What order does the list appear in?** Today it is alphabetical, which buries `Otros` in the
  middle and puts `Alquiler` — used twice a month — above `Insumos`, used daily. With
  user-created categories the seeded order is no longer meaningful either. Most-recently-used or
  most-used-this-month would both beat alphabetical for a form filled daily. Pick one and say why.
- **What happens when retiring a category that has expenses this month?** Warn, and state plainly
  what does and does not change.

---

## 2. The expense form, cleaned up

Two removals, both requested, both correct:

- **Remove the field placeholders** (`0.00`, `Reparto del día, verdulería…`). The labels already
  say what each field is; the placeholders repeat the label or invent an example that becomes a
  suggestion nobody asked for.
- **Remove the "Enter para guardar" hint.** It is instructional clutter on a form the user fills
  daily and learns in a week.

**Keep the behaviour, drop only the caption:** focus must still land on Monto automatically, and
Enter must still submit. Losing either would make the daily entry slower, which is the opposite of
the intent. If the designer believes an affordance is still needed for discoverability, propose
something quieter than a line of text.

While the form is open: it is the highest-frequency interaction in the entire product. Anything
that removes a keystroke or a click from it is worth more than anything else in this document.

---

## 3. Movimientos → client profile

**This overturns v1**, which specified income rows as "Not clickable in v1".

An income row should lead to that client's profile. Note carefully:

- **Only income rows have a client.** An expense has a category, a date and an amount — it is not
  attached to anyone. Per-client expense tagging is explicitly out of scope and stays that way.
  So this is not "rows are clickable"; it is "income rows are clickable and expense rows are not",
  and the design must make that legible without looking broken or inconsistent.
- **The click target competes with the row's actions.** Expense rows carry Editar / Duplicar /
  Eliminar. Income rows carry none. Whatever indicates "this row goes somewhere" must not read as
  a fourth action.
- **A client can be deleted while their payments remain.** The register deliberately keeps counting
  a soft-deleted client's payments, so a link can point at someone no longer in the directory.
  Decide what that does: disable the link, mark the name, or let it navigate and let the client
  page handle it. Do not leave it to chance.

---

## 4. Filtering the movements list

Two filters requested: **by direction** (ingreso / gasto / both) and **by expense category**.

The critical design decision, which must be answered explicitly:

> **When a filter is active, do the three tiles change?**

Recommendation: **no.** Ingresos, Egresos and Balance are the month's truth and should not move
because someone narrowed a list — a "Balance" of one category is not a balance of anything. Instead
give the _list_ its own subtotal and count that responds to the filter. If the designer disagrees,
the alternative must explain what "Balance" means under a filter.

Also settle:

- Filtering by category while direction is "ingreso" is contradictory — income has no category.
  Resolve it in the interaction, not with an error message.
- What the empty result looks like, and how it differs from a genuinely empty month. "No hay
  movimientos que coincidan" and "Aún no hay movimientos" are different statements and should look
  different.
- Whether filters survive a month change. (Suggestion: yes — comparing the same category across
  months is exactly why someone filters.)

**Free-text search is in scope**, alongside the two filters. "verdulería" is how a person actually
looks for a row, and the description field is already free text. It should search an expense's
description and an income row's client name — the two things a person would type — and combine with
the filters rather than replacing them.

---

## 5. A better-looking page

Specific problems observed in the shipped screen, rather than "make it nicer":

- **Row actions appear only on hover — this must be fixed.** Editar / Duplicar / Eliminar are
  invisible on touch entirely, and a keyboard user finds them by tabbing blind. This is the clearest
  defect on the page and fixing it is in scope, not optional. Whatever replaces it has to survive a
  long list without turning every row into a wall of buttons.
- **The two-column body wastes space asymmetrically.** Gastos por categoría sits beside Movimientos;
  with a full month of movements the left column is mostly empty, and with an empty month the right
  one is.
- **Filters need a home** that does not push the tiles below the fold.
- **Income and expense rows are distinguished by a 7px dot and the amount's colour.** In a long
  interleaved list that is thin. The interleaving itself is correct and must stay — the _contrast_
  between the two kinds is what needs work.
- **The layout is desktop-shaped.** Three tiles in a row and a two-column body; state what happens
  on a phone. This screen is plausibly consulted away from a desk.

The visual language is fixed: existing tokens, Cormorant Garamond for figures, JetBrains Mono for
amounts and labels, the olive/terracotta pairing for positive/negative. This is a refinement, not a
new identity.

---

## 6. Also in scope

These were not in the original request. They are **agreed and in scope** — design them alongside
the rest.

### 6.1 Show who registered each movement

Every expense and every payment already stores the user who created it. **It is never displayed
anywhere.** With more than one admin entering expenses, "who recorded this 2.400 de Insumos?" is
the first question asked when a figure looks wrong, and today the answer requires database access.
No new data, no new writes — only a read.

Design decision: this is provenance, not headline information. It should be findable without
competing with the amount, the category or the date. Consider whether it belongs on the row at all
or only in an expanded/hover state — but remember §5, that hover-only content is exactly what v2 is
fixing, so a hover-only answer here needs a touch equivalent.

### 6.2 A running subtotal on the filtered list

Follows directly from §4. Without it, filtering answers "which rows" but not "how much", which is
the actual question behind "how much did we spend on Transporte this month?".

Pair it with a count. Both must respond to the filter while the three tiles stay fixed at the
month's totals — that contrast is the mechanism that keeps "Balance" meaningful (§4).

### 6.3 Reactivating a retired category

Retiring is reversible (§1). The design needs somewhere a retired category is still visible and
can be brought back — which implies category management shows active and retired categories
distinctly, rather than hiding retired ones entirely.

### 6.4 A marker when a month is still open

The current month is by definition incomplete; a previous month is final. The screen presents both
identically today. Mark the current month so a half-finished figure is not read as a result.

Keep it quiet — this is a qualifier on the numbers, not a warning. It should also be obvious by its
absence: paging back to a closed month should feel settled.

### 6.5 Explicitly still out of scope

Recorded so v2 does not quietly reintroduce them. All were rejected with reasons in `CONTEXT.md`:

- Charts, trends, month-over-month comparison
- Export to Excel or PDF
- Any per-client cost, margin or profitability figure
- Payment method (efectivo / transferencia) on an expense
- Recurring or scheduled expenses — repetition is **Duplicar** and nothing else
- Manual income entry
- Partial payments or outstanding balances, on either side

If v2 is the moment to revisit any of these, say so deliberately rather than letting a design
reintroduce them by implication.

---

## 7. One unresolved question outside the design

Finanzas is currently **super_admin only in the UI**, while the API still answers an `admin` token.
That split was a deliberate short-term choice, not a finished decision. Whether an `admin` should
see financial data at all affects who this screen is designed for, and should be settled before
the design is finalised.
