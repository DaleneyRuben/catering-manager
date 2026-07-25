# Implementation prompt: nutritionist appointment cards — sort/filter + existing-client renewal flow

> Companion to [`evaluations.md`](../design-prompts/evaluations.md) (the original design prompt) and [`evaluations-existing-client-renewal.md`](../design-prompts/evaluations-existing-client-renewal.md) (the follow-up design prompt covering this feature's new UI). Those two cover visual/layout specifics; this one is a Claude Code work breakdown for actually implementing the behavior.

Implement the following in the catering-manager repo. Follow `.claude/skills/project-standards/skill.md` throughout: TDD (failing test first for every change, backend and frontend), one public function per file in `backend/src/services/<domain>/`, feature-folder colocation in `frontend/src/features/<feature>/`, no `../../` imports (use `@/`/`@ui/` aliases), files under 400 lines, neutral Spanish for UI copy, English identifiers, `date-fns` only for frontend date math. Run the full test suite before considering any slice done. Domain context lives in `docs/domain.md` (see the new "Evaluaciones (Appointments)" section, and the updated User Roles / History / Client Lifecycle sections) and `CONTEXT.md` (see the rewritten "Evaluaciones" glossary entries); architectural rationale is in `docs/adr/005-unpaid-pattern-extended-to-renewals.md` and `docs/adr/006-nutritionist-renewal-view-reuses-full-client-read.md`. Read all of these before starting — they are the source of truth for every rule below, and this prompt is a work breakdown, not a replacement for them.

Business logic in this project may never be changed without asking the user first — everything below has already been explicitly approved, but if you find a case not covered here, stop and ask rather than guessing.

## 1. Appointment date filtering + pendiente pruning

- `backend/src/services/evaluation/find-for-nutritionist.ts` and `find-pending-for-admin.ts`: add a `date >= today` filter. Applies uniformly regardless of conversion status.
- Before either query runs, lazily delete stale `pendiente` appointments: `DELETE FROM appointments WHERE date < today AND subscriptionId IS NULL`. Extract this as a shared helper (both services need it) — likely a private helper in `_helpers.ts` for the `evaluation` domain, not duplicated in both files.
- Sorting is unchanged (`date ASC, time ASC` — already soonest-first, which is what "most recent to oldest" meant here).
- No frontend sort/filter logic needed — this is entirely a backend query change.

## 2. `Appointment.clientId` + admin search-and-link

- Migration: add nullable `clientId` FK to `appointments` (references `clients.id`).
- `backend/src/schemas/appointment.schema.ts`: `createAppointmentSchema` needs a variant/branch for "existing client" mode — either `clientId` is provided (and `name`/`phone` are then derived server-side from that client, not accepted from the request body) or `name`/`phone` are provided directly (today's new-client mode). Validate these are mutually exclusive.
- New backend read endpoint for the admin's client search: search `Client` by `name` (partial, case-insensitive) OR `phone`, single query param. Add wherever `client.routes.ts` conventions dictate (admin/super_admin only).
- Frontend: the admin's appointment-creation form gets an explicit mode toggle — "Cliente nuevo" (today's free-text fields, unchanged) vs. "Cliente existente" (new search input + result list + select). Selecting a result sets `clientId` and displays the matched `name`/`phone` as read-only.
- Safety-net warning: in "Cliente nuevo" mode, if the typed phone matches an existing `Client.phone`, show a non-blocking inline warning ("Ya existe un cliente con este número — ¿quisiste buscarlo en su lugar?"). Debounced lookup, not a hard validation error.

## 3. Nutritionist card badge + routing split

- `NutritionistAppointmentCard`: add a badge (e.g. "Cliente existente") when `appointment.clientId` is set.
- Routing: `pendiente` + no `clientId` → unchanged, `/clientes/nuevo?appointmentId=...`. `pendiente` + `clientId` set → new route to the dedicated existing-client renewal view (pick a path consistent with existing conventions, e.g. `/evaluaciones/citas/:appointmentId/renovar` or similar — your call, but keep it out of `/clientes/*` since that's the admin-only client detail namespace).

## 4. Dedicated existing-client renewal view (new)

- New page/component (not `ClientDetailPage` — a separate, smaller component per ADR-006's scope decision), reachable only via the route from step 3.
- Fetches the client via the existing `GET /clients/:id` (per ADR-006: reuse, don't build a narrower endpoint), renders only: name, phone, derived status badge, current plan name, contract end date.
- Auto-opens the existing `RenewalModal` component (reused as-is), with `isReactivation` computed the same way `ClientHeader` already does it (`status === CLIENT_STATUS.ENDED`).
- This view's `RenewalModal` usage gets a NEW "¿Pagó el servicio?" toggle (mirroring `StepConfirm`'s `origen === 'Cita'` conditional in the new-client wizard) — pass a flag through `useRenewalForm`/`RenewalModal` so this toggle only appears here, not on the admin's existing `ClientHeader` → `RenewalModal` usage from `ClientDetailPage`, which stays exactly as it is today (always implicitly `paid: true`).
- On submit: create the subscription via `POST /clients/:clientId/subscriptions` (existing endpoint, now nutritionist-accessible — see step 5), then stamp the appointment's `subscriptionId` with the new subscription's id (same mechanism `convertAppointment` already uses).

## 5. Backend permissions for `nutritionist`

Today `backend/src/routes/index.ts` gates `/clients` and `/clients/:clientId/subscriptions` all-or-nothing to `SUPER_ADMIN, ADMIN` at the router-mount level. Change to per-route checks:

- `GET /clients/:id` — add `NUTRITIONIST`.
- `POST /clients/:clientId/subscriptions` — add `NUTRITIONIST`.
- Everything else on both route groups (list, `PATCH`, finalize, delete, group management, suspensions, `PATCH .../subscriptions/:id`) stays `SUPER_ADMIN, ADMIN`-only.
- Frontend: add a route for the new dedicated view (step 4) allowing `NUTRITIONIST`, following the existing pattern used for `/clientes/nuevo` and `/evaluaciones`. Do NOT add `NUTRITIONIST` to `/clientes` or `/clientes/:id` (the admin list/full-detail routes) — she never reaches those.

## 6. `find-by-id.ts` unpaid-block fix (prerequisite for step 4 to work at all)

`backend/src/services/client/find-by-id.ts` currently 404s whenever the client's most-recently-created subscription (`sort by id DESC`) is `paid: false` — with no regard for older paid subscriptions. This must be scoped: only 404 when the unpaid subscription is the client's ONLY subscription ever (`subs.length === 1`). Otherwise, an existing client mid-unpaid-renewal becomes completely unreachable (404) for admins too. See ADR-005, point 2. **Write this fix and its test before step 4's frontend work** — otherwise the dedicated view will 404 the moment a renewal is marked unpaid.

## 7. Deferred history events extended to renewals (ADR-005, point 1)

- `backend/src/services/subscription/create.ts`: `shouldLogHistory` currently only defers `plan_assigned` when `paid: false` (line ~39: `eventType !== 'plan_assigned' || (data.paid ?? true)`). Change so ALL THREE event types (`plan_assigned`, `plan_renewed`, `reactivated`) defer identically: `shouldLogHistory = data.paid ?? true`.
- Add a nullable `renewalType` column to `Subscription` (`'renewal' | 'reactivation' | null`), persisted at creation (currently `renewalType` from the request is used transiently to pick the event type/pause behavior, then discarded — never saved to the row).
- `backend/src/services/evaluation/mark-paid.ts`: currently hardcodes `eventType: 'plan_assigned'`. Rewrite to read the subscription's persisted `renewalType` and emit the correct event (`plan_assigned` if null, `plan_renewed` if `'renewal'`, `reactivated` if `'reactivation'`).

## 8. Appointment provenance in history metadata

`plan_assigned` (new-client conversion) and `plan_renewed`/`reactivated` (existing-client appointment-driven renewal) history events must include the originating appointment's id in `metadata`. Applies to both the immediate write (paid at creation) and the deferred write (`markPaid`, once persisted `renewalType` is available per step 7).

## 9. System-wide actor tracking on history events

Every `ClientHistory`-writing call site (pause, resume, suspend, finalize, delete, edit, `plan_assigned`, `plan_renewed`, `reactivated` — regardless of whether the actor is an admin or the nutritionist) must now also record the acting user's `userId` and `username`, threaded from `req.user` (already available via the existing auth middleware) down to wherever each event gets created. This touches multiple existing services across the `client` and `subscription` domains — enumerate every `ClientHistory.create(...)` call site before starting so none are missed.

## 10. Unpaid-conversion admin follow-up must branch (ADR-005, point 3)

`backend/src/services/evaluation/delete-pending-client.ts` currently soft-deletes the whole client for ANY unpaid conversion — this must stay as-is ONLY for new-client appointments. Add a new, separate service for the existing-client case: soft-delete (paranoid, matching this project's existing soft-delete convention — not a hard delete) only the `Subscription` row created by the renewal, and reset the originating appointment back to pending (`subscriptionId = null`) so it reappears in the nutritionist's queue. The client record, its other subscriptions, and its history must be completely untouched.

`AdminEvaluationsView`'s "Pendientes de pago" card must branch its follow-up action between these two services based on whether the underlying appointment was a new-client or existing-client one (i.e., whether `appointment.clientId` was set).

## Suggested build order

1. Step 6 (unpaid-block fix) — small, isolated, unblocks everything else.
2. Step 1 (filtering/pruning) — small, isolated, no dependencies.
3. Step 7 + 9 (history/actor-tracking backend groundwork) — needed before step 4's renewal flow can log correctly.
4. Step 2 (clientId + admin search) — backend schema/migration first, then admin UI.
5. Step 5 (permissions) — needed before step 4's frontend can call the endpoints.
6. Step 4 (dedicated renewal view) + step 3 (card badge/routing) together — the core new nutritionist-facing flow.
7. Step 8 (provenance metadata) — small addition once steps 4 and 7 both exist.
8. Step 10 (branching unpaid cleanup) — last, since it depends on the existing-client renewal path (step 4) actually existing.

Verify end-to-end via Playwright before opening any PR, per project convention: for the admin side, schedule an appointment in "Cliente existente" mode and confirm the search/lock/warning behavior; for the nutritionist side, open an existing-client appointment, confirm the badge, the dedicated view's content, the paid/unpaid toggle, and that the appointment disappears/updates correctly afterward; cross-check that a client mid-unpaid-renewal is still fully reachable on the admin's `ClientDetailPage` (step 6's fix). Each logical slice should get its own branch/PR per this project's GitHub Flow convention — don't bundle all 10 steps into one PR.
