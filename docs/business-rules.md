# Catering Manager — Business Rules

The catering business itself: what the terms mean, how plans and deliveries work, and the
rules the system must honour. For how the code is organised, see
[docs/architecture/domains.md](./architecture/domains.md) — there, "domain" means a folder
under `domains/`, never the business.

## Overview

Home and office meal delivery service. Clients subscribe to a meal plan. Daily menus are entered to generate chef preparation reports.

---

## Client

Each client has:

- Name
- Sex
- Date of birth
- Phone number
- Address
- Delivery zone (`deliveryZone` — `Centro` | `Sur`)
- Delivery (`La Oliva` | `Otro`)
- NIT (optional — tax ID for billing)
- Razón Social (optional — business name for billing)
- Underlying diseases (list)
- Restrictions (list — allergies, intolerances, and preferences combined in a single field)
- Contract date (always set to the current date on creation)
- Contract end date (auto-calculated — see Plan Duration)
- Start date
- Assigned plan
- Price (`price` — the agreed total for this contract, negotiated per client and stored on the subscription)
- Delivery group (`groupToken` — optional UUID shared with other clients at the same address)

### Delivery groups

Clients at the same address can be linked into a delivery group via a shared `groupToken` (UUID). A group counts as **one delivery stop** regardless of how many members it has — this is reflected in the dashboard's delivery count. Managing groups (adding/removing members) is done through the client detail view. If a group is reduced to one member, the token is cleared automatically.

### Restrictions field

Allergies, intolerances, and preferences (_gustos_) are captured in one list. Each entry is a free-text item the user can add to or remove from. For allergy-detection logic, every entry in this list is treated as a potential conflict trigger — the system does not distinguish between an allergy and a preference at the data level. If a finer distinction is needed later, it can be added as a tag per entry without changing the field shape.

---

## Plans

Plans are **dynamic** — no hardcoded list. Each plan defines which meals it includes. A plan can be assigned to many clients simultaneously.

Each plan has:

- **Name** — e.g. "Completo", "Ligero"
- **Price** — base price of the plan (a fixed monetary amount)
- **Meals** — which meal types are included (see below)

A plan's price is quoted for **20 delivery days** — one working month. This is a convention, not a stored field: nothing in the system divides or multiplies by it. A contract of a different length is priced by negotiation, not proportionally (see Price below).

Plans do **not** have a description or discount field. What a client actually pays is set per client at the subscription level (see Client above).

Meal types (stored as English keys in the DB, displayed in Spanish in the UI):

| Key               | Display     |
| ----------------- | ----------- |
| `breakfast`       | Desayuno    |
| `morning_snack`   | Merienda AM |
| `salad`           | Ensalada    |
| `lunch`           | Almuerzo    |
| `afternoon_snack` | Merienda PM |
| `dinner`          | Cena        |
| `juice`           | Jugo        |
| `extra`           | Extra       |

A plan can include any combination of meal types.

---

## Price

What a client pays is **negotiated per contract and stored on the subscription** as `price`, a
`DECIMAL(10,2)`. It is never derived from the plan on read.

- **The plan supplies a starting point, not the answer.** Selecting a plan pre-fills the field with
  that plan's price; the admin then edits it. A later change to the plan's own price does not move
  what any existing client pays.
- **It is bounded only by zero.** A plan's price is quoted for 20 delivery days, so a longer
  contract legitimately costs _more_ than the plan it came from. The UI shows the difference against
  the plan price as **Descuento** when the client pays less and **Recargo** when they pay more —
  both display-only, derived from `plan.price - subscription.price`.
- **Longer contracts are priced by negotiation, not proportionally.** The system never computes a
  price from a duration; the admin enters both.
- **It stays put through a plan change.** See Change of plan.
- Editing it on an existing subscription records `terms_changed` (see History).

There is no discount field. One stored number — the agreed total — is the single source of truth
for what a client pays.

---

## Plan Duration

Plan duration is **dynamic** — defined by the user at subscription time (new client, renewal, or reactivation) as a number of days. The API requires an explicit value (no UI default); the DB column has a fallback of 20 that never fires in practice. The system calculates `contractEndDate` automatically by adding the specified number of client-facing business days (Mon–Fri) to the start date.

- Contract date is always set to **today** at creation. (API validation of this rule is temporarily relaxed while existing clients are backfilled — see the TODO in `domains/subscription/create.ts`.)
- Start date is set by the user and may be the same as the contract date or a future date.
- Contract end date is calculated automatically: add the specified duration (in business days) to the start date.
- The end date is stored and may later be extended by suspensions (see below).

---

## Remaining Delivery Days (Display Only)

When displaying how many delivery days a client has left on their active plan, the count is calculated as follows:

- If the plan has not started yet (start date is in the future): count business days (Mon–Fri) from the start date to the contract end date.
- If the plan has already started: count business days from today to the contract end date, excluding today — today's delivery is assumed to have already happened or been scheduled.
- If today is a weekend (Sat–Sun): no delivery happens today, so no day is subtracted. The count starts from the next Monday.
- The result is always clamped to 0 or above (never negative).

This is a display-only value — it is never stored. It is recalculated on every page render using the client's `startDate`, `contractEndDate`, and the current date.

---

## Delivery Schedule

The week has two perspectives that must be kept distinct in the system:

- **Kitchen perspective (internal):** the company prepares meals **Sunday through Thursday**.
- **Client perspective (external):** clients receive meals **Monday through Friday**.

Each kitchen prep day produces meals for the next calendar day's delivery (Sunday prep → Monday delivery, …, Thursday prep → Friday delivery). Friday and Saturday are non-working days for both kitchen and client.

All UI-facing views (calendars, suspension picker, delivery history, client-facing screens) must use the **client view (Mon–Fri)**. Kitchen reports and production files are always generated for the next delivery day — for example, the owner sends the Sunday production list to the kitchen for Monday's deliveries.

---

## Daily Menu Processing

Menus are entered daily and persisted in the `menus` table with a rolling weekly window — records outside the current Mon–Fri display week are pruned automatically on each upsert. The display week is the same one used by the Menú view: it resets to the upcoming week on Sunday.

When a menu is saved the system generates a **chef preparation report** — a downloadable `.docx` file for the kitchen. The report includes:

- **Pastelería** section: breakfast, merienda AM, merienda PM — with per-meal portion counts and special instructions per client.
- **Producción** section: almuerzo, ensalada, cena — same structure.
- **Hiperproteico** list: clients whose plan includes the `extra` meal type.
- **No dar** lists per section: clients who do not receive that meal.

`juice` is a meal type on plans and stored on the Menu model, but it is not included in the kitchen report sections (it appears on the menu card only).

Special instructions (`specialInstructions` on Subscription — a per-meal-key → label map, e.g. `{ "lunch": "DAR GRANDES" }`) are grouped by label within each meal section of the report.

---

## Producción View (Kitchen Prep Planning)

A screen (sidebar item **Producción**, between Menú and Informes) that shows the kitchen tomorrow's headcounts: the next day's active clients grouped by their plan's meal composition. Visible to `kitchen`, `admin`, and `super_admin` roles — same audience as Menú and Informes.

Not to be confused with the **Producción section** of the kitchen `.docx` report (see Daily Menu Processing) — that is a section within a downloadable file; this is a standalone read-only view.

- **"Mañana" is the literal calendar day after today** (not the next delivery day), computed server-side (`GET /api/production`, no date parameter). If tomorrow is Saturday or Sunday there are no deliveries and the view shows an empty state — so both Friday and Saturday show it.
- **Clients counted** are exactly the active-subscription set for tomorrow (same rule as chef reports: within contract dates, not finalized, not paused, not suspended on that day).
- **Four groups**, derived only from the meal types of the client's assigned plan:
  - **Jugo** (`juice`) — plan includes `juice`. Independent: a juice client also appears in at most one of the other three groups.
  - **Completo** (`full`) — plan has **6 or more** meal types, counting all entries including `juice` and `extra`. Checked first.
  - **Almuerzo y cena** (`lunchAndDinner`) — plan has both `lunch` and `dinner` (and fewer than 6 meals).
  - **Almuerzo** (`lunchOnly`) — plan has `lunch` and no `dinner` (and fewer than 6 meals).
  - A client matching none of the three non-juice groups (e.g. breakfast-only plan) appears only in Jugo if applicable, otherwise in no group.
- The card total ("clientes a preparar") is the number of distinct clients placed in at least one group, computed server-side. Active clients whose plan matches no group are not counted.

**Clientes activos por día:** a second card on the same view shows the active-client count for each weekday (Mon–Fri) of the current display week (same Mon–Fri bounds used by Menú, resetting to the upcoming week on Sunday). Each day's count is the same active-subscription rule applied to that specific date, independent of the "Mañana" card above. Returned as `weeklyCounts` on the same `GET /api/production` response.

### Admin extensions on "Clientes activos por día"

Two features on this card are visible to `admin` and `super_admin` only. The `kitchen` role sees the card exactly as described above — no navigation, no clickable cells, no per-cell dates — and never calls the admin endpoints.

- **Navigable window is server-owned:** the main `GET /api/production` response includes `weekStarts` — the list of navigable week Mondays (the current display week plus 2 weeks forward; the count comes from `MAX_WEEK_OFFSET` in `constants/production.constants.ts`). The frontend derives the arrows and their bounds from this list and holds no window constant of its own.
- **Week navigation:** admins page the Mon–Fri grid by **absolute week start**: `GET /api/production/weekly-counts?weekStart=YYYY-MM-DD` (admin/super_admin only; any Monday in `weekStarts` is valid, anything else is a 400). The current week is never fetched from this endpoint — it is served by the main `/api/production` payload. Admin cells additionally show a small dd/MM date beside each weekday label. Future-week counts are a **projection based on contracts already registered** — renewals not yet entered are not included, so they systematically understate; the UI shows a caveat on future weeks and hides the "Hoy" marker outside the current week.
- **Day drill-down:** clicking a day cell opens a modal listing that day's active clients (name, phone number, delivery zone), each row linking to the client's detail page. Served by `GET /api/production/day-clients?date=YYYY-MM-DD` (admin/super_admin only) — the endpoint applies the **same active-subscription rule as the counts**, so the modal list and the cell count always agree. The date must be a weekday (weekends are rejected with a 400) within the navigable window (first Monday in `weekStarts` through the Friday of the last).

---

## Entregas View (Delivery Route)

A screen (sidebar item **Entregas**) that shows staff the day's delivery route: active clients grouped by delivery zone, then by delivery group (same-address stops, see Delivery groups) vs. individual stops. Visible to `delivery`, `admin`, and `super_admin` roles.

- **Hoy / Mañana tabs** show the active-client route for today and for the literal next calendar day, computed server-side (`GET /api/delivery`, no date parameter, keyed by both dates). Same active-subscription rule as chef reports and Producción (within contract dates, not finalized, not paused, not suspended on that day). Weekends return an empty route without querying.
- **Zone grouping**: clients are split by `deliveryZone` (Sur, then Centro), then within each zone by `groupToken` — members sharing a token render as one group card (one delivery stop), everyone else renders as an individual row under "Individuales".
- **Address**: each delivery stop shows the client's address. For a group, the address is shown once at the group-card level (all members of a group share one address); for an individual stop, the address is shown on that client's own row.
- **"Nuevo" badge**: a client's name is flagged **Nuevo** on the specific day (Hoy or Mañana) that equals their subscription's `startDate` — i.e. the day of their very first delivery. This is a display-only flag recomputed per rendered day; it is not stored.

---

## Reports

Three downloadable reports are currently implemented on the Reports page:

- **Delivery list** (`/api/reports/active-clients/download`) — sorted list of active clients for a given delivery date, exported as `.xlsx`. Date is passed as `DD/MM/YYYY`; weekends are rejected.
- **Menu card** (`/api/reports/menu-card/download`) — `.docx` card showing the day's menu. Requires a menu to be loaded for that date.
- **Kitchen report** (`/api/reports/kitchen-report/download`) — `.docx` prep report with pastelería, producción, hiperproteico, and no-dar sections (see Daily Menu Processing).

All three reject weekend dates with a 400.

The reporting layer should remain extensible — additional reports may be added over time.

---

## Finanzas (the register)

One screen (sidebar item **Finanzas**, under Administración) showing a month of money in and money
out. Visible to `admin` and `super_admin`. The vocabulary behind it — Payment, Expense, Movement,
and the terms deliberately rejected — is recorded in [CONTEXT.md](../CONTEXT.md); the ownership of
the tables is [ADR-008](./adr/008-finance-owns-payments.md). What follows is what the register
must honour.

**Cash basis.** Every record is dated by the day the money moved, never by the period it relates
to: a renewal paid in July for a plan running in August is July income. There is no accrual, no
outstanding balance, and nothing the register can say about money owed in either direction.

### Income and expenses

- **All income is subscription revenue.** A Payment is written only when a subscription is marked
  paid, so there is no manual income entry and the register can never disagree with the Clientes
  screen. The asymmetry with expenses is deliberate, not an omission.
- **Expenses are typed by hand** — amount, category, date, optional description — and record who
  registered them. They are editable and soft-deleted; Payments are neither, from this screen.
- **An expense is never dated in the future**, since the money has not moved yet. It may be
  backdated freely.
- **Repetition is Duplicar**: an expense copied into a new one dated today. Nothing is ever
  generated on a schedule.

### Expense categories

A managed catalog, chosen from a list and never free text — free text produces "Mercado",
"mercado" and "Compras mercado" as three categories and silently breaks every total.

- **Categories are archived, never deleted.** An expense already filed against one keeps naming it
  forever, so an archived category still carries its money in the breakdown (tagged _Archivada_)
  and stays available as a filter. Archiving only stops it being offered on a new expense.
- **Renaming moves the label across all history.** It is a correction to a name, not a merge: a
  name already taken is rejected rather than folded, because merging two categories would have to
  move every expense filed against one of them. A category matching only itself is not a
  collision, so recasing its own name is allowed.
- **Creating folds onto an existing name** (ignoring case and accents) and returns that category
  rather than erroring; if it was archived, the fold restores it. Asking for a category by name is
  asking to file against it.
- **Order is server-computed, scoped to the month on screen**: most used this month, then most used
  all time, then alphabetical, with `Otros` pinned last however often it is used — it is where
  unclassified spending lands, so ranking it by use would float the least informative choice to the
  front. The expense form's chips and the management modal read the same order, so they cannot
  disagree.
- There are no sub-categories: if one proves too coarse, it becomes two.

### What the month shows

- **The three tiles are the month's truth and never narrow to a filter.** A "Balance" of one
  category is not a balance of anything. Only the movements list, its count and its subtotal
  respond to filters; with none active that subtotal equals the month's balance.
- **The month still running is marked** — a _Mes en curso_ pill beside the stepper and an
  "Al {fecha}" cut-off on the Balance tile — and both are **absent entirely** on a closed month, so
  paging back reads as settled rather than as a marker that switched off.
- **Saving an expense moves the view to the month it is dated in**, on an edit as much as on a
  create. A row filed outside the month on screen would read as a save that did not happen.
- **Search reaches an expense's description and an income row's client name**, never the category —
  that is what the category filter and the breakdown cells are for. It ignores accents.
- **The register starts the month Finanzas went live.** Nothing earlier is shown or navigable and
  no backfill is performed, so the first month understates income — that and the other accepted
  costs are recorded under Consequences in [ADR-008](./adr/008-finance-owns-payments.md).

---

## Key Business Rules

- A client is **active** when today's date is between `start date` and `contract end date` (inclusive) and the client is not on pause.
- Chef reports only count meals for active, non-suspended, non-paused clients for that delivery day.
- Delivery zone is stored per client and may be used for future routing/grouping features.

### Derived client status (display)

Each client's displayed status is derived on read from their latest subscription — never stored:

- **ended** — no subscription, manually finalized, or `contractEndDate` in the past (a past end date ends the plan even while paused).
- **paused** — the subscription's `pausedSince` is set (covers both mid-plan pauses and "sin fecha" renewals awaiting a start date). The pause belongs to the plan, not to the client: registering a sin-fecha renewal pauses only that renewal, so a plan still running keeps its deliveries until its own contract ends.
- **future** — subscription exists but has no dates yet, or the start date is still ahead.
- **suspended** — today is one of the subscription's suspended dates.
- **expiring** — `contractEndDate` falls within the next 5 business days (Mon–Fri, as implemented).
- **active** — everything else within the contract range.

---

## Evaluaciones (Appointments)

An **Appointment** (_Cita_) is a placeholder record for a prospective or returning client — name, phone, date, time — created by an Admin and resolved by a Nutricionista. It carries a nullable `subscriptionId` (set only once resolved) and a nullable `clientId` linking it to a pre-existing client.

### Scheduling an appointment (Admin)

When scheduling, the Admin chooses one of two explicit modes:

- **Cliente nuevo** — free-text name and phone, exactly as today. Resolving this appointment always creates a brand-new client + subscription (a **Conversion**).
- **Cliente existente** — search an existing client by name or phone (single combined search) and select one. The appointment's `clientId` is set to that client, and its `name`/`phone` fields are copied from the client record and locked (read-only) — not independently editable. Resolving this appointment renews or reactivates that client's plan instead of creating a new one.

As a safety net, if the Admin is in "Cliente nuevo" mode and types a phone number matching an existing client, a non-blocking inline warning appears ("Ya existe un cliente con este número — ¿quisiste buscarlo en su lugar?"). It never blocks submission — phone is not a unique field on Client.

### Appointment visibility and pruning

Both the Admin's "Citas pendientes" list and the Nutricionista's queue only ever show appointments dated today or later — a past appointment, resolved or not, drops out of both views. An unresolved appointment (no `subscriptionId`) whose date has passed is deleted outright the next time either list is read (lazy pruning, the same rolling-window approach already used for `menus` — see Daily Menu Processing — just triggered on read instead of write, since there is no scheduled-job infrastructure in this backend). A resolved appointment past its date is only hidden, never deleted.

The Nutricionista's queue is ordered soonest-first (`date ASC, time ASC`).

### Resolving an appointment (Nutricionista)

The queue shows a distinguishing badge on any appointment linked to an existing client (`clientId` set), so the Nutricionista knows which flow she's entering before clicking:

- **New-client appointment** (no `clientId`) — opens the existing new-client wizard, unchanged: she fills in the remaining details and confirms a plan, and the wizard asks whether the service was paid at this visit ("¿Pagó el servicio?"). Submitting creates the client + subscription and stamps the appointment's `subscriptionId` (a **Conversion**).
- **Existing-client appointment** (`clientId` set) — opens a dedicated, read-only summary view (name, phone, current status, current plan, contract end date only — never the full client detail page, which the Nutricionista cannot otherwise reach) for that one client. From there she renews or reactivates the client's plan using the same rules an Admin uses from the Clientes screen (see Client Lifecycle), including the same "¿Pagó el servicio?" choice. An Admin-initiated renewal from the Clientes screen has no such choice and is always implicitly paid — the question only appears in this appointment-driven flow. Submitting stamps the appointment's `subscriptionId` with the new subscription, exactly as a Conversion does.

Once an appointment is resolved (`subscriptionId` set) it cannot be resolved again — and it never becomes resolvable again. Whatever happens to the subscription afterwards, a cita the Nutricionista has already acted on does not return to her queue. If the plan it produced is later removed (an Admin deleting the registered renewal, or abandoning it unpaid), the cita is deleted along with it rather than reverting to pending. Deleting a renewal is not an undo for the evaluation: if the client needs another one, the Admin schedules a fresh cita.

This is enforced by the `appointments.subscriptionId` foreign key (`ON DELETE CASCADE`), not by application code — `subscriptions` and `appointments` are owned by different domains. Nothing is lost: the Nutricionista's Historial only lists citas whose subscription still exists, and `client_history` keeps the originating appointment's id in its metadata (see History).

### Unpaid resolutions ("Pendientes de pago")

Whether from a Conversion or an appointment-driven renewal, marking the resolution unpaid defers the corresponding history entry (`plan_assigned`, `plan_renewed`, or `plan_reactivated`) until an Admin later marks it paid from the Evaluaciones screen — see History.

If a still-unpaid resolution is instead abandoned (the Admin's "Pendientes de pago" cleanup action):

- **New-client appointment** — the client is soft-deleted, their one subscription is deleted permanently, and the appointment is deleted with it. Nothing else exists to lose.
- **Existing-client appointment** — the subscription created by the renewal and the appointment itself are both deleted, permanently; the client, their other subscriptions, and their history are untouched. The appointment does not return to the Nutricionista's queue — if a new evaluation is needed, the Admin schedules a fresh appointment.

Subscriptions are never soft-deleted (the model is not paranoid, unlike Client): a subscription is only ever removed when it should not have existed at all, and `client_history` keeps the record of what happened.

An unpaid subscription normally makes its client's own detail page unreachable (404) until paid — but that block only fires when the unpaid subscription is the client's only one ever. An existing client with any prior subscription stays fully viewable and manageable (pause, renew, suspend) throughout a pending unpaid renewal.

### Nutricionista access

The Nutricionista role can view and resolve appointments in Evaluaciones, and view/act on the dedicated existing-client summary view for a client reached only via an existing-client appointment. She cannot browse the Clientes list, view any client's full detail page, edit client data, pause/finalize/delete a client, or manage delivery groups.

---

## Client Lifecycle

### Reactivation

Clients may renew immediately after a plan ends, or return months later after stopping the service. The system must support reactivating an existing client without creating a new record from scratch. The change is recorded in the client's history (see History).

**Reactivation rules:**

- Start date must be tomorrow at the earliest — "today" is not a valid option. The user selects a future date from a calendar.
- Duration is defined by the user in days (no default).
- The price is agreed at reactivation time.
- The new `contractEndDate` is recalculated from the new start date and duration.

### Renewal

When an active plan reaches its end date, the client may renew. Renewal rules:

- Start date options: a future date selected from a calendar, or no date defined — in which case the client enters the new subscription in **paused** state until manually activated.
- "Today" is not a valid start date for renewals.
- Duration is defined by the user in days (no default).
- The price is agreed at renewal time.
- The new `contractEndDate` is calculated from the start date and duration.

A Nutricionista can also perform a renewal or reactivation through Evaluaciones' appointment-driven renewal flow, subject to the same rules above, with one addition: a paid/unpaid choice not present in the Admin-initiated flow (see Evaluaciones (Appointments)).

### Change of plan

A client may switch to a different plan mid-contract — typically about a week in, once they have
tried the food. This is a change to the **existing** subscription, never a new one.

- The assigned plan is replaced on the running subscription. No second subscription is created,
  no plan is finalized, and the client's contract continues.
- **The agreed price does not move.** It is what the client already paid, so it rides through the
  change untouched; only the plan and the duration change.
- **No money changes hands, in either direction.** An upgrade is not charged a difference and a
  downgrade is not refunded. The difference is settled in **delivery days**: the admin sets a new
  duration so the amount already paid covers the new plan over a shorter (upgrade) or longer
  (downgrade) period. The system does not compute this proportionally — the admin enters the
  duration, and `contractEndDate` is recalculated from it exactly as any other duration change.
- The change records `terms_changed` (the plan moved) and, since the duration moves with it,
  `dates_changed` — see History.

The control is the plan tab's **Plan y precio** card: its edit mode carries the plan and the
duration alongside the price, and sends whichever of the three actually moved in one PATCH to
`subscription/update.ts`. While editing, the card shows the resulting contract end date and
remaining delivery days live, and — when the plan differs from the stored one — states that the
change generates no charge and no refund.

**The total the client pays is frozen while the plan is being changed**, which is what "no money
changes hands" means in the data: the price field is not editable in that state, and the gap
against the new plan's price is shown as **Descuento** or **Recargo**, derived exactly as in
[Price](#price) (`plan.price - subscription.price`) — nothing extra is stored for it. A client
paying 1.350 who moves to a plan listing 3.660 keeps paying 1.350; the card shows a Descuento of
2.310 against the new plan. The admin then shortens the duration so that 1.350 covers fewer days
of the pricier plan.

Moving to a plan that lists **below** what the client already paid inverts the gap: paying 1.350
on a plan listing 800 shows a Recargo of 550, unsigned, because "Descuento: 550" would describe the
opposite of what happened. The price itself never goes negative — it is bounded only by zero, same
as any other price edit.

### Pause / Resume

A client may pause their plan indefinitely, subject to a configurable maximum pause duration (see below). While paused:

- The client is excluded from chef reports.
- No deliveries are scheduled.
- The contract end date is **not** automatically extended during the pause — extension only happens at resume time.

**Pause logic:**

When a client is paused, the system must persist the pause event with enough data to reconstruct the correct end date upon resume and to enforce the maximum pause duration. This includes the date the pause was triggered and the number of remaining delivery days at that point, calculated as `totalPlanDays - elapsedBusinessDays(startDate, pauseDate)`.

**Resume logic:**

When a client is resumed, the new `contractEndDate` is calculated in the backend as:

```
newContractEndDate = nextClientDeliveryDay(resumeDate) + (remainingDays - 1) business days
```

Where `nextClientDeliveryDay` is the first Mon–Fri day strictly after `resumeDate`. This ensures the client receives their first meal the day after resuming (e.g., resumed on Monday → first delivery on Tuesday).

**Maximum pause duration (planned — not yet implemented):**

A system-level configuration value `maxPauseDays` (default: 30 calendar days) will define the maximum time a client may remain paused. If `maxPauseDays` is exceeded without a manual resume, the plan will be **finalized automatically** — setting `contractEndDate` to today and deactivating the client, with the event recorded in history. The value should be updatable in the system configuration without code changes. None of this exists yet: today a paused client stays paused indefinitely until manually resumed, and only a past `contractEndDate` ends the plan.

Pause and resume events are recorded in history.

### Finalize plan

A plan may be ended before its contract end date. Finalizing sets the contract end date to today and deactivates the client. The event is recorded in history.

---

## Suspensions

A client may suspend service for one or more specific days. Suspensions are selected as **individual dates** on a calendar (not a date range). Each suspended day must extend the `contractEndDate` by one client-facing delivery day.

### Extension logic

When N specific days are suspended, add N delivery days (Mon–Fri, client view) to the `contractEndDate`, skipping Saturdays and Sundays.

Example: original end date Friday Dec 15, suspend 2 days → new end date is Tuesday Dec 19 (skipping Sat Dec 16 and Sun Dec 17).

### Kitchen report impact

A suspended client on a given delivery day must not be counted in the portion totals for that day.

### Suspension calendar view (client-facing)

The suspension calendar shown to the client must use the **client view (Mon–Fri)**, with:

- **Green** — days a meal was delivered.
- **Red** — days the client suspended service.

**Selectable date range:** The calendar only allows selecting dates from **7 calendar days in the past** (1 week back) up to future dates. Any date earlier than `today - 7 days` must appear disabled and non-selectable.

The internal Sun–Thu kitchen schedule is never shown to the client.

---

## History

For each client, the system tracks these events. Every key is `<subject>_<verb>` — the stored values live in one place per side (`backend/src/constants/history.constants.ts` and `frontend/src/features/clients/constants/historyEvents.ts`) and are never written as literals outside the tests that pin them.

- Plan assignment (`plan_assigned`) — on subscription creation only (metadata: the plan, its price at that moment, start date, duration, end date, and the agreed price).
- Renewal (`plan_renewed`) and reactivation (`plan_reactivated`).
- Dates change (`dates_changed`) — whenever the start date or duration of an existing subscription changes, including when a "sin fecha" renewal is given its start date (metadata: the new dates and duration, and nothing about the plan, which the edit does not touch).
- Terms change (`terms_changed`) — whenever the assigned plan or the price of an existing subscription changes (metadata: previous and new plan, the new plan's list price, and previous and new agreed price). Both fields are covered by one event because both change what the client pays. It fires only when a value actually differs from the stored one, so re-submitting the same plan records nothing. The agreed price is recorded on both sides even when only the plan moved, so the timeline can show the total beside a plan change.
- Pause (`plan_paused`), resume (`plan_resumed`), suspension (`days_suspended` — with the newly suspended dates), finalization (`plan_finalized`), and client deletion (`client_deleted`).

History entries are append-only — past records are never overwritten when a plan changes. Entries written before `dates_changed` existed are `plan_assigned` rows carrying only dates; they are left as they are and keep their original label.

A plan change and a price edit both write `terms_changed`, and both reach it through the same control — the plan tab's "Plan y precio" card (see Change of plan). A plan change usually arrives paired with `dates_changed`, since the duration moves with it.

Every history event, regardless of type or who triggered it (Admin or Nutricionista), records the acting user's id and username. A `plan_assigned`, `plan_renewed`, or `plan_reactivated` event originating from Evaluaciones additionally carries the originating appointment's id in its metadata, so provenance survives even if the appointment record itself is later pruned (see Evaluaciones (Appointments)).

### How an event is labelled

The Spanish label on a timeline row is derived when the page renders, never stored, so relabelling costs no migration. Most keys map to one fixed label (`plan_paused` → "Plan pausado"). `terms_changed` is the exception: it produces **"Precio modificado"**, **"Plan modificado"** or **"Plan y precio modificados"**, chosen by comparing the previous and new values the row already carries. Rows also show what moved:

- Price alone — `antes 1.450 · ahora 1.300/mes`.
- Plan alone — `antes Ligero · ahora Completo · 1.450/mes`. A plan change moves no money, so the total is the same on both sides and is stated once.
- Both — `antes Ligero 1.450 · ahora Completo 1.700/mes`.

Rows written before the subscription carried its own price record a discount off the plan's price instead. History is append-only, so both shapes are read forever: on those older rows the total before a plan change cannot be reconstructed (the previous plan's price was never recorded), and the plan move is shown alone, exactly as it always was.

---

## User Roles

The system has five roles (`super_admin`, `admin`, `kitchen`, `delivery`, `nutritionist`). Role controls what a user can see and do:

- **super_admin** — full access including user management (Usuarios) and the Health view; both are super_admin-only.
- **admin** — full access to clients, plans, menus, production, deliveries, reports, Finanzas, and the dashboard; no user management or Health view.
- **kitchen** — can view the kitchen report and menu; cannot access the kitchen report download on the Reports page (that card is hidden for this role).
- **delivery** — delivery route view only.
- **nutritionist** — Evaluaciones only: resolves appointments (conversions for new clients, and renewals/reactivations for existing clients — see Evaluaciones (Appointments)); no access to Clientes, Planes, menus, production, deliveries, reports, dashboard, user management, or Health.

The dashboard's connections widget shows online/offline status for `kitchen` and `delivery` users based on last login time (online = within the last 8 hours, matching the login token's lifetime). The Usuarios table's "Estado" column (Activo/Inactivo) uses the same 8-hour rule, applied to all four roles.

### Login tracking

Each successful login records a **login event** (device type, OS, browser — parsed server-side from the User-Agent — plus the raw UA string) and overwrites a last-device snapshot on the user (`lastDeviceType`, `lastOs`, `lastBrowser`, alongside `lastLoginAt`). Failed logins are never recorded.

- Events are append-only and **never pruned**; deleting a user cascades to their events.
- The snapshot is still recorded on every login but is **not displayed** — device details appear only inside the two history views (which read from login events). The connections widget and the Usuarios table show login times only; the Usuarios "Último acceso" column uses a relative stamp (`Hace X min` / `Hace X horas` / `Hoy · HH:mm` / `Ayer · HH:mm` / `Hace X días`).
- Both history views share a **14-day (2-week) window**:
  - **Per-user history** — browsable from the Usuarios page (super_admin only), grouped by day.
  - **Global session history** (`GET /api/dashboard/sessions`) — opened from the dashboard's "Última conexión" card (admin + super_admin). The endpoint accepts an optional `roles` query param (comma-separated); the panel modal requests `roles=kitchen,delivery`, so it lists operational staff logins only. A login within the last 8 hours shows an "Activa" badge (same rule as the connections widget's online status); no session duration is tracked.
- Device type is stored as an English key (`mobile` | `desktop` | `tablet`) and displayed in Spanish (Móvil / Escritorio / Tableta). All device fields are null when the login request has no User-Agent.
