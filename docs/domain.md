# Catering Manager — Domain Knowledge

## Domain Overview

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
- Discount (negotiated per client — independent of the plan's base price)
- Total (plan price − discount; plan price is read from the assigned plan, not copied to the subscription)
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

Plans do **not** have a description or discount field. Discounts are set per client at the subscription level (see Client above).

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

## Plan Duration

Plan duration is **dynamic** — defined by the user at subscription time (new client, renewal, or reactivation) as a number of days. The API requires an explicit value (no UI default); the DB column has a fallback of 20 that never fires in practice. The system calculates `contractEndDate` automatically by adding the specified number of client-facing business days (Mon–Fri) to the start date.

- Contract date is always set to **today** at creation.
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

Menus are entered daily and persisted in the `menus` table with a rolling weekly window — records outside the current Sun–Sat week are pruned automatically on each upsert.

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

---

## Reports

Three downloadable reports are currently implemented on the Reports page:

- **Delivery list** (`/api/reports/active-clients/download`) — sorted list of active clients for a given delivery date, exported as `.xlsx`. Date is passed as `DD/MM/YYYY`; weekends are rejected.
- **Menu card** (`/api/reports/menu-card/download`) — `.docx` card showing the day's menu. Requires a menu to be loaded for that date.
- **Kitchen report** (`/api/reports/kitchen-report/download`) — `.docx` prep report with pastelería, producción, hiperproteico, and no-dar sections (see Daily Menu Processing).

All three reject weekend dates with a 400.

Planned but not yet implemented:

- **Plans expiring soon** — active clients whose contract end date falls within the next 5 kitchen business days (Sun–Thu). The dashboard shows today/tomorrow only.
- **Clients by birth month** — filterable list grouped by birth month. The dashboard has a current-month birthday widget only.

The reporting layer should remain extensible — additional reports may be added over time.

---

## Key Business Rules

- A client is **active** when today's date is between `start date` and `contract end date` (inclusive) and the client is not on pause.
- Chef reports only count meals for active, non-suspended, non-paused clients for that delivery day.
- Delivery zone is stored per client and may be used for future routing/grouping features.

---

## Client Lifecycle

### Reactivation

Clients may renew immediately after a plan ends, or return months later after stopping the service. The system must support reactivating an existing client without creating a new record from scratch. The change is recorded in the client's history (see History).

**Reactivation rules:**

- Start date must be tomorrow at the earliest — "today" is not a valid option. The user selects a future date from a calendar.
- Duration is defined by the user in days (no default).
- A discount may be applied at reactivation time.
- The new `contractEndDate` is recalculated from the new start date and duration.

### Renewal

When an active plan reaches its end date, the client may renew. Renewal rules:

- Start date options: a future date selected from a calendar, or no date defined — in which case the client enters the new subscription in **paused** state until manually activated.
- "Today" is not a valid start date for renewals.
- Duration is defined by the user in days (no default).
- A discount may be applied at renewal time.
- The new `contractEndDate` is calculated from the start date and duration.

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

**UI behavior while paused (Plan + Billing tab):**

The frontend displays `contractEndDate + 1 client business day` as a visual indicator only. This value is never persisted — the backend computes and stores the real end date only at resume time.

**Maximum pause duration:**

A system-level configuration value `maxPauseDays` (default: 30 calendar days) defines the maximum time a client may remain paused. If `maxPauseDays` is exceeded without a manual resume, the plan is **finalized automatically** — setting `contractEndDate` to today and deactivating the client. The event is recorded in history. This value can be updated in the system configuration without code changes.

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

For each client, the system tracks:

- Plan start date
- Plan cost at the time of assignment
- Subsequent plan changes (date, previous plan, new plan, new cost)
- Pause, resume, suspension, reactivation, and finalization events

History entries are append-only — past records are never overwritten when a plan changes.

---

## User Roles

The system has four roles (`super_admin`, `admin`, `kitchen`, `delivery`). Role controls what a user can see and do:

- **super_admin / admin** — full access including user management and all reports.
- **kitchen** — can view the kitchen report and menu; cannot access the kitchen report download on the Reports page (that card is hidden for this role).
- **delivery** — delivery route view only.

The dashboard's connections widget shows online/offline status for `kitchen` and `delivery` users based on last login time (online = within the last 8 hours, matching the login token's lifetime). The Usuarios table's "Estado" column (Activo/Inactivo) uses the same 8-hour rule, applied to all four roles.

### Login tracking

Each successful login records a **login event** (device type, OS, browser — parsed server-side from the User-Agent — plus the raw UA string) and overwrites a last-device snapshot on the user (`lastDeviceType`, `lastOs`, `lastBrowser`, alongside `lastLoginAt`). Failed logins are never recorded.

- Events are append-only and **never pruned**; deleting a user cascades to their events.
- The snapshot is still recorded on every login but is **not displayed** — device details appear only inside the two history views (which read from login events). The connections widget and the Usuarios table show login times only; the Usuarios "Último acceso" column uses a relative stamp (`Hace X min` / `Hace X horas` / `Hoy · HH:mm` / `Ayer · HH:mm` / `Hace X días`).
- Both history views share a **14-day (2-week) window**:
  - **Per-user history** — browsable from the Usuarios page (super_admin only), grouped by day.
  - **Global session history** (`GET /api/dashboard/sessions`) — opened from the dashboard's "Última conexión" card (admin + super_admin). The endpoint accepts an optional `roles` query param (comma-separated); the panel modal requests `roles=kitchen,delivery`, so it lists operational staff logins only. A login within the last 8 hours shows an "Activa" badge (same rule as the connections widget's online status); no session duration is tracked.
- Device type is stored as an English key (`mobile` | `desktop` | `tablet`) and displayed in Spanish (Móvil / Escritorio / Tableta). All device fields are null when the login request has no User-Agent.
