# Implementation prompt: cambio de plan control

> Companion to [`plan-change.md`](../design-prompts/plan-change.md), which covers layout and copy. This is the work breakdown.

Implement in the catering-manager repo following `.claude/skills/project-standards/skill.md`: TDD (failing test first, always), feature-folder colocation, no `../../` imports (`@/` and `@ui/` aliases), files under 400 lines, neutral Spanish copy, English identifiers, `date-fns` only for date math. Domain rules are in `docs/business-rules.md` → "Change of plan" and `CONTEXT.md` → "Plan change"; read both before starting. Business logic may not be changed without asking the user — everything below is already approved, but stop and ask if you hit a case not covered.

**This blocks Finanzas.** Until it ships, a simulated plan change writes two paid subscriptions for a client who paid once, which the finance register would double-count.

## 0. The backend is already done

Do not add an endpoint, a migration, or a domain function. Verify, then move on:

- `updateSubscriptionSchema` (`backend/src/schemas/subscription.schema.ts`) already accepts optional `planId` and `duration`.
- `subscription/update.ts` already resolves a plan/discount change via `resolvePlanChange` and records `terms_changed` with previous and new plan; its `startDate`/`duration` branch recalculates `contractEndDate` via `calcContractEndDate` and records `dates_changed`.
- Both events land in one transaction, and suspended dates are re-applied to the recalculated end date.

If a backend test asserting a combined `planId` + `duration` PATCH doesn't exist, **add one** — it's the contract this feature depends on, and it is currently only exercised through the discount path.

## 1. `useClient` — widen the mutation

`frontend/src/features/clients/hooks/useClient.ts:128` currently sends `{ discount }` only:

- Widen `updateBillingMutation` to take `{ discount, planId?, duration? }` and PATCH whichever are present.
- Rename it to reflect what it now does — `updateSubscriptionTerms` matches the `terms_changed` domain event and stops "billing" from meaning "plan" too. Update the export and both call sites.
- The success toast is currently the literal `'Precio actualizado'`. It must say **"Plan actualizado"** when a `planId` was sent and differed, and keep "Precio actualizado" otherwise — the toast should not claim the plan moved when it didn't.

Test first: assert the PATCH body for each combination, and both toast strings.

## 2. `ActivePlanCard` — the control

`frontend/src/features/clients/components/detail/ActivePlanCard.tsx`. Test first, in `ActivePlanCard.test.tsx`.

Take the visual detail from `design/prototypes/ClienteDetalle.dc.html` (the plan tab's "Plan y precio" block), not from the design prompt — the prototype is the source of truth and carries specifics the prompt omits: the `máx {n}` hint on the Precio label, the no-money note as a bordered tile with an info icon rather than a plain line, and the 1.35fr/1fr split on row 1. Every colour it uses already has a token.

- Plans come from the existing `usePlans()` hook (`@/features/plans/hooks/usePlans`) — it already coerces `price` to a number, which this card needs. Don't refetch plans by hand.
- Local state gains the selected plan id and the duration; `planPrice` must derive from the **selected** plan, not `sub.plan`, so the Precio input's `max` and the derived discount re-base when the selection changes.
- The consequence line uses the existing `remainingDeliveryDays(startDate, endDate, today)` from `@/utils/businessDays`. The projected end date is `addBusinessDays(startDate, duration - 1 + suspendedDates.length)` — note the **`- 1`**: duration counts the start day itself, matching `calcContractEndDate` on the backend. `addBusinessDays` already lives in `@/utils/businessDays` and is line-for-line the backend's `addDeliveryDays`; reuse it rather than adding a second helper alongside it.
- **Suspended days belong in the preview.** The backend adds one delivery day per suspended date on top of `calcContractEndDate` (`subscription/update.ts`), so a preview built from `startDate` + duration alone is short by exactly the suspension count — and contradicts the Contrato card sitting beside it on the same tab, which already computes it correctly (`ContractCard.tsx:32`). Extract that formula into a shared helper in `@/utils/businessDays` (test first) and have both cards call it, so the two previews cannot drift.
- Cancel restores plan, duration and price to the stored values.
- `handleSave` sends all three; skip fields that didn't change so an untouched plan never writes a spurious `terms_changed`.

Watch the file size — `ActivePlanCard.tsx` is already ~200 lines and the 400-line limit is a hard rule. If the edit form pushes it over, extract the edit body into a sibling component under `detail/` rather than trimming.

## 3. Thread the props

- `ClientPlanTab.tsx` — widen the `onUpdateBilling` prop type to the new shape and rename to match step 1.
- `ClientDetailPage.tsx:137` — pass the widened callback through.

Both have existing tests that will fail on the prop rename; update them in the same red commit.

## 4. Retire the workaround

No code change — a documentation and behaviour one. Once this ships, admins stop finalizing-and-recreating. `business-rules.md` already marks the workaround for retirement; when the feature lands, remove that paragraph and the "not yet implemented" marker from the "Change of plan" section.

Also update the closing note of `business-rules.md` → History, which currently reads _"No screen currently sends a new plan for an existing subscription… the plan half is reachable through the API alone until a plan-change control exists."_ That statement stops being true with this feature.

## Verification

Playwright, against the running app, before opening the PR — this gates `gh pr create`, not just "done":

1. Open a client mid-plan. Note plan, total and end date.
2. Edit → switch to a more expensive plan → confirm the Precio `max` re-bases, the consequence line updates live, and the no-money note appears with the correct `antes → ahora` names.
3. Set a shorter duration → confirm "días restantes" drops → save.
4. Confirm the card's plan name, meal chips and totals all updated, and the toast said "Plan actualizado".
5. Open the client's Historial tab and confirm **two** rows: **"Plan modificado"** (`antes Ligero · ahora Completo`) and the dates change. Critically, confirm there is **no** "Plan finalizado" and **no** second subscription — that's the workaround this replaces.
6. Cross-check the new end date on a second surface — the Clientes table or Producción — so the claim rests on more than the card that just wrote it.
