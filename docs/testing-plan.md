# Regression Testing Plan — post `refactor/service-folders`

**Purpose:** the backend was fully restructured (monolithic `*.service.ts` files → one-function-per-file domain folders, controllers rewired to namespace imports) and merged with an in-flight fix from `main` (suspension-aware `contractEndDate` recalculation). Automated tests pass (backend 371/371, frontend 718/718), typecheck and lint are clean — but backend unit tests mock the model layer, so a wiring mistake (controller calling the wrong exported function, a branch reordered during extraction) could still pass mocked tests while being broken at runtime. This plan is a manual, click-through regression pass to catch that class of bug before it ships.

**Status:** EXECUTED 2026-07-02 against `refactor/service-folders` (backend :4000 + frontend :3000, local dev DB). Method: Playwright-driven UI plus direct API verification with real credentials for all 4 roles. See "Execution results" below.

---

## Execution results (2026-07-02)

**Verdict: no regressions caused by the refactor.** Every lifecycle branch, role check, and calculation tested matched the spec, including the highest-risk path (the rewritten `subscription/update.ts` with the merged suspension fix). Findings below are pre-existing issues discovered along the way, none introduced by the refactor.

### Passed (verified end-to-end)

- **Auth & session (§1):** all 4 role logins + role-based landing redirects; logout; corrupted-token → forced `/login`.
- **Role matrix (§2):** full API matrix (7 endpoint groups × 4 roles) plus UI route guards (`/sin-acceso` bounces) and sidebar filtering — all correct, including the kitchen-report narrowing (kitchen gets 403 despite router-level access).
- **Wizard create (§3):** step validation, restriction dedupe, weekend start-date rejection, salad-conditional "Ensalada grande" section, price→discount back-derivation, back-navigation state preservation; persisted record verified field-by-field incl. `specialInstructions` and `plan_assigned` history.
- **Update branches (§4):** Branch A duration change (end 17/07 ✓), Branch A startDate change **dropping a pre-start suspension and re-extending for survivors (the merged fix — end 23/07 ✓)**, Branch B add suspensions (+2 delivery days skipping weekend, `suspended` event ✓), Branch B removal (end shrinks, silent ✓), sin-fecha activation clears `pausedSince` ✓.
- **Renewal/reactivation (§5):** "Al vencer" auto-start day-after-end; "Sin fecha" → paused renewal (null dates, `plan_renewed`, "Crear pausado"); reactivation modal forces a date (no Sin fecha), weekend rejected, `reactivated` event, `pausedSince` cleared.
- **Pause/resume (§6):** `paused`/`resumed` events; resume end-date math exact (`addDeliveryDays(today, remaining)` → 06/07 ✓).
- **Finalize (§7):** end=today, `finalizedAt` set, status `ended`, Plan tab removed, CTA flips to Reactivar, `finalized` event.
- **Suspension calendar (§8):** Mon–Fri only, ranges disabled correctly, selectable window grows/shrinks with pending changes, live end-date preview correct.
- **Reports (§9):** delivery list `.xlsx` / menu card `.docx` / kitchen report `.docx` all download; wrong date format → 400 on each; no-menu → 404; kitchen role card hidden in UI and 403 at API. (Weekend rejection covered by unit tests only — `BYPASS_WEEKEND=true` in local `.env` disables it by design.)
- **Delivery groups (§12):** shared token, mutual `groupMembers`, group = one stop in route (`entregas` count ✓), auto-dissolve when reduced to one member.
- **Plans CRUD (§13):** create/update/delete, meals ≥1 validation, `/plans/client-counts` route not swallowed by `/:id`.
- **Users CRUD (§17):** create + login as new user, role-only update preserves password, short password rejected, delete.
- **List filters (§10):** status/q/restriction filters return correct sets.
- **History completeness (cross-cutting):** all 8 event types observed exactly once-per-action on the test client.
- **Health page (§18):** renders, refetch works (super_admin only).
- Dashboard, delivery route view, menu week grid: rendered correctly with live data.

### Findings (all pre-existing — reproduce on `main`, not refactor regressions)

1. **[HIGH] Overlapping subscriptions double-count a client.** If a renewal/reactivation start date falls before the previous contract's end (old sub not finalized), the client matches two subscriptions and appears **twice** in the delivery route group (and would be double-counted in kitchen report portions) for the overlap days. Seen live on the 03/07 route during testing.
2. **[MED] Plans page shows "0 clientes activos" on every card.** `GET /plans/client-counts` returns raw integer DB ids as keys while `/plans` returns sqid-encoded ids — the frontend can never match them.
3. **[MED] ContractCard stale draft after renewal.** The card seeds its edit draft via `useState(sub…)` at mount; after a renewal swaps `subscriptions[0]` without a remount, opening the editor shows the old contract's values — saving would write them onto the new subscription. Reload/cancel resyncs.
4. **[LOW] `GET /clients/!!!` → 500** (special chars crash id decode; other garbage ids 404 cleanly).
5. **[LOW] `GET /clients/<garbage>/history` → 200 []** instead of 404 (history endpoint skips client-existence check).
6. **[LOW] Step-3 wizard shows negative discount transiently** (Precio final > base displays "Descuento −60"); the submitted value clamps to 0, so display-only.
7. **[LOW] 401 handler clears `auth_token` but not `auth_user`** in localStorage (rehydration guard makes it harmless today; asymmetric with `clearAuth`).
8. **[OBS] Duration pre-fills 20** in wizard and renewal modal — domain doc says "no UI default".
9. **[OBS] Special instructions don't carry over on renewal** (new subscription starts with `{}`) — confirm intended.
10. **[OBS] Single-member "group" renders as a group card** in the delivery route when the other members' subscriptions lapse (counts correctly as 1 stop).

### Not covered (needs real conditions or prod-like env)

- Weekend-day live behavior (BYPASS_WEEKEND on locally; unit-tested).
- `maxPauseDays` auto-finalization (needs 30-day elapse or clock manipulation).
- Menu rolling-week pruning at a week boundary (write-path skipped to avoid polluting shared dev menus).
- Dashboard weekend label variants (needs actual weekend).
- User "Activo" badge 7-day boundary.

Test artifacts: two `ZZ Test *` clients created and soft-deleted (rows remain in DB with `deletedAt` set — purge manually if desired); one test plan and one test user created and hard-deleted.

---

## 0. How to use this document

- Check off each item while testing against a real running instance (backend + Postgres + frontend dev server).
- Each section lists: the feature, the exact steps, the expected result, and — where relevant — a "**Why this matters**" note flagging what the refactor specifically put at risk.
- Sections are ordered by priority (P0 → P2). If time is short, stop after P0.
- Test data note: several flows are date-sensitive (weekend rejection, business-day math). Steps below assume **today is a weekday**; where a weekend-specific check is needed it's called out explicitly and can be done by temporarily picking dates rather than waiting for a real weekend.

---

## P0 — Highest risk (subscription lifecycle, auth/roles, report downloads)

### 1. Auth & session

- [ ] Log in with valid super_admin credentials → redirected to `/`.
- [ ] Log in with valid `kitchen` credentials → redirected to `/menu`.
- [ ] Log in with valid `delivery` credentials → redirected to `/entregas`.
- [ ] Log in with wrong password → generic "invalid credentials" error (does not reveal whether username exists).
- [ ] While logged in, manually clear/corrupt the stored token (devtools) and trigger any API call → app force-redirects to `/login`.

### 2. Role-based route access (test every role × every route, not just via nav clicks)

For each role, navigate **directly by URL** (not by clicking nav) to every route and confirm the guard fires:

| Route           | super_admin | admin | kitchen          | delivery |
| --------------- | ----------- | ----- | ---------------- | -------- |
| `/` (dashboard) | ✅          | ✅    | ❌→`/sin-acceso` | ❌       |
| `/clientes*`    | ✅          | ✅    | ❌               | ❌       |
| `/planes`       | ✅          | ✅    | ❌               | ❌       |
| `/menu`         | ✅          | ✅    | ✅               | ❌       |
| `/informes`     | ✅          | ✅    | ✅               | ❌       |
| `/entregas`     | ✅          | ✅    | ❌               | ✅       |
| `/usuarios`     | ✅          | ❌    | ❌               | ❌       |
| `/health`       | ✅          | ❌    | ❌               | ❌       |

- [ ] Sidebar nav also only shows the links each role is allowed to see.

**Why this matters:** role checks live in both router guards and per-route backend middleware; a namespace-import mistake in a controller could silently drop a `requireRole` call.

### 3. Subscription — create (new client wizard, Step 3 → Step 4)

- [ ] Create a client with a plan, `startDate` = a weekday, `duration` = e.g. 20 → contract end date preview matches `addBusinessDays(startDate, duration-1)`.
- [ ] Try to pick a weekend as `startDate` → rejected client-side with the weekday error message.
- [ ] Confirm history tab shows a `plan_assigned` event with correct plan/price.
- [ ] Select a plan that includes `salad` → "Ensalada grande" checkbox appears; check it → confirm the client's subscription is created with `specialInstructions.salad = 'DAR GRANDES'`.
- [ ] Select a plan **without** `salad` → confirm the special-instructions section does not render at all.

### 4. Subscription — update via Contract card (`PATCH /clients/:id/subscriptions/:id`)

This endpoint has **three mutually exclusive branches** decided by which fields are present — test each in isolation:

- [ ] **Branch A (startDate/duration present):** edit only `duration` → `contractEndDate` recalculates from existing `startDate`; any `suspendedDates` before the (unchanged) `startDate` are untouched, dates still valid are preserved and the end date is extended by their count.
- [ ] Edit `startDate` to a later date where some existing suspensions now fall **before** the new start → confirm those suspensions are dropped and the end date reflects only surviving suspensions (this is the exact fix merged from `main` — verify it didn't regress).
- [ ] Editing `startDate` on a paused-with-no-date client → confirm `pausedSince` is cleared (client becomes active).
- [ ] **Branch B (suspendedDates present, no startDate/duration):** add a suspension day via the Suspend modal → `contractEndDate` pushes forward by 1 business day; remove one → pulls back by 1 business day; confirm removing a suspension does **not** create a history row (silent per spec) while adding one does (`suspended` event).
- [ ] **Branch C (neither present):** edit only the plan or discount on Contract/Billing card → `contractEndDate` is untouched, no history row for dates.
- [ ] Confirm the three branches are truly mutually exclusive: submitting `startDate` **and** `suspendedDates` together (if the UI ever allows it) follows Branch A priority, not B.

**Why this matters:** this is the exact function (`update.ts`) whose file was fully rewritten during the refactor and then had the `main` merge auto-applied on top — highest risk of a dropped or reordered branch.

### 5. Subscription — renewal / reactivation (`RenewalModal`)

- [ ] Renew an active client with "Elegir fecha" (future weekday) → new `contractEndDate` calculated correctly, history shows `plan_renewed`.
- [ ] Renew with "Al vencer" → start date auto-fills to the day after current contract end.
- [ ] Renew with "Sin fecha" → client becomes paused (`pausedSince` set to today), confirm button read "Crear pausado", warning banner shown.
- [ ] Reactivate an `ended` client → date picker is **required** (no "Sin fecha" option), must be ≥ tomorrow and a weekday; confirm history shows `reactivated` and `pausedSince` is cleared.
- [ ] Try to pick "today" as the reactivation/renewal date → rejected (today is never valid per domain rules).

### 6. Pause / Resume

- [ ] Pause an active client from the header button → `pausedSince` set to now, history `paused` event, client excluded from dashboard "active" counts and from kitchen/delivery views for that day.
- [ ] Resume a paused client → history `resumed` event; verify the new `contractEndDate` is computed as `nextClientDeliveryDay(resumeDate) + (remainingDays - 1)` business days, i.e. resuming on a Monday gives first delivery on Tuesday.
- [ ] Confirm the UI's "pause preview end date" (`contractEndDate + 1 business day`, display-only) is never what actually gets persisted — the real value should come from the resume calculation above, not the preview.

### 7. Finalize plan

- [ ] Finalize an active client → `contractEndDate` set to today, client immediately excluded from active counts/reports, history `finalized` event, "Finalizar plan" menu item disappears (now `ended`), header CTA flips to "Reactivar".

### 8. Suspensions calendar

- [ ] Open Suspend modal, confirm selectable range is `[today - 7 days, current effective end]` — dates before `today-7` are disabled.
- [ ] Add 2 suspension days, confirm "Nuevo fin de contrato" preview updates and matches the example in domain docs (Fri Dec 15 + 2 suspensions → Tue Dec 19, skipping the weekend).
- [ ] Save → confirm kitchen report / delivery route for a suspended day excludes that client's portion count.

### 9. Reports downloads — all three, exercise weekend + date-format edge cases

- [ ] **Delivery list** (`.xlsx`): download for a weekday → file downloads, names sorted alphabetically, Spanish filename. Try a weekend date → 400 rejected with weekend message.
- [ ] **Menu card** (`.docx`): download for a date with a menu loaded → succeeds. Download for a date with **no** menu → 404 handled gracefully (button disabled client-side with "No hay menú registrado" — confirm this matches backend behavior, not just client guess).
- [ ] **Kitchen report** (`.docx`): log in as `kitchen` role → confirm the card is **not shown at all** on `/informes`. Log in as `admin`/`super_admin` → card is shown and download succeeds, includes pastelería/producción/hiperproteico/no-dar sections and any `specialInstructions` grouped by label.
- [ ] As `kitchen` role, attempt the kitchen-report endpoint directly (e.g. via curl with the kitchen user's token) → confirm **403**, even though `kitchen` passes the router-level role check for `/reports/*`. This narrower per-route restriction is easy to lose in a refactor.
- [ ] Confirm date formats: delivery-list expects `DD/MM/YYYY`, the other two expect `YYYY-MM-DD` — send the wrong format to each and confirm a 400, not a silent misparse.

---

## P1 — Client & catalog management

### 10. Clients list & filters

- [ ] Each status filter (Todos/Activos/Por vencer/Pausados/Finalizados) returns the expected set — cross-check against domain rules (active = today between start/end inclusive and not paused; expiring = within 5 business days; ended = no valid subscription).
- [ ] Name search (`q`) and restriction search filter independently and can combine; restriction search reveals the extra "Restricciones" column with the matching term highlighted.
- [ ] Pagination: page/limit both reset correctly on filter change; URL params reflect state and strip defaults.

### 11. Client CRUD

- [ ] Create client — all required-field validations fire (name, sex, DOB not in future, phone, address, zone, delivery).
- [ ] Edit client via `ClientEditModal` — partial update persists correctly, doesn't clobber subscription fields.
- [ ] Delete client (soft delete) → disappears from list, history logs `deleted`, confirm it's a paranoid delete (not visible in normal queries but not physically gone).

### 12. Delivery groups

- [ ] Add a second client to a group with no existing token → new UUID group created, both clients show each other as `groupMembers`.
- [ ] Add a third member to an existing group → reuses the same token.
- [ ] Remove a member down to 1 remaining → confirm the group is dissolved automatically (token cleared) per domain rule.
- [ ] Confirm dashboard/delivery "stop count" treats the whole group as **one** delivery stop.

### 13. Plans

- [ ] Create a plan with a subset of meals → verify meals persist exactly as selected.
- [ ] `GET /plans/client-counts` returns correct active-client counts per plan — specifically verify this route still resolves correctly and isn't swallowed by `/plans/:id` (this ordering is a known regression trap called out during code exploration).
- [ ] Edit a plan's price → clients already assigned show updated price on their overview (price is read live from the plan, not copied).
- [ ] Delete a plan currently assigned to clients → confirm behavior (no FK guard exists per current code — verify this is still the accepted behavior, not a new crash).

### 14. Menu entry

- [ ] Load a menu for today via the modal, save → chef report reflects it.
- [ ] Weekend day cards show a disabled "No disponible" state, no modal opens.
- [ ] Save a menu for a date near the edge of the rolling week window, then check that menus outside the current Sun–Sat window get pruned on the next upsert (no accidental deletion of the wrong week).

---

## P2 — Dashboard, delivery route, users, health

### 15. Dashboard widgets

- [ ] Counts, contract-ending, birthdays, connections, and menu-status widgets all load with real data.
- [ ] Birthdays "Ver más" toggle expands beyond 5 entries.
- [ ] Force a Saturday/Sunday "today" (or check on an actual weekend) → labels shift to "Entregas el lunes" phrasing and counts reflect the next delivery day, not the literal calendar day.

### 16. Delivery route view

- [ ] Hoy/Mañana tabs show correct zone groupings (`Sur` before `Centro`), grouped vs individual deliveries render correctly, phone numbers are clickable `tel:` links.
- [ ] A suspended client for that day does not appear in the route.
- [ ] On a weekend, the route for that day shows an empty state rather than erroring.

### 17. User management

- [ ] Create/edit/delete users as super_admin; role change takes effect on next login.
- [ ] Editing a user without entering a password leaves the existing password hash unchanged.
- [ ] A super_admin cannot delete their own account (button hidden on self row).
- [ ] "Activo/Inactivo" badge reflects last login within 7 days.

### 18. Health page

- [ ] Status banner reflects `ok`/`degraded`/`down` correctly; "Probar conexión" manually refetches.
- [ ] Simulate DB slowness or downtime if feasible in a test environment; otherwise just confirm the happy path renders latency/uptime/memory tiles.

---

## Cross-cutting checks (run once, but easy to miss)

- [ ] **History event completeness** — perform one action per event type (`plan_assigned`, `plan_renewed`, `reactivated`, `paused`, `resumed`, `suspended`, `finalized`, `deleted`) and confirm each writes exactly the expected row — a broken namespace import in one controller could silently drop just one event type while others keep working.
- [ ] **Malformed/garbage IDs** — hit a client/plan/subscription/user detail or action URL with a garbage id segment → confirm a clean 404, not a 500.
- [ ] **Discount/price clamping** — in any billing editor, try entering a final price higher than the plan's base price → discount should clamp to 0, never go negative.
- [ ] **Validation error shape** — trigger a Zod validation failure (e.g. missing required field) on client/plan/menu/subscription/user create → confirm the 400 response shape the frontend expects is unchanged.

---

## Sign-off

- [ ] All P0 items pass
- [ ] All P1 items pass
- [ ] All P2 items pass
- [ ] No regressions vs. `main` behavior found, or any found have been triaged/fixed and re-tested
