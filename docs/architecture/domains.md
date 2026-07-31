# Domains — Ownership and Boundaries

The reference for how the backend is divided, who is allowed to change what, and why.
This is a living document: when a domain is added, renamed, or given a new table, update
the tables here in the same PR.

The decision behind it — and the alternative we rejected — is recorded in
[ADR-007](../adr/007-domain-ownership.md). The catering business rules live in
[business-rules.md](../business-rules.md); this document is about code structure only.

This document describes the **target**. The code does not fully match it yet — the outstanding
work, in dependency order, is tracked in [backlog.md](./backlog.md). Where the two disagree,
this document is the intent and the backlog says what is left to do about it.

---

## Vocabulary

| Term                 | Meaning                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**           | A unit of ownership. Today, one `backend/src/services/<name>/` folder.                                                                                   |
| **Domain API**       | The domain's `index.ts`. The only legal entry point from outside.                                                                                        |
| **Domain internals** | Everything else in the folder — function files, `_helpers.ts`. Invisible from outside.                                                                   |
| **Owner**            | The single domain permitted to **write** a given table.                                                                                                  |
| **Read access**      | Any query, joins included. Unrestricted — every domain may read every table.                                                                             |
| **Write access**     | `create` / `update` / `destroy`. Owner only.                                                                                                             |
| **Shared kernel**    | Deliberately shared, domain-free code: `utils/date`, `utils/errors`, `utils/logger`, `utils/response`, `utils/sqids`, `types/actor`. Depends on nothing. |

**"Domain" always means a folder under `services/`.** It never means the catering business
knowledge — that is `docs/business-rules.md`, and it is never called "the domain" in code or
in these documents.

Note that ADR-003 predates this document and uses "domain" in the same sense, so the two are
consistent. ADRs are historical records and are not retro-edited.

---

## The four rules

### 1. Any domain may read any table. Exactly one domain may write it.

Reading is free — including joins across tables owned by other domains. This is the whole
advantage of a monolith over separate services, and we keep it deliberately.

Writing is not. Every table has exactly one owning domain. Everyone else calls that domain's
public function.

```ts
// ❌ evaluation does not own client_history
await ClientHistory.create({ clientId, eventType: 'plan_renewed', ... });

// ✅ knock on the front door
import { record } from '../client-history';
await record(actor, { type: 'plan_renewed', clientId, ... });
```

Writes are what cause damage. A domain that misreads a subscription renders something odd;
a domain that miswrites one silently corrupts a contract end date, and it surfaces three
weeks later in a kitchen report.

### 2. A domain API exposes intentions, not fields.

The owner's API is named after what the caller wants, not after the shape of the table.

```ts
// ❌ the caller has to know the schema, and the rule leaks out of its domain
subscription.update(id, { contractEndDate: today, finalizedAt: today });

// ✅ the rule stays where it belongs
subscription.finalize(clientId, actor);
```

This is what stops an owning domain degrading into an anemic CRUD shell. If the API is
shaped like the table, every caller ends up holding a piece of the domain's rules.

Its absence is already visible: `evaluation/mark-paid.ts` reaches into
`subscription/_helpers` precisely because there is no intention-shaped function to call.

### 3. Every write function accepts an optional `transaction`.

Rule 1 means a workflow spanning several domains is several API calls. Without a shared
transaction, a half-finished conversion can commit.

```ts
export const create = async (data: CreateDto, actor: Actor, transaction?: Transaction) => { ... }
```

The caller opens the transaction; each owner writes inside it. `subscription/create.ts`
already works this way — the rule makes it universal instead of ad hoc.

### 4. A view domain must own a rule, not just a query.

A domain that owns no table earns its existence by holding a business rule. If deleting it
would only cost you a `Promise.all`, it was never a domain — it was screen assembly, and
screen assembly belongs in the controller, which already maps one-to-one to a route.

This is the test that keeps `services/reports-page/` from appearing in six months.

---

## The three kinds of domain

| Kind                  | Definition                                        | Rule it obeys                                 |
| --------------------- | ------------------------------------------------- | --------------------------------------------- |
| **Owning domain**     | Owns one or more tables                           | Sole writer of its tables; exposes intentions |
| **View domain**       | Owns no table; composes reads                     | **Never writes anything**                     |
| **Capability domain** | Cross-cutting technical service, no business data | Owns no business table                        |

A domain is named after a business capability, **never after a screen**. `production`,
`delivery` and `report` are sidebar items _because_ they are business activities — the
naming runs that way round, and those names would survive a UI redesign. "Dashboard" is not
a catering activity, which is why no such domain exists.

---

## Owning domains (8)

Every table has exactly one owner. This table is the authority.

| Table            | Owner            | Notes                                                                       |
| ---------------- | ---------------- | --------------------------------------------------------------------------- |
| `clients`        | `client`         | Includes `pausedSince` and `groupToken` — see Known debt                    |
| `subscriptions`  | `subscription`   | The largest domain; correct, as subscriptions are the heart of the business |
| `plans`          | `plan`           |                                                                             |
| `menus`          | `menu`           | Owns the rolling weekly-window pruning rule                                 |
| `appointments`   | `evaluation`     | Named for the workflow, not the entity — see `CONTEXT.md`                   |
| `users`          | `user`           |                                                                             |
| `login_events`   | `login-event`    | Owns User-Agent parsing                                                     |
| `client_history` | `client-history` | Sole writer of every history event                                          |

### `client-history`

Renamed from `history`, which was ambiguous — `login-event` is also a history. It owns
`client_history` and, under rule 1, is the **only** writer of it. Today eight sites across
three domains write history events with the same six fields copied by hand; all of them
become calls to one function whose signature can validate that, say, a `plan_renewed` event
always carries an end date.

### `evaluation` orchestrates

`evaluation` owns a small table but its real work — Conversion and Appointment-driven
renewal — spans `client`, `subscription`, `plan` and `client-history` inside a transaction.
That is a legitimate shape for an owning domain, and it is the main reason rule 3 exists.

---

## View domains (3)

They own no table and write nothing. Each holds a real rule.

| Domain       | The rule it owns                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `production` | Production-group classification — `full` at ≥6 meals, then `lunchAndDinner`, then `lunchOnly`, with `juice` independent, checked in that order |
| `delivery`   | Route grouping — zone, then delivery group (one stop per `groupToken`), then individuals                                                       |
| `report`     | Kitchen report structure — pastelería / producción / hiperproteico / "no dar", portion counts, special-instruction grouping                    |

`report`'s rules currently live in `utils/kitchenReportBuilder.ts` and
`utils/kitchenReportData.ts`, which import _backwards_ into `services/report`. They belong
inside the domain and move there. Until then, `report` is a 39-line shell that would fail
rule 4.

`delivery` currently writes `Client.groupToken` (`set-group.ts`). Under rule 1 it calls
`client.setDeliveryGroup(...)` instead, making it a pure view domain.

---

## Capability domains (2)

| Domain   | Purpose                                                  |
| -------- | -------------------------------------------------------- |
| `auth`   | Authenticate; sign and verify tokens. Used by middleware |
| `health` | System health reporting. Not business data               |

`auth` currently writes the device snapshot to `users` (`login.ts:31-36`); under rule 1 it
calls `user.recordLogin(...)`. Its `createUser` export is dead code duplicating `user.create`
and is deleted.

---

## Dissolved: `dashboard`

There is no business activity called "dashboard" — it was named after a tab. Its
`find-summary.ts` was five unrelated queries in a `Promise.all`, sharing nothing but a page.
It also had to re-implement `delivery`'s stop-counting rule (`find-counts.ts:13`) because it
had no domain to borrow it from — a domain that copies another's rules is a caller, not a
domain.

Each query moves to the domain that owns its data. The screen-shaped assembly moves to
`dashboard.controller.ts`, which is the honest home for screen-shaped code.

| Was                               | Now                                                                |
| --------------------------------- | ------------------------------------------------------------------ |
| `findCounts` (active / suspended) | `subscription`                                                     |
| `findCounts` (`deliveriesToday`)  | `delivery` — deletes the duplicated rule                           |
| `findContractEnding`              | `subscription`                                                     |
| `findBirthdays`                   | `client`                                                           |
| `findConnections`                 | `user`                                                             |
| `findMenus`                       | `menu`                                                             |
| `findSummary`                     | `dashboard.controller.ts` — the same `Promise.all`, one layer down |

`GET /api/dashboard` keeps its contract. The **frontend** `dashboard` feature and its
`['dashboard']` query key are untouched — only the backend's internal organisation changes.

---

## Frontend

The same instinct, adapted: the frontend has no database, so its shared mutable state is the
TanStack Query cache.

> **A feature owns its types and its query keys.**

**The frontend already complies.** Every feature invalidates only its own keys — `clients` →
`['clients', …]`, `evaluations` → `['appointments']`, `plans` → `['plans']`, `menu` →
`['menus']`, `users` → `['users']`. Zero cross-feature invalidations. This is recorded here
so that nobody later "helpfully" centralises cache management into a shared hook.

One exception exists: `Plan` is defined in `features/clients/types.ts` and imported by four
files in `features/plans`, while `clients` imports components and hooks from `plans` — a
circular dependency between features caused by one misplaced type. `Plan` belongs in
`features/plans/types.ts`.

Cross-feature imports are otherwise legitimate and stay: `pages/` composing features is the
point of `pages/`, and `evaluations` importing client types reflects a real domain
relationship.

---

## Enforcement

Rule 1 is a _usage_ rule, not an _import_ rule — reads are legal, so importing a model is
legal everywhere; the violation is calling `.create()` on it. Linting therefore covers most
of the surface, not all of it.

**Structural rules** — `no-restricted-imports`:

- no deep imports into a domain (`services/*/` anything but `index`)
- no `_helpers` imports across domains
- no model imports in `controllers/`
- no `services/` imports in `utils/`

**Static writes** — `no-restricted-syntax` with per-folder `overrides`, one per owning
domain, rejecting `Model.create` / `.update` / `.destroy` / `.bulkCreate` outside the owner.

**Not enforceable by lint:** instance writes such as `sub.update({ ... })`, where the
receiver is a local variable with no type information available to ESLint. A type-level
read-only model surface would close this, and was rejected as more indirection than the
gap justifies. It is instead narrowed by design — **domain APIs should return data, not live
Sequelize instances.** A caller that never holds a model instance cannot write through one.
This is direction for new code, not a retroactive rewrite.

---

## Known debt

Recorded so it is not rediscovered. None of it blocks the rules above.

### `pausedSince` is on the wrong table

> This one is not hypothetical. It already produced a live bug: a sin-fecha renewal for an
> already-paused client overwrote their real pause date, silently shortening their plan —
> six delivery days in the reproduced case. Guarded in `subscription/create.ts`, which no
> longer stamps `pausedSince` when the client is already paused (PR #115, merged).
>
> **The root cause below is still open.** The guard treats one symptom at one call site;
> any future code path that writes `pausedSince` can reintroduce the same bug, because the
> data still cannot distinguish the two situations.

`pausedSince` is a column on `clients` (`models/Client.ts:41`), but a pause applies to a
**plan**, not a person. The client still exists, still has an address; what stopped is
delivery on one subscription.

Worse, the column carries two different meanings — as its own comment in
`utils/clientStatus.ts:27` admits:

1. **A mid-plan pause.** A client 8 days into a 20-day plan travels; on resume they are owed
   12 delivery days and the end date must be extended.
2. **A "sin fecha" renewal.** A renewed plan with no start date chosen yet. It never started;
   nothing is owed.

Both write `pausedSince = <date>`; both display "Pausado". The resume code distinguishes them
by _inferring_ from whether a start date exists (`client/update.ts:38-52`) rather than reading
it from the data. That holds today and is fragile to a third case.

Because a client accumulates many subscriptions, nothing records _which_ plan was paused —
the code assumes "the current one."

**Direction:** move `pausedSince` onto `subscriptions` and represent the two situations
distinctly. This is a migration plus a rewrite of derived-status and pause/resume logic — it
changes business rules and needs its own design work. It does not affect the ownership rules:
`client` owns `clients` today, so `client.pause()` / `client.resume()` are the only writers
either way, and moving the column later invalidates nothing here.

### `groupToken` as a `clients` column

A delivery group is a delivery concept stored as a client field, which is why `delivery`
writes to `clients` today. Rule 1 resolves the violation via `client.setDeliveryGroup(...)`.
A dedicated `delivery_groups` table owned by `delivery` is the better model and would make
`delivery` an owning domain, but it is a migration and is not required by anything here.

### `plan_changed` is declared but never emitted

The event type exists; changing only the assigned plan on an existing subscription records no
history entry. Noted in `business-rules.md`. Once `client-history` is the sole writer, this
becomes a one-function change.
