# Domains — Ownership and Boundaries

The reference for how the backend is divided, who is allowed to change what, and why.
This is a living document: when a domain is added, renamed, or given a new table, update
the tables here in the same PR.

The decision behind it — and the alternative we rejected — is recorded in
[ADR-007](../adr/007-domain-ownership.md). The catering business rules live in
[business-rules.md](../business-rules.md); this document is about code structure only.

The code matches this document. Bringing it in line ran from #115 to #141 and was tracked at the
time in a `backlog.md` alongside this file; that file was deleted once its last item landed, since
a backlog that outlives its work becomes fiction. What each step found is in the merge commits,
and anything worth keeping was folded into this document or the ADR. One item was deliberately
not done — see [Known debt](#known-debt).

---

## Vocabulary

| Term                 | Meaning                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**           | A unit of ownership. One `backend/src/domains/<name>/` folder.                                                                                                                                |
| **Domain API**       | The domain's `index.ts`. The only legal entry point from outside.                                                                                                                             |
| **Domain internals** | Everything else in the folder — function files, `_helpers.ts`. Invisible from outside.                                                                                                        |
| **Owner**            | The single domain permitted to **write** a given table.                                                                                                                                       |
| **Read access**      | Any query, joins included. Unrestricted — every domain may read every table.                                                                                                                  |
| **Write access**     | `create` / `update` / `destroy`. Owner only.                                                                                                                                                  |
| **Shared kernel**    | Deliberately shared, domain-free code: `utils/` (`date`, `errors`, `logger`, `response`, `sqids`, `sentry`, `devFlags`, `whatsappIcon`), `constants/`, `types/actor`. Holds no business rule. |

**"Domain" always means a folder under `domains/`.** It never means the catering business
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
subscription.finalize(subscriptionId);
```

This is what stops an owning domain degrading into an anemic CRUD shell. If the API is
shaped like the table, every caller ends up holding a piece of the domain's rules.

The cost of its absence is on record: `markPaid` lived in `evaluation` while
`subscription/create.ts` held the same three side effects for the paid case, and the two
copies drifted — the already-paused guard from #115 was added to one and not the other,
losing a paused client their remaining delivery days. Both now call one helper.

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

This is the test that keeps `domains/reports-page/` from appearing in six months.

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

| Table            | Owner            | Notes                                                                                                                                                             |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clients`        | `client`         | Includes `groupToken` — see Known debt                                                                                                                            |
| `subscriptions`  | `subscription`   | The largest domain; correct, as subscriptions are the heart of the business. Includes `pausedSince`, moved off `clients` so a pause describes the plan it stopped |
| `plans`          | `plan`           |                                                                                                                                                                   |
| `menus`          | `menu`           | Owns the rolling weekly-window pruning rule                                                                                                                       |
| `appointments`   | `evaluation`     | Named for the workflow, not the entity — see `CONTEXT.md`                                                                                                         |
| `users`          | `user`           |                                                                                                                                                                   |
| `login_events`   | `login-event`    | Owns User-Agent parsing                                                                                                                                           |
| `client_history` | `client-history` | Sole writer of every history event                                                                                                                                |

### `client-history`

Renamed from `history` (#125), which was ambiguous — `login-event` is also a history. It owns
`client_history` and, under rule 1, is the **only** writer of it. The eight sites across three
domains that used to copy the same six fields by hand are now calls to `record(actor, event)`,
where `event` is a union keyed on the event type, so metadata is checked per event.

`record` takes the optional `transaction` (rule 3) and decides itself whether to pass it to
Sequelize. That is what removed the last duplication in `subscription/create.ts`, which
previously branched over an `if (transaction)` to make the same call two ways.

Each event type carries exactly one metadata shape. `plan_assigned` used to carry two — a plan
being put in place, and a later edit to its dates — which forced every plan field to be optional;
the edit case is now `dates_changed` and the commercial move is `terms_changed`, so the shapes are
tight (#141). The stored key strings live in `constants/history.constants.ts` as `HISTORY_EVENTS`
and are written as literals nowhere else, so the union is built from that constant rather than
repeating it (#143). Renaming a value there is a data change: `client_history` rows already carry
the old string and need a migration to match.

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

`report` holds those rules directly: `compute-kitchen-report-data.ts` (portion counts and
special-instruction grouping), `build-kitchen-report.ts` and `build-menu.ts` (the two `.docx`
documents), plus the two file-name functions. They lived in `utils/` until #123 — the builders
imported _backwards_ into `domains/report`, and `report` itself was a 39-line query shell that
would have failed rule 4.

`deriveClientStatus` was the same mistake in the `client` domain, and moved with them to
`domains/client/derive-client-status.ts`. Its only consumer is still
`domains/client/_helpers.ts`.

`delivery` wrote `Client.groupToken` (`set-group.ts`) until #128, which moved the whole function
to `client/set-delivery-group.ts` rather than fronting its five writes with an API. `delivery` is
now a pure view domain.

---

## Capability domains (2)

| Domain   | Purpose                                                  |
| -------- | -------------------------------------------------------- |
| `auth`   | Authenticate; sign and verify tokens. Used by middleware |
| `health` | System health reporting. Not business data               |

`auth` currently writes the device snapshot to `users` (`login.ts:29-34`); under rule 1 it
calls `user.recordLogin(...)`. Its `createUser` export is dead code duplicating `user.create`
and is deleted.

---

## Dissolved: `dashboard` (#124)

There is no business activity called "dashboard" — it was named after a tab. Its
`find-summary.ts` was five unrelated queries in a `Promise.all`, sharing nothing but a page.
It also re-stated `delivery`'s stop-counting rule because it had no domain to borrow it from —
a domain that copies another's rules is a caller, not a domain.

Each query moved to the domain that owns its data. The screen-shaped assembly moved to
`dashboard.controller.ts`, which is the honest home for screen-shaped code.

| Was                               | Now                                                                |
| --------------------------------- | ------------------------------------------------------------------ |
| `findCounts` (active / suspended) | `subscription/find-subscription-counts.ts`                         |
| `findCounts` (`deliveriesToday`)  | `delivery/count-deliveries-today.ts` — over the shared rule        |
| `findContractEnding`              | `subscription/find-contract-ending.ts`                             |
| `findBirthdays`                   | `client/find-birthdays.ts`                                         |
| `findConnections`                 | `user/find-connections.ts`                                         |
| `findMenus`                       | `menu/find-menu-status.ts`                                         |
| `findSummary`                     | `dashboard.controller.ts` — the same `Promise.all`, one layer down |

The stop-counting rule now lives once, in `delivery/_helpers.ts` as `countStops`, called by
both `count-deliveries-today.ts` and `find-route.ts`. The two callers still ask about
different days on purpose: the dashboard counts the next delivery day, so a weekend reports
the coming Monday, while the Entregas route shows the literal day.

`GET /api/dashboard` keeps its contract — the payload was compared before and after and is
byte-identical. The **frontend** `dashboard` feature and its `['dashboard']` query key are
untouched; only the backend's internal organisation changed.

---

## Structure

What `backend/src/` looks like today. The `←` notes say where a file came from, for anyone who
remembers the older layout.

```
backend/src/
  domains/
    client/                                   ← owning: clients
      _helpers.ts
      create.ts  update.ts  find-all.ts  find-by-id.ts  search.ts
      finalize.ts  soft-delete.ts
      derive-client-status.ts                 ← from utils/clientStatus.ts
      find-birthdays.ts                       ← from dashboard/
      set-delivery-group.ts                   ← from delivery/set-group.ts
      __tests__/  index.ts

    subscription/                             ← owning: subscriptions. Largest domain
      _helpers.ts                             ← keeps findUpcomingSubscription etc.
      create.ts  update.ts
      delete-upcoming-subscription.ts
      find-active-subscriptions-for-date.ts
      find-suspended-subscriptions-for-date.ts
      finalize-overlapping.ts                 ← promoted out of _helpers.ts
      finalize.ts  mark-paid.ts  remove.ts  extend-after-pause.ts   ← mark-paid from evaluation/
      pause.ts  resume.ts                                           ← with the pausedSince column
      find-contract-ending.ts  find-subscription-counts.ts          ← from dashboard/

    client-history/                           ← owning: client_history. Was history/
      find-by-client.ts
      record.ts                               ← the ONLY writer of client_history

    plan/  menu/  evaluation/  user/  login-event/     ← owning
    production/  delivery/  report/                     ← view: read, never write
    auth/  health/                                      ← capability

  models/          ← stays a shared layer. See below
  controllers/     ← thin; may compose several domains
  routes/  schemas/  middleware/  constants/
  utils/           ← shared kernel only: date, errors, logger, response,
                     sqids, sentry, devFlags, whatsappIcon
```

`client.finalize()` and the resume branch of `client.update()` stay in `client` because they
are the client-facing operations the controller calls — but they no longer write
`subscriptions` themselves. They delegate to `subscription.finalize()` and
`subscription.extendAfterPause()`. Two functions named `finalize` is deliberate: one is the
client-level action, the other the table-level rule.

Both take a subscription id rather than a client id. Picking _which_ subscription describes a
client today is `getCurrentSubscription` in `client/_helpers.ts`, shared with `withStatus`;
having `subscription` re-derive it would duplicate the selection rule to remove a write — a
trade this architecture never accepts.

### Why models stay in `models/`

The obvious move — put `Client.ts` inside `domains/client/` so ownership is visible in the
tree — is **wrong for this architecture**, and it is worth writing down so nobody attempts it.

Reads are free (rule 1). `report`, `production` and `dashboard`'s successors all legitimately
read `clients` and `subscriptions`. If the model lived in `domains/client/`, every one of
those legal reads would be a deep import into another domain's folder — indistinguishable from
the violation the lint rules exist to catch.

A shared `models/` folder is the honest expression of "any domain may read any table". What
makes ownership real is the write rule and the lint that enforces it, not the folder layout.

The same reasoning keeps `controllers/`, `routes/`, `schemas/` and `constants/` as layer
folders: they are either shared leaf values or HTTP concerns that map to routes, not to domains.

### What the migration changed, and what it did not

"Before" is the codebase at #115, when this document was written.

|                               | Before                              | Now                                                          |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| Domains                       | 14, incl. `dashboard` and `history` | **13** — `dashboard` dissolved, `history` → `client-history` |
| Writers of `client_history`   | 8 sites, 3 domains                  | **1** — `client-history.record()`                            |
| Writers of `subscriptions`    | 4 domains                           | **1** — `subscription`                                       |
| Writers of `clients`          | 4 domains                           | **1** — `client`                                             |
| Business rules in `utils/`    | 4 files                             | **0**                                                        |
| `utils/` → `domains/` imports | 2                                   | **0**                                                        |
| Deep cross-domain imports     | 0                                   | 0 — unchanged, and now lint-enforced                         |
| HTTP contracts                | —                                   | **unchanged**; this refactor is invisible from outside       |

---

## Frontend

The same instinct, adapted: the frontend has no database, so its shared mutable state is the
TanStack Query cache.

> **A feature owns its types and its query keys.**

**The frontend already complies.** Every feature invalidates only its own keys — `clients` →
`['clients', …]`, `evaluations` → `['appointments']`, `plans` → `['plans']`, `menu` →
`['menus']`, `users` → `['users']`. Zero cross-feature invalidations. This is recorded here
so that nobody later "helpfully" centralises cache management into a shared hook.

There was one exception, now closed: `Plan` used to be defined in `features/clients/types.ts`
and imported by four files in `features/plans`, while `clients` imported components and hooks
from `plans` — a circular dependency between features caused by one misplaced type. It moved to
`features/plans/types.ts`, and the arrow points one way.

Cross-feature imports are otherwise legitimate and stay: `pages/` composing features is the
point of `pages/`, and `evaluations` importing client types reflects a real domain
relationship.

---

## Enforcement

Rule 1 is a _usage_ rule, not an _import_ rule — reads are legal, so importing a model is
legal everywhere; the violation is calling `.create()` on it. Linting therefore covers most
of the surface, not all of it.

**Structural rules** — `no-restricted-imports`:

- no deep imports into a domain (`domains/*/` anything but `index`)
- no `_helpers` imports across domains
- no model imports in `controllers/`
- no `domains/` imports in `utils/`

**Static writes** — `no-restricted-syntax` with per-folder `overrides`, one per owning
domain, rejecting `Model.create` / `.update` / `.destroy` / `.bulkCreate` outside the owner.

**Not enforceable by lint:** instance writes such as `sub.update({ ... })`, where the
receiver is a local variable with no type information available to ESLint. A type-level
read-only model surface would close this, and was rejected as more indirection than the
gap justifies. It is instead narrowed by design — **domain APIs should return data, not live
Sequelize instances.** A caller that never holds a model instance cannot write through one.
This is direction for new code, not a retroactive rewrite.

Worth knowing before you trust it: the static-write rule caught **none** of the four ownership
violations this migration found — `groupToken`, `pausedSince`, `appointments` and the
`client_history` writes were all instance writes. Its value is stopping the next violation, not
finding the ones already there. `src/__tests__/ownership-lint.test.ts` lints invented source text
against the real config, including a case that pins this gap, so narrowing it later is deliberate
rather than accidental.

---

## Known debt

One item, left undone on purpose. Recorded so it is not rediscovered and re-argued.

### `groupToken` as a `clients` column — not doing this

A delivery group is a delivery concept stored as a client field. Two clients at one address are
linked by writing the same random UUID into each of their `clients.groupToken` cells; the group
exists only as that coincidence. #128 resolved the _ownership_ violation by moving the function
into `client/set-delivery-group.ts`, not by moving the model — so `delivery` reads `groupToken`
but owns no table, and is a view domain rather than an owning one.

The better model is a `delivery_groups` table owned by `delivery`, with clients referencing it.
**We considered it and decided against it** (August 2026), after the rest of this migration had
landed. What it would buy:

- The dissolve rule gets simpler. Removing a member today means counting the survivors and, if
  one is left, clearing their token too, because a group of one is not a group
  (`client/set-delivery-group.ts`). With a real row you delete the row.
- A group could carry its own data — one address for the stop, a gate code, a note for the
  driver. A shared token can carry nothing.

Neither is a problem the product has. Weighed against a production migration and rewrites across
`delivery/find-route`, `find-members`, `count-deliveries-today`, `_helpers` and `client/find-by-id`,
the trade did not pay. Nothing is blocked by leaving it.

**What would change the answer:** the first feature that wants to store something about the stop
rather than about each client in it. At that point the table is the cheap way to build the
feature, not a refactor. Until then, `groupToken` stays where it is, and `delivery` stays a view
domain — which rule 4 permits, because it holds a rule and not just a query: `countStops` in
`delivery/_helpers.ts` is where "a group is one stop" lives.
