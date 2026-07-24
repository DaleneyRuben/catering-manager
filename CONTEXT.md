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

## Evaluaciones (appointments → client conversion)

- **Appointment** (`appointment`, UI: "Cita") — a placeholder record for a prospective client
  (name, phone number, date, time) created by an Admin, awaiting action from a Nutricionista.
  It is not a client and carries no plan/subscription data until converted.
- **Evaluations** (`evaluations`, UI: "Evaluaciones") — the feature/screen covering the whole
  appointment-to-client workflow: Admins create and manage Appointments; the Nutricionista
  converts them into clients. _Avoid_: naming the module/folder "citas" — that's the entity,
  not the feature.
- **Conversion** — turning an Appointment into a full Client + Subscription record, via the
  same wizard used for a direct client creation, with one addition: an explicit paid/unpaid
  choice made by the Nutricionista.
- **Pendiente de pago** (a `paid: false` subscription) — a client created through Evaluations
  whose subscription was marked unpaid at conversion. Excluded from every active-subscription
  query — dashboard, production, delivery route, chef reports, and the Clientes table — until
  an Admin marks it paid from the Evaluaciones screen. See
  [ADR-004](./docs/adr/004-unpaid-clients-as-full-records.md) for why this is a flag on a real
  record rather than a separate draft entity. _Avoid_: treating this as a `ClientStatus` value
  shown in the Clientes UI — it never reaches that table or its filters at all.
- **Nutricionista** (role: `nutritionist`) — staff role whose only screen is Evaluaciones. Can
  convert an Appointment into a client and choose whether the subscription is paid, but has no
  access to Clientes, Planes, or any other admin screen.

## Existing core terms (referenced by production)

- **Active subscription (for a date)** — a subscription whose `startDate`–`contractEndDate`
  range covers the date, not finalized, client not paused, and the date not in the
  subscription's suspended dates. Canonical rule: `services/subscription/find-active-subscriptions-for-date.ts`.
  The production view, delivery route, and kitchen reports all count exactly these clients.
- **Delivery day (client view)** — Monday–Friday. The kitchen preps Sunday–Thursday, always
  for the next calendar day's delivery.
