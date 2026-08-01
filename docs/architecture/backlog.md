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
- [x] **#119** — item 1: `backend/src/services/` → `backend/src/domains/`. 41 TypeScript files
      (88 import and `jest.mock` lines) plus 5 markdown files. ADR-003 and the archived
      design/implementation prompts keep their `services/` paths as historical record.
- [x] **#120** — item 2: the boundary leaks. Deleted the dead `auth.createUser`; moved
      `finalizeOverlappingSubscriptions` into `subscription/finalize-overlapping.ts`; added
      `evaluation.clientHasAppointment` so `client.controller.ts` stops importing a model; turned
      on the three structural lint rules at `error`. The fourth rule — no `domains/` imports in
      `utils/` — waits for item 4.
- [x] **#122** — item 3: `Plan` moved from `features/clients/types.ts` to
      `features/plans/types.ts`. 18 files: 7 in `features/plans`, 8 in `features/clients`,
      `PlansPage.tsx`, and both `types.ts`. `features/plans` now imports nothing from
      `features/clients`, so the arrow points one way. `Subscription.plan` keeps its type by
      importing `Plan` back from `plans`.
- [x] **#123** — item 4: `utils/` emptied of business rules. `kitchenReportData.ts` and
      `kitchenReportBuilder.ts` became `domains/report/compute-kitchen-report-data.ts`,
      `build-kitchen-report.ts` and `kitchen-report-file-name.ts`; `menuBuilder.ts` became
      `build-menu.ts` and `menu-file-name.ts`; `clientStatus.ts` became
      `domains/client/derive-client-status.ts`. `utils/` now holds only leaf modules and the
      fourth structural lint rule is enforced. Two corrections to what this item assumed:
      `kitchenReportBuilder.ts` was 337 lines, not over 400 — it was split anyway, on the
      one-public-function-per-file rule, which is the real reason. And `.docx` output cannot be
      compared byte-for-byte: `docx` stamps `dcterms:created` into `docProps/core.xml`, so two
      runs of identical input never match. Identity was checked by unzipping both and diffing
      every part except that one; kitchen report and menu card both came out unchanged.
- [x] **#124** — item 5: the `dashboard` domain is gone. Its six queries moved to the domains
      that own their data (`subscription`, `delivery`, `client`, `user`, `menu`) and
      `findSummary` became the same `Promise.all` inside `dashboard.controller.ts`. The
      `GET /api/dashboard` payload was captured from the running app before and after: byte
      identical. One correction to what this item assumed: the duplicated stop-counting rule
      was not at `delivery/find-counts.ts:13` — no such file existed. It was inside
      `find-route.ts`, written as `groups.length + singles.length` per zone, so it was not a
      line that could simply be deleted: the same rule stated twice over different shapes
      (subscriptions vs. client rows) and different granularities (one total vs. per zone).
      Both now call `countStops` in `delivery/_helpers.ts`.
- [x] **#125** — item 6.1: `client-history` is the only writer of `client_history`. The domain
      folder was renamed from `history/`, and the eight hand-copied sites became
      `record(actor, event)` calls — 27 lines of duplicated field-copying replaced by 6 in
      `client`, and the `if (transaction) … else …` pair in `subscription/create.ts` collapsed
      into one call, since `record` takes the optional transaction itself. Every backlog line
      reference in this item was accurate. The `plan_assigned` collision found while typing the
      event union — one event type carrying two different metadata shapes — was left as-is and
      split out into item 6.6 rather than fixed here, so this item changed no stored row.

---

## 6. Write ownership 🔴

The core of ADR-007, and the only item that moves business logic. **Needs explicit approval
before any code is written**, and should be split across several PRs rather than one.

### 6.2 `subscription` owns `subscriptions`

Five writes live outside the domain:

```
client/finalize.ts:24                      → subscription.finalize(clientId, actor)
client/update.ts:43                        → subscription.extendAfterPause(...)
evaluation/mark-paid.ts:16                 → subscription.markPaid(id, actor)
evaluation/revert-pending-renewal.ts:25    → subscription.remove(id)
evaluation/delete-pending-client.ts:11     → subscription.remove(...)
```

Each new function is **intention-shaped** (rule 2) — `finalize`, not
`update({ contractEndDate, finalizedAt })`. The rule for finalizing moves out of `client` and
into its owner.

Note `client/update.ts:23-45` currently holds the entire resume calculation behind a
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
_before_ the update it describes, so a failure leaves an orphan event). `client-history.record`
already takes the parameter — the callers are what still need threading.

### 6.6 Split the two meanings of `plan_assigned`

Deferred out of 6.1 so that item stayed provably behaviour-identical. `plan_assigned` is
emitted both when a plan is put in place (metadata: plan, price, dates, discount) and when a
start date or duration is later edited (metadata: dates only). `record`'s union keeps the plan
fields optional to allow both, which costs the per-event type checking that was the point.

Give the edit case its own event type, and emit `plan_changed` (debt D3) at the same time —
both are decisions about what a plan-change event should carry. Changes what lands in
`client_history`, so it needs a label in the frontend timeline; rows already written keep the
old type.

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
