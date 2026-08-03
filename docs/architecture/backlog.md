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
      D1** — see the D1 entry below for the import cycle that made the intermediate step not worth
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
- [x] **#137** — item 7: the ownership lint, all eight overrides, `.eslintrc.cjs` only. Generated
      from one `TABLE_OWNERS` map rather than hand-written, so a catch-all bans every model's
      writes in `src/domains/**` and one override per owner re-allows just its own — overrides are
      last-match-wins for a rule, which is why they cannot be collapsed into a single entry.
      **Two corrections to what this item assumed.** The `Client` override was not blocked: it
      claimed the `pausedSince` writes in `subscription` would trip it, but all three are instance
      writes (`client.update(…)`, not `Client.update(…)`), which the rule cannot match — so the
      whole item landed at once and D1 was never a prerequisite. And restating airbnb-base's four
      `no-restricted-syntax` selectors inside each override turned out to be load-bearing: a rule's
      options replace rather than merge, so omitting them silently re-allowed `for..of` in every
      domain file. Verified by removing them and watching the check go quiet.
      Worth naming plainly: the rule catches **none** of the violations this backlog has found.
      `groupToken` (#128), `pausedSince` (6.3) and `appointments` (6.7) are all instance writes.
      Its value is stopping a new static-write violation, not finding existing ones. Tested by
      linting invented source text against the real config (`src/__tests__/ownership-lint.test.ts`),
      including a test that pins the instance-write gap so a future change to it is deliberate.
- [x] **#131, #132, #134, #135** — item 6.5: every write function takes an optional `transaction`.
      Ten workflows across four PRs, behind the `withTransaction(transaction, work)` helper added
      in #131, which joins a caller's transaction or opens its own. The two this item named were
      both where it said they were. **The finding worth keeping is that threading the writes was
      the smaller half.** Four functions had a _read_ outside the transaction that decided what
      the writes would do, so the transaction was honest about atomicity and still wrong about the
      outcome: `client/set-delivery-group` (#132), `subscription/mark-paid` and
      `subscription/delete-upcoming-subscription` (#134), `evaluation/deletePendingClient` and
      `evaluation/discardPendingRenewal` (#135). The `mark-paid` one is the sharpest — it reads
      `client.pausedSince` to decide whether a sin-fecha renewal may stamp a pause date, which is
      the #115 guard; read outside the transaction it misses a pause written earlier in the same
      workflow and restamps exactly the date it exists to protect. Two consequences accepted: the
      two `evaluation` functions now open a transaction even on their no-op path, because the read
      that picks the rows belongs inside it; and `auth/login` verifies the password _outside_ the
      transaction, since `bcrypt.compare` is slow by design and holding a pooled connection across
      it buys no atomicity. One thing found and not fixed — `delete-upcoming-subscription` writes
      `appointments`, which `evaluation` owns — is now item 6.7.
- [x] **#133** — the weekend-bypass flag, split out of 6.5 rather than carried inside it. The
      start-date weekday rule ignored `BYPASS_WEEKEND` at four call sites; all four now route
      through `checkIsWeekend`, and the frontend's three copies of the rule collapsed into
      `frontend/src/features/clients/utils/startDate.ts`. Noted while in there and left alone:
      `frontend/.env` sets `BYPASS_WEEKEND`, but the frontend reads `VITE_BYPASS_WEEKEND` — Vite
      only exposes `VITE_`-prefixed vars, so the frontend half of the flag is inert. Dev-env only.
- [x] **D1 + item 6.3** — `pausedSince` moved from `clients` to `subscriptions`. The column now
      describes the plan it belongs to, so the two meanings it used to share stop colliding: a
      mid-plan pause sits on the running plan, a "sin fecha" renewal on the renewal itself.
      `subscription.pause()` / `resume()` own the write, the history event and the resume-time
      extension, which dissolves 6.3's import cycle — `subscription` writing its own column is not
      a cross-domain write, so the `client.pause()` wrapper the item planned was never needed.
      Two live bugs fixed, both reproduced against a copy of production before and after: a
      sin-fecha renewal took the client's still-running paid plan off the delivery route the day it
      was registered (Diego Guzman, paid through 28/09, dropped from the route on 03/08 — 16
      entregas to 15); and deleting that renewal left the client paused with nothing on screen
      explaining it, escapable only via Reanudar, which extended the contract as compensation for a
      pause that had withheld no meals. The #115 guard is deleted rather than moved — a brand-new
      renewal row cannot collide with a pause held on a different row. Migration backfills each
      existing pause onto the subscription `getCurrentSubscription` would have picked; production
      had zero paused clients and no `paused`/`resumed` event ever recorded, so the backfill was
      a no-op there by measurement, not by assumption.

- [x] **item 6.7** — `evaluation` is the only writer of `appointments`. The write in
      `subscription/delete-upcoming-subscription.ts` was deleted outright, with no migration and no
      wrapper: **the foreign key this item proposed adding already existed.**
      `20260724190000-create-appointments.js` declared `subscriptionId` as `ON DELETE SET NULL` from
      the day the table was created, and the constraint was verified live in both dev and
      production before a line was changed. So the manual unlink was doing by hand what Postgres
      was already doing underneath it — the item was a deletion, not a migration.
      Worth naming why it was ever load-bearing: `subscriptions` was briefly paranoid
      (`20260726000000-add-deleted-at` → `20260728000000-remove-deleted-at`), and while it was,
      `destroy()` was an `UPDATE` that no `ON DELETE` rule can fire. The hand-written clear was
      correct for that window and outlived it. Nothing else in the codebase touched `appointments`
      from outside `evaluation`, so this was the **last cross-domain write in the codebase**. What
      is left below is 6.6, which is a history-event decision rather than an ownership violation,
      and the modelling debt.

- [x] **item 6.6 + D3** — `plan_assigned` now means one thing. The edit case became
      `contract_updated` (dates only, no plan fields to be optional about) and `plan_changed` went
      from declared-but-dead to emitted, so `PlanEventMetadata` could tighten: `planId`, `discount`,
      `planName` and `planPrice` are all required, with the two plan fields nullable rather than
      absent — they are null only when the plan row is gone by the time the event is written.
      **One deviation from what this item scoped, approved before the code:** `plan_changed` fires
      on a discount change as well as a plan change. The two were the same hole — the subscription
      PATCH accepts a change to what the client pays and recorded nothing — and of the two, the
      discount is the one with a button behind it (the billing card), while `planId` is reachable
      through the API alone. One event rather than two, because `business-rules.md` already
      described this event as carrying "new cost", which is plan price minus discount. Detection is
      a comparison against the stored row, so a PATCH that resubmits the same values records
      nothing. No migration: rows already written keep `plan_assigned` and render exactly as before,
      since the timeline hides the plan chip when `planName` is absent. What is left below is the
      modelling debt alone.

---

## Modelling debt

Recorded so it is not rediscovered. None of it blocks items 1–7.

### D2. `groupToken` as a `clients` column 🟡

A delivery group is a delivery concept stored as a client field, which is why `delivery` used to
write to `clients`. #128 resolved the ownership violation by moving the function, not the model —
the concept still lives in the wrong table. A dedicated `delivery_groups` table
owned by `delivery` is the better model and would make it an owning domain — a migration, not
required by anything above.

---

## Not tracked here

`business-rules.md` lists product features that are planned but unimplemented — maximum pause
duration (`maxPauseDays` auto-finalisation), the paused-state UI end-date indicator, the
"plans expiring soon" report, and "clients by birth month". Those are product decisions, not
architecture work, and belong in whatever tracks the product roadmap.
