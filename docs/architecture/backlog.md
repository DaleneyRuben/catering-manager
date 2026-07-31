# Domain Ownership — Migration Backlog

The work required to bring the codebase in line with [ADR-007](../adr/007-domain-ownership.md)
and [domains.md](./domains.md), plus the modelling debt recorded along the way.

Items are ordered by dependency: each one assumes the ones above it have landed. Tick them
off here as they merge, and delete the file once everything is done — a backlog that outlives
its work becomes fiction.

**Legend**
🟢 free — no behaviour change, mechanical ·
🟡 careful — behaviour must be proven identical ·
🔴 approval — changes business logic, needs sign-off before any code

---

## Done

- [x] **#115** — guard the `pausedSince` overwrite on a sin-fecha renewal for an already-paused
      client. Live bug: cost six delivery days in the reproduced case. Symptom only — see D1.
- [x] **#116** — ADR-007, `domains.md`, the standards-skill rules, and the
      `domain.md` → `business-rules.md` rename.
- [x] **#117** — this backlog, and the target structure section in `domains.md`.

---

## 1. Rename `services/` → `domains/` 🟢

We call the unit a **domain**; the folder containing them says `services/`. That is the same
mismatch we removed by renaming `domain.md`, left in the more visible place.

It is not only consistency. ADR-007 changed what those folders _are_: before, a service layer
of stateless functions over shared data — after, owners of tables with exclusive write rights.
`services/` describes the old thing. The rename encodes the decision. It also removes the
collision with `frontend/src/services/api.ts`, a genuinely different meaning of the word.

**Measured cost:** 56 import lines across 41 source files (36 controllers, 14 routes, 3 utils,
2 middleware, 1 types), 65 lines across 23 test files, and 10 markdown files — 74 files in
all. The test figure is **33 imports plus 32 `jest.mock('…/services/…')` calls**; the mock
paths are strings, so typecheck will not catch them and only a full test run will. Markdown
includes `.claude/skills/project-standards/skill.md`, which must change in the same PR or it
will keep directing new code to the old path. **No** coupling in `jest.config`, `tsconfig`,
`.eslintrc.cjs` or `package.json`.

Supersedes ADR-003's `services/<domain>/` path convention — record that in ADR-007 rather than
editing ADR-003, which is a historical record.

**Do it first.** Every later item touches controllers and routes anyway; renaming first means
they are written against the right paths once instead of being rewritten. Its own PR — a
74-file mechanical diff should not share a review with anything that needs thinking about.

> Paths elsewhere in this backlog are written as `services/…` because that is where the files
> live until this item lands. Read them as `domains/…` afterwards.

---

## 2. Boundary leaks (backend) 🟢

Small, unrelated fixes that share one goal: make the three structural lint rules pass.

### 2.1 Delete dead `auth.createUser`

`services/auth/create-user.ts` duplicates `user.create` — same bcrypt, same `SALT_ROUNDS`,
same insert — and has **zero callers**. It also makes `users` look like it has two writers.

Delete the file, its test, and the `auth/index.ts` export.

### 2.2 Promote `finalizeOverlappingSubscriptions` to public API

`evaluation/mark-paid.ts:7` imports `../subscription/_helpers`, which ADR-003 rule 6 forbids.
Re-exporting from the index is not the fix — `_helpers.ts` is never re-exported either.

Move the function to `subscription/finalize-overlapping.ts` with its own test file, export it
from `subscription/index.ts`, and update its three callers (`subscription/create.ts:39`,
`subscription/update.ts:44`, `evaluation/mark-paid.ts:21`).

### 2.3 Get the `Appointment` model out of `client.controller.ts`

`client.controller.ts:57` runs `Appointment.count({ where: { clientId } })` to decide whether a
Nutricionista may view a client (see ADR-006). Controllers must not touch models, and
`evaluation` owns `appointments`.

Add `evaluation.clientHasAppointment(clientId)` and call that instead.

### 2.4 Turn on the structural lint rules

Once 2.1–2.3 land, add to `backend/.eslintrc.cjs` at `error`:

| Rule                                                               | Violations after 2.1–2.3 |
| ------------------------------------------------------------------ | ------------------------ |
| no deep imports into a domain (`services/*/` anything but `index`) | 0 after 2.2              |
| no `_helpers` imports across domains                               | 0 after 2.2              |
| no model imports in `controllers/`                                 | 0 after 2.3              |

The first two rules overlap: `evaluation/mark-paid.ts:7` is the only violation of either, and
2.2 clears both. The narrower `_helpers` rule is still worth stating separately — it is the
one deep import that a future reader would be tempted to excuse.

The fourth rule — no `services/` imports in `utils/` — waits for item 4.

---

## 3. `Plan` type ownership (frontend) 🟢

`Plan` is declared in `features/clients/types.ts` and imported by seven files in
`features/plans`, while `clients` imports components and hooks from `plans` — a circular
dependency between features caused by one misplaced type.

Move `Plan` to `features/plans/types.ts` and update the imports: `PlanCard.tsx`,
`PlanModal.tsx`, `PlanRadioList.tsx`, `usePlans.ts`, the three matching test files
(`PlanCard.test.tsx`, `PlanModal.test.tsx`, `PlanRadioList.test.tsx`), plus the `clients` side.

Type-only; `yarn typecheck` proves it.

---

## 4. Empty `utils/` of business rules 🟡

`utils/` is meant to be the shared kernel — leaf modules that depend on nothing. Four files in
it hold real domain rules instead, and two of them import _backwards_ into the service layer:

| File                                        | Holds                                                                                      | Moves to           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------ |
| `utils/kitchenReportBuilder.ts` (337 lines) | pastelería / producción / hiperproteico / "no dar" structure; imports `../services/report` | `services/report/` |
| `utils/kitchenReportData.ts`                | portion counts, special-instruction grouping; imports `../services/report`                 | `services/report/` |
| `utils/menuBuilder.ts`                      | menu-card `.docx` construction; imports `../models/Menu`                                   | `services/report/` |
| `utils/clientStatus.ts`                     | `deriveClientStatus` — the whole derived-status rule                                       | `services/client/` |

`services/report` is only 39 lines of queries today; by rule 4 it is not a domain until the
first three land. `clientStatus.ts` has exactly one consumer (`services/client/_helpers.ts`),
so its move is contained.

Afterwards `utils/` holds only leaf modules — `date`, `errors`, `logger`, `response`, `sqids`,
`sentry`, `devFlags`, `whatsappIcon` — and the fourth lint rule from 2.4 can go on.

Mostly file moves, but `kitchenReportBuilder.ts` is over the 400-line guidance — split it while
moving. `report.controller.ts` stops importing `utils/menuBuilder` and imports the domain
instead. **The `.docx` output must be byte-identical**: download a kitchen report and a menu
card before and after and compare.

`EXPIRY_THRESHOLD_DAYS` (`constants/subscription.constants.ts`) is read by `clientStatus`.
Constants stay where they are — they are leaf values with no logic, and both domains legitimately
read them.

---

## 5. Dissolve the `dashboard` domain 🟡

It owns no rule, and duplicates `delivery`'s stop-counting logic (`find-counts.ts:13`) because
it had no domain to borrow from.

| Was                               | Goes to                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| `findCounts` (active / suspended) | `subscription`                                                 |
| `findCounts` (`deliveriesToday`)  | `delivery` — deletes the duplicated rule                       |
| `findContractEnding`              | `subscription`                                                 |
| `findBirthdays`                   | `client`                                                       |
| `findConnections`                 | `user`                                                         |
| `findMenus`                       | `menu`                                                         |
| `findSummary`                     | `dashboard.controller.ts` — same `Promise.all`, one layer down |

`GET /api/dashboard` must return a byte-identical payload; the frontend `dashboard` feature and
its `['dashboard']` query key do not change. Verify by comparing the response before and after.

---

## 6. Write ownership 🔴

The core of ADR-007, and the only item that moves business logic. **Needs explicit approval
before any code is written**, and should be split across several PRs rather than one.

### 6.1 `client-history` becomes the only writer

Eight sites hand-copy the same six-field event shape:

```
subscription/create.ts:87-88      subscription/update.ts:49, :78
subscription/delete-upcoming-subscription.ts:52
evaluation/mark-paid.ts:40
client/finalize.ts:26   client/soft-delete.ts:10   client/update.ts:28
```

Replace with `clientHistory.record(actor, event)` — one writer, with a discriminated union on
`eventType` so metadata is type-checked per event. Rename the `history` domain folder to
`client-history` in the same PR.

**Highest value per hour in this backlog**: it removes the duplication _and_ establishes the
pattern every later item follows.

### 6.2 `subscription` owns `subscriptions`

Five writes live outside the domain:

```
client/finalize.ts:24                      → subscription.finalize(clientId, actor)
client/update.ts:50                        → subscription.extendAfterPause(...)
evaluation/mark-paid.ts:16                 → subscription.markPaid(id, actor)
evaluation/revert-pending-renewal.ts:25    → subscription.remove(id)
evaluation/delete-pending-client.ts:11     → subscription.remove(...)
```

Each new function is **intention-shaped** (rule 2) — `finalize`, not
`update({ contractEndDate, finalizedAt })`. The rule for finalizing moves out of `client` and
into its owner.

Note `client/update.ts:38-52` currently holds the entire resume calculation behind a
`pausedSince` field check. That is subscription lifecycle logic living in a generic CRUD
updater, and it moves with this item.

### 6.3 `client` owns `clients`

Twelve write statements live outside the domain, across four files:

```
subscription/create.ts:93-94, :99-100                     (pausedSince — each an if/else
subscription/update.ts:46                                  transaction pair, so 2 decisions)
evaluation/mark-paid.ts:25, :28                           (pausedSince)
delivery/set-group.ts:13, :16, :24, :29, :35              (groupToken)
```

`set-group.ts` is the bulk of it and the least obvious: only `:13` and `:24` are instance
writes on the client being edited. `:16`, `:29` and `:35` are `Client.update(…, { where })`
statements rewriting _other_ clients' tokens — evicting old members and stamping new ones.
Any `client.setDeliveryGroup()` API has to cover those too, or the group logic breaks.

Becomes `client.pause()` / `client.resume()` / `client.setDeliveryGroup()`. This also makes
`delivery` a pure view domain.

### 6.4 `auth` stops writing `users`

`auth/login.ts:29-34` writes the device snapshot directly. Add `user.recordLogin(id, device)`.

### 6.5 Optional `transaction` on every write function

Rule 3. Once a workflow crosses domains it is several API calls, and they must commit or fail
together. `subscription/create.ts` already threads a transaction — make it universal.

Watch for the cross-domain writes that have **no** transaction today, and gain one here:
`client/finalize.ts` (subscription + history) and `subscription/update.ts` (history written
_before_ the update it describes, so a failure leaves an orphan event).

---

## 7. Ownership lint 🟢

After item 6, add `no-restricted-syntax` overrides — one per owning domain — rejecting
`Model.create` / `.update` / `.destroy` / `.bulkCreate` outside the owner.

Known and accepted gap: instance writes (`sub.update({ ... })`) cannot be caught, because
ESLint has no type information for a local variable. Narrowed by returning data rather than
live Sequelize instances from domain APIs; otherwise it rests on review.

---

## Modelling debt

Recorded so it is not rediscovered. None of it blocks items 1–7.

### D1. `pausedSince` is on the wrong table 🔴

Root cause of #115. `pausedSince` is a column on `clients`, but a pause applies to a **plan**.
Worse, one column carries two meanings — a mid-plan pause (where the date drives how many days
are owed) and a "sin fecha" renewal awaiting a start date (where it is only a marker). The
resume code tells them apart by _inferring_ from whether a start date exists
(`client/update.ts:38-52`).

A client also accumulates many subscriptions, so nothing records _which_ plan was paused; the
code assumes "the current one". Both situations can hold at once — confirmed against the
running app.

**Direction:** move `pausedSince` onto `subscriptions` and represent the two situations
distinctly. Migration + rewrite of derived status and pause/resume. Deserves its own design
session; the #115 guard holds until then.

### D2. `groupToken` as a `clients` column 🟡

A delivery group is a delivery concept stored as a client field, which is why `delivery` writes
to `clients`. Item 6.3 resolves the ownership violation. A dedicated `delivery_groups` table
owned by `delivery` is the better model and would make it an owning domain — a migration, not
required by anything above.

### D3. `plan_changed` is declared but never emitted 🟡

The event type exists; changing only the assigned plan on an existing subscription records no
history. Noted in `business-rules.md`. After 6.1 this is a one-function change.

---

## Not tracked here

`business-rules.md` lists product features that are planned but unimplemented — maximum pause
duration (`maxPauseDays` auto-finalisation), the paused-state UI end-date indicator, the
"plans expiring soon" report, and "clients by birth month". Those are product decisions, not
architecture work, and belong in whatever tracks the product roadmap.
