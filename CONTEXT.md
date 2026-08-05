# CONTEXT — Ubiquitous Language

Glossary of canonical terms for the catering-manager domain. Code identifiers are English;
UI labels are neutral Spanish. Each entry: term (code identifier) — definition.

## Production (kitchen prep planning)

- **Production view** (`production`) — the kitchen-facing screen listing _tomorrow's_ active
  clients grouped by their plan's meal composition, so the kitchen knows headcounts to prep.
  UI label: "Producción". ⚠ Distinct from the **Producción section** of the kitchen `.docx`
  report (the almuerzo/ensalada/cena portion block) — same Spanish word, different concept.
- **Production tomorrow** — the literal calendar day after today (not the next delivery day).
  If it falls on Saturday or Sunday there are no deliveries and the production view shows an
  empty state.
- **Production group** — one of four columns a client is classified into, derived only from
  the meal types of their assigned plan:
  - **`juice`** (UI: "Jugo") — plan includes the `juice` meal type. Independent of the other
    three groups: a juice client also appears in at most one of them.
  - **`lunchOnly`** (UI: "Almuerzo") — plan includes `lunch` and not `dinner`.
  - **`lunchAndDinner`** (UI: "Almuerzo y cena") — plan includes both `lunch` and `dinner`.
  - **`full`** (UI: "Completo") — plan includes **6 or more** meal types, counting _all_
    entries in `plan.meals` (including `juice` and `extra`).

  Among `lunchOnly` / `lunchAndDinner` / `full` a client lands in exactly one, checked in
  priority order: `full` first, then `lunchAndDinner`, then `lunchOnly`. A client matching
  none of the three (e.g. breakfast-only plan) appears only in `juice` if applicable,
  otherwise not at all.

  ⚠ `full` is deliberately _not_ named `complete`: "Completo" is also the name of a plan in
  the catalog. The group is a rule over meal composition; the plan is a catalog entry. A
  client on a plan named "Completo" is usually in the `full` group, but the two concepts are
  independent.

## Login tracking

- **Login event** (`loginEvent`) — an append-only record of one successful login: who, when,
  and from what device (parsed from the browser's User-Agent). Failed logins are never
  recorded. Events are never pruned; deleting a user cascades to their events.
- **Device snapshot** — the `lastDeviceType` / `lastOs` / `lastBrowser` fields on a user,
  overwritten on each login (like `lastLoginAt`). A denormalized copy of the latest login
  event, kept for fast display; the events table is the history.
- **Device type** (`deviceType`) — `mobile` | `desktop` | `tablet`, stored as English keys,
  displayed in Spanish ("Móvil" / "Escritorio" / "Tableta"). `null` when the login request
  carried no User-Agent.

## Evaluaciones (appointments → client conversion or renewal)

- **Appointment** (`appointment`, UI: "Cita") — a placeholder record for a prospective or
  returning client (name, phone number, date, time) created by an Admin, awaiting action from
  a Nutricionista. Carries a nullable `subscriptionId`, set only once _resolved_ (see below) —
  `null` means still pending. Fecha must be today or later at creation/edit time. _Changed_: an
  Appointment is no longer indefinitely visible once its date passes — both the Admin's "Citas
  pendientes" list and the Nutricionista's queue only ever show Appointments dated today or
  later, regardless of resolution status. An unresolved (`pendiente`) Appointment whose date
  has passed isn't just hidden — it's deleted outright, lazily, the next time either list is
  read (mirroring how the `menus` table prunes its own rolling window on write instead of read
  — see docs/business-rules.md's Daily Menu Processing). A _resolved_ (pagado/no_pagado) Appointment
  past its date is only hidden, never deleted — its data lives on through the
  Client/Subscription/history it produced.
- **New-client appointment** — an Appointment with `clientId` unset. The caller is not yet a
  Client. Resolving it always creates a brand-new Client + Subscription (see **Conversion**).
- **Existing-client appointment** — an Appointment whose `clientId` links to a pre-existing
  Client, set by the Admin at scheduling time via an explicit search-and-select step (never a
  guess or automatic phone match — the Admin's own knowledge of who's calling is the source of
  truth). `name`/`phone` on the Appointment are copied from the Client and locked (read-only) —
  the Client record stays the one source of truth for that contact info. Resolving it renews or
  reactivates that Client's plan (see **Appointment-driven renewal**) rather than creating a new
  Client.
- **Resolving an appointment** — the umbrella action that stamps `subscriptionId` on the
  Appointment, whichever of the two paths below produced it. An Appointment can't be resolved
  twice, and **never becomes resolvable again** — whatever happens to the subscription afterwards,
  a cita the Nutricionista has acted on does not return to her queue. If the plan it produced is
  removed, the cita is deleted with it by the `appointments.subscriptionId` foreign key; it does
  not revert to pending.
- **Conversion** — resolving a **new-client appointment**: turning it into a full Client +
  Subscription record, via the same wizard used for a direct client creation, with one
  addition: an explicit paid/unpaid choice made by the Nutricionista.
- **Appointment-driven renewal** — resolving an **existing-client appointment**: the
  Nutricionista renews or reactivates that Client's plan (same renewal-vs-reactivation choice
  and rules an Admin uses from the Clientes screen — see docs/business-rules.md's Client Lifecycle),
  reached through a dedicated, read-only summary view (name, phone, status, current plan,
  contract end date only — never the full Clientes detail page) that exists only as a landing
  spot from this Appointment. Also includes the paid/unpaid choice, same as a Conversion; a
  direct Admin-initiated renewal has no such choice and is always implicitly paid. See
  [ADR-006](./docs/adr/006-nutritionist-renewal-view-reuses-full-client-read.md) for why that
  view's data comes from the same full client-read endpoint an Admin uses, rather than a
  narrower one.
- **Evaluations** (`evaluations`, UI: "Evaluaciones") — the feature/screen covering the whole
  appointment-resolution workflow: Admins create and manage Appointments (including linking one
  to an existing Client); the Nutricionista resolves them, either by Conversion or by
  Appointment-driven renewal. _Avoid_: naming the module/folder "citas" — that's the entity,
  not the feature.
- **Pendiente de pago** (a `paid: false` subscription) — a subscription created through
  Evaluaciones (Conversion or Appointment-driven renewal alike) marked unpaid by the
  Nutricionista at the moment of resolution. Excluded from every active-subscription query —
  dashboard, production, delivery route, chef reports, and the Clientes table — until an Admin
  marks it paid from the Evaluaciones screen. See
  [ADR-004](./docs/adr/004-unpaid-clients-as-full-records.md) for the original new-client-only
  design and [ADR-005](./docs/adr/005-unpaid-pattern-extended-to-renewals.md) for how it now
  extends to renewals — in particular: its `plan_assigned`/`plan_renewed`/`reactivated` history
  entry (normally written unconditionally at subscription creation) is deferred rather than
  skipped regardless of which of the three it is; the single-record-lookup block (`GET
/clients/:id` 404ing while unpaid) only fires when the unpaid subscription is the Client's
  only one ever, so an existing Client stays fully reachable throughout a pending unpaid
  renewal; and the "Pendientes de pago" cleanup action itself branches — a still-unpaid
  **new-client appointment** deletes the whole Client (nothing else exists to lose), while a
  still-unpaid **existing-client appointment**'s renewal instead deletes both the Subscription it
  created and the Appointment itself, permanently, leaving the Client, its other subscriptions and
  its history untouched. The Appointment does not return to the queue — a client needing another
  evaluation gets a freshly scheduled cita. _Avoid_: treating this as a `ClientStatus` value shown in the Clientes UI — it
  never reaches that table or its filters at all.
- **Nutricionista** (role: `nutritionist`) — staff role whose only screens are Evaluaciones and
  (via Appointment-driven renewal) the read-only summary view for one specific existing Client,
  reached only through that Appointment. Cannot browse Clientes, Planes, or any other admin
  screen, and cannot reach a Client's full detail page. Can resolve an Appointment (Conversion
  or renewal) and choose whether the resulting subscription is paid. Appointments are not owned
  by a specific Nutricionista user — any user with this role sees and can act on the same
  shared queue. There is currently no concept of "my appointments" vs. someone else's.

## Finanzas (money in and out) — designed, not yet built

⚠ Nothing in this section exists in code yet. It records the language agreed during design so the
implementation has one vocabulary to start from.

- **Cash basis** — every financial record is dated by **the day the money moved**, never by the
  period it relates to. A renewal paid in July for a plan running in August is July income. This
  is a register of what came in and went out, not a profit-and-loss statement, and there is no
  concept of accrual anywhere in the model.
- **Payment** (`payment`) — money arriving. Carries its own amount and date, because a plan's
  price may change after the money was received and the register must keep what was actually
  paid — the one exception being a correction to that price, which the payment follows. A payment for a subscription is created when that subscription is marked paid, so
  subscription revenue has exactly one source and the ledger can never disagree with the
  Clientes screen.
  ⚠ Distinct from **`Subscription.paid`**, which is an _activation gate_, not a payment: while
  `paid: false` the subscription "isn't real yet" (see [ADR-004](./docs/adr/004-unpaid-clients-as-full-records.md))
  — excluded from active-subscription queries, hidden from Clientes, its history deferred. The
  boolean answers "is this plan live?"; a Payment answers "how much money arrived, and when".
  The two must never be collapsed into each other.
- **Partial payment** — a payment for less than the subscription total. Happens occasionally in
  the business but is **deliberately not permitted** by the system: a payment's amount is always
  the full total. Consequently there is no outstanding-balance concept, no debt chasing, and no
  "pendientes de cobro" view. Permitting it later is a validation change, not a schema change.
- **Expense** (`expense`) — money leaving: one flat record of date, amount, category, description
  and who registered it. Never a document with line items; there is no supplier, invoice or
  attachment entity. Paying one thing in several instalments (the rent is paid this way) is
  several Expenses, not one Expense partly settled. Description is optional, the amount is always
  positive (a negative expense would be a refund, and there are none), and the date defaults to
  today, may be backdated, and is never in the future. _Rejected fields_: payment method
  (efectivo/transferencia) and any link to a client — both add friction to the most frequently
  used form in the system, since delivery is paid daily.
- **Expense category** (`expenseCategory`) — a managed catalog, seeded with Insumos, Personal,
  Transporte, Empaques, Servicios, Alquiler, Equipamiento and Otros. Chosen from a list, **never
  free text** — free text produces "Mercado" / "mercado" / "Compras mercado" as three categories
  and silently breaks every total. Salaries are Personal; they are not tracked anywhere else. A
  category with expenses against it is deactivated, never deleted, so historical totals stay put.
  There are no sub-categories: if one proves too coarse, it becomes two categories.
- **Obligation** — _rejected term_. The register records money that moved, never money owed. It
  cannot answer "have I finished paying August's rent?" and is not meant to; that would be an
  accounts-payable module, and it would be lopsided against the income side, which tracks no
  receivables either.
- **Movement** (`movement`, UI: "Movimiento") — a Payment or an Expense seen as one row of the
  register's single chronological list. Income and expenses are one interleaved stream, not two
  tabs: a cash register is money moving in both directions, and splitting it makes the reader do
  the balance arithmetic themselves. A movement is a display concept only — nothing stores one.
- **Register start** — the month Finanzas goes live. Nothing before it is shown or navigable, and
  no backfill is performed, even though `client_history` could reconstruct one (see
  [ADR-008](./docs/adr/008-finance-owns-payments.md)). Backfilled income against months where no
  expenses were ever recorded would show pure profit, and Balance is the headline number on the
  screen. The known cost: the first month understates income, since clients who paid before
  launch were already `paid: true` and generate no Payment.
- **Mutability** — Expenses are typed by hand and are freely editable and soft-deleted
  (`paranoid`, as `Client` already is), each recording who registered it. Payments are never typed
  and are **never deletable, and never editable from the Finanzas screen**: nothing on one is a
  human's to revise directly. A Payment's amount moves in exactly one circumstance — the agreed
  price on its subscription was corrected — and it moves automatically, in that same transaction.
  Within one subscription's life a price edit is always a correction, never a renegotiation (that
  is what the next renewal is for) and never a plan change (which moves no money by rule), so the
  register follows it rather than keeping a figure the business never received.
- **Client profitability** — _rejected_. With no client-specific expenses, every client costs the
  same per delivery day, so a per-client margin ranking would only restate which discounts were
  granted. Per-client expense tagging is rejected outright: tagging the ~5% of costs that could be
  attributed would produce a precise-looking number that is mostly fiction.
- **Recurring expense** — _rejected as an automatic concept_. Nothing is ever generated on a
  schedule: this backend has no scheduled-job infrastructure (see docs/business-rules.md), and an
  auto-generated row would assert money left the business when it may not have, which contradicts
  cash basis. Repetition is handled by **duplicating** an existing Expense into a new one dated
  today — the primary entry path, since delivery is paid daily and is the highest-frequency
  record in the system.

## Plan change (cambio de plan)

- **Plan change** — replacing the assigned plan on a client's **running** subscription, typically
  about a week in, once they have tried the food. One subscription throughout: nothing is
  finalized and nothing is created.
  ⚠ **Never produces a Payment**, in either direction — the client pays no difference on an
  upgrade and receives no refund on a downgrade. The difference is settled in **delivery days**:
  the admin sets a new duration so the money already paid covers the new plan over a shorter or
  longer period. The system does not derive that duration; the admin enters it.
  The agreed price rides through untouched — it is what the client already paid.
  Recorded as `terms_changed` (the plan moved) plus `dates_changed` (the duration moved with it).
  The control is the plan tab's "Plan y precio" card; it sends plan, duration and discount in one
  PATCH to `subscription/update.ts`, and only the fields that actually moved. The paid total is
  frozen and the **discount absorbs the difference** — negative (a _recargo_) when the new plan
  lists below what the client already paid.
- **Finalize-and-recreate** — _the retired workaround_, not a concept to preserve. Before the plan
  change control existed, admins ended the plan and created a second one. It recorded a client who
  left and came back (`plan_finalized` + `plan_assigned`) instead of one who changed their mind,
  and it left a second subscription that the dashboard and each plan's client count both counted.
  It would also have double-counted the client's payment in Finanzas, which is why the plan change
  control shipped **before** it.

## Existing core terms (referenced by production)

- **Agreed price** (`subscription.price`) — what a client pays for one contract, negotiated and
  frozen on the subscription when it is agreed. _Avoid_: deriving it from the plan on read, which
  let a plan's price edit rewrite what every existing client owed, and capped every subscription at
  the plan price. A plan's price is quoted for **20 delivery days**; a longer contract costs more,
  so the agreed price sits either side of it. The gap against the plan price is display only —
  **Descuento** below, **Recargo** above.
  ⚠ _Rejected term_: **discount**. It was a stored unsigned column and is now neither stored nor
  signed-neutral; a "negative discount" is a surcharge, and naming it that way is what hid the
  longer-contract case for so long.

- **Active subscription (for a date)** — a subscription whose `startDate`–`contractEndDate`
  range covers the date, not finalized, client not paused, and the date not in the
  subscription's suspended dates. Canonical rule: `services/subscription/find-active-subscriptions-for-date.ts`.
  The production view, delivery route, and kitchen reports all count exactly these clients.
- **Delivery day (client view)** — Monday–Friday. The kitchen preps Sunday–Thursday, always
  for the next calendar day's delivery.
