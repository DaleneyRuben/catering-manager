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

## Existing core terms (referenced by production)

- **Active subscription (for a date)** — a subscription whose `startDate`–`contractEndDate`
  range covers the date, not finalized, client not paused, and the date not in the
  subscription's suspended dates. Canonical rule: `services/subscription/find-active-subscriptions-for-date.ts`.
  The production view, delivery route, and kitchen reports all count exactly these clients.
- **Delivery day (client view)** — Monday–Friday. The kitchen preps Sunday–Thursday, always
  for the next calendar day's delivery.
