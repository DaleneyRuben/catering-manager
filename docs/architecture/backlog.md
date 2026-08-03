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
- [x] **#127** — item 6.2: `subscription` is the only writer of `subscriptions`. All five sites
      were where this file said they were. `markPaid` moved wholesale from `evaluation` rather
      than being fronted by a thin flag-setter: it is the deferred half of `subscription/create`
      (same three side effects — overlap finalization, history, `pausedSince`), and splitting the
      pair across two domains is what let them drift. **The drift was live**: the already-paused
      guard from #115 was in `create.ts` and missing from `mark-paid.ts`, so a paused client
      renewed sin fecha through an unpaid appointment lost their remaining pause days when an
      admin confirmed payment. Fixed first, in its own red/green pair, then the move.
      Two deviations from what this item assumed. `finalize` and `extendAfterPause` take a
      **subscription id**, not a client id: choosing which subscription describes a client today
      is `getCurrentSubscription`, shared with `withStatus` in `client/_helpers.ts`, and moving
      it would have duplicated a selection rule to remove a write. And only the `pausedSince`
      rule plus the event-type map were extracted into `subscription/_helpers.ts` — converging
      the history metadata too would have forced `create` to read the persisted row instead of
      the DTO, rewriting ~20 test mocks for no rule-level gain. `client/finalize.ts` still
      records `finalized` itself, so the event survives a client with no subscription, as before.
- [x] **#128** — item 6.3, `groupToken` half only: `client` is the only writer of `groupToken`.
      `delivery/set-group.ts` moved wholesale to `client/set-delivery-group.ts` — all five writes,
      not just the two instance ones, because the three `Client.update(…, { where })` statements
      are the same grouping rule applied to other members' rows; fronting them with a client API
      while the rule stayed in `delivery` would have split one rule across two domains, which is
      what #127 found had already gone wrong once. `delivery` is now a pure view domain. The
      endpoint already lived on the client controller (`PUT /api/clients/:id/group`), so that
      import now points at the domain owning the table. The `pausedSince` half is **deferred to
      D1** — see 6.3 below for the import cycle that makes the intermediate step not worth
      building.
- [x] **#130** — item 6.4: `auth` no longer writes `users`. The device snapshot write moved to
      `user/record-login.ts` as `recordLogin(id, device)`, which takes the device but not the
      timestamp — when "now" is belongs to the owner, not the caller. The device shape is `user`'s
      own exported `LoginDevice` type rather than an import of `login-event`'s `ParsedDevice`:
      both are built on `DeviceType` from the model, so they cannot drift on the enum, and `user`
      gains no dependency on a domain it only receives data from. One consequence worth naming:
      `login` had the `User` instance in hand and now re-reads it by id inside `recordLogin`, so a
      successful login costs one extra `findByPk`. Accepted — the alternative is passing a live
      Sequelize instance across a domain boundary, which is what item 7 wants less of, not more.

---

## 6. Write ownership 🔴

The core of ADR-007, and the only item that moves business logic. **Needs explicit approval
before any code is written**, and should be split across several PRs rather than one.

### 6.3 `client` owns `clients` — `pausedSince` half, blocked on D1

The `groupToken` half landed in #128 as `client.setDeliveryGroup()`. What remains is the
`pausedSince` write: **three statements across two files**, both in `subscription`.

```
subscription/_helpers.ts:42, :47   (applyRenewalPauseState — one clear, one stamp)
subscription/update.ts:46          (cleared when a sin-fecha renewal is given a start date)
```

The count this item carried before — twelve statements across four files, naming
`subscription/create.ts` and `evaluation/mark-paid.ts` — is stale twice over. #127 moved
`markPaid` into `subscription` and collapsed both callers onto one helper, so its four
`pausedSince` writes became the two in `_helpers.ts`; #128 removed the five `groupToken` ones.

**Why the rest waits for D1.** The obvious fix — add `client.pause()` / `client.resume()` and
call them from `subscription` — cannot be written today. `client/update.ts:6` already imports
`extendAfterPause` from `subscription`, so an import back the other way closes a loop, and
`import/no-cycle` (error, inherited from airbnb-base) rejects it. Confirmed on the #128 branch
rather than assumed:

```
subscription/_helpers.ts
  2:1  error  Dependency cycle via ../client:6=>./update:5=>../subscription:6
```

Breaking the loop means moving the pause/resume decisions — the history event and the
resume-time contract extension — out of `client` and into `subscription`. That is most of what
D1 does anyway, and D1 then deletes the `client.pause()` / `client.resume()` pair it would have
created: once `pausedSince` is a column on `subscriptions`, `subscription` writing it is not a
cross-domain write at all. The wrapper would ship with a known expiry date. Do D1 first; this
item closes with it.

### 6.6 Split the two meanings of `plan_assigned`

Deferred out of 6.1 so that item stayed provably behaviour-identical. `plan_assigned` is
emitted both when a plan is put in place (metadata: plan, price, dates, discount) and when a
start date or duration is later edited (metadata: dates only). `record`'s union keeps the plan
fields optional to allow both, which costs the per-event type checking that was the point.

Give the edit case its own event type, and emit `plan_changed` (debt D3) at the same time —
both are decisions about what a plan-change event should carry. Changes what lands in
`client_history`, so it needs a label in the frontend timeline; rows already written keep the
old type.

### 6.7 `evaluation` owns `appointments` — the renewal-deletion write, blocked on a cycle

Found while threading transactions in 6.5, and flagged in #134 rather than fixed there. **One
write, in `subscription`:**

```
subscription/delete-upcoming-subscription.ts:53-54   (find the appointment that resolved into
                                                      this renewal, clear its subscriptionId)
```

Deleting a renewal registered ahead of time has to clear the link on the appointment that
resolved into it, or the appointment points at a destroyed row. Only the link is cleared — the
date stays as it was, so a past appointment is pruned on the next queue read rather than pushed
back onto the Nutricionista's list. The rule is right; it is written in the wrong domain.

**Why the obvious fix fails.** Both shapes of it are rejected by lint. Confirmed on a branch, not
assumed. Adding `evaluation.unlinkSubscription()` and calling it closes a loop — `evaluation`
already imports `subscription` in four files, because resolving a cita creates a subscription:

```
subscription/delete-upcoming-subscription.ts
  9:1  error  Dependency cycle via ./convert-appointment:11=>../subscription:7  import/no-cycle
```

Reaching past the index at that one function dodges the cycle and lands on the other rule —
`no-restricted-imports`: "Import another domain through its index only, never a function file
directly."

**Direction: the foreign key, not a wrapper.** `appointments.subscriptionId` declared
`ON DELETE SET NULL` clears the link whenever a subscription is deleted, so neither domain writes
the other's table and the violation dissolves rather than being fronted by an API. Same shape as
D1 closing 6.3 — move the model so the cross-domain write stops existing, instead of wrapping it.
A migration, so it wants its own scheduling. It changes nothing for `deletePendingClient` or
`discardPendingRenewal`: both destroy the appointment row outright, so `SET NULL` never fires for
them.

Composing it in `subscription.controller.ts` is possible today and was rejected: it lifts the rule
out of every domain into a route handler, where the next caller of `deleteUpcomingSubscription`
would not inherit it.

---

## 7. Ownership lint 🟢

After item 6, add `no-restricted-syntax` overrides — one per owning domain — rejecting
`Model.create` / `.update` / `.destroy` / `.bulkCreate` outside the owner.

The `Client` override is the one that cannot go in early: a rule keyed on the model cannot
exempt a single column, so it stays blocked by the `pausedSince` writes in `subscription` until
D1 lands (see 6.3). Every other model's override is unaffected.

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
session; the #115 guard holds until then — now in one place (`subscription/_helpers.ts`), after
#127 found it had been missed on the mark-paid path. That a one-column rule could be half-applied
for two months is the clearest argument yet for fixing the model rather than the symptom.

**Now blocking, not just debt.** The remaining half of item 6.3 and the `Client` half of item 7
both wait on this — the import cycle in 6.3 is the same wrong-table problem showing up as a
build error. Scheduling it is no longer optional if the backlog is to be finished and deleted.

### D2. `groupToken` as a `clients` column 🟡

A delivery group is a delivery concept stored as a client field, which is why `delivery` used to
write to `clients`. #128 resolved the ownership violation by moving the function, not the model —
the concept still lives in the wrong table. A dedicated `delivery_groups` table
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
