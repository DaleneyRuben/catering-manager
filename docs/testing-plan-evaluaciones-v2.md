# Testing Plan — Evaluaciones v2 (`feat/evaluaciones-v2`)

**Purpose:** this branch adds the full existing-client path to Evaluaciones (search/link an
appointment to an existing client, a dedicated renewal view for the Nutricionista, atomic
resolve, unpaid/abandon handling for renewals) on top of the original new-client conversion
flow, plus supporting fixes (actor tracking on history, correct "current subscription" selection,
role-guard tightening, permanent subscription deletion). It has never shipped as smaller PRs —
everything below needs a real click-through pass before merging to `main`.

Cross-reference: `docs/domain.md` → "Evaluaciones (Appointments)" and "Client Lifecycle" sections
are the spec this plan verifies against. Where the two disagree, trust `domain.md` and flag it.

## 0. How to use this document

- Check off each item against a real running instance (backend + Postgres + frontend dev server,
  `http://localhost:3000`).
- You need at least: one **admin** (or **super_admin**) login and one **nutritionist** login.
- Sections are ordered P0 → P2. If time is short, stop after P0 — that's the money path (client
  creation and renewal actually working, and the unpaid/abandon safety net around it).
- Create throwaway test clients for this rather than reusing real records — several test cases
  end in deletion (abandon flows) or leave permanent history rows.
- Where a step says "confirm in Historial", that means the client detail page's Historial tab.

---

## P0 — Core conversion & renewal flows (the money paths)

### 1. Scheduling an appointment — both modes

- [ ] As admin, open **Evaluaciones** → **Nueva cita**. Confirm it defaults to **Cliente nuevo**
      with free-text Nombre/Teléfono fields visible.
- [ ] Fill Cliente nuevo fields + date/time, save → appears in **Citas pendientes**, dated
      correctly.
- [ ] Type a phone number that matches an **existing** client while still in Cliente nuevo mode →
      a non-blocking warning appears ("Ya existe un cliente con este número — ¿quisiste buscarlo
      en su lugar?"). Confirm the **Crear cita** button stays enabled (it must never block
      submission).
- [ ] Switch to **Cliente existente** → free-text fields disappear, a search box appears
      ("Buscar por nombre o teléfono...").
- [ ] Type part of an existing client's name → matching results appear (debounced, not one
      request per keystroke — watch the network tab if unsure).
- [ ] Type part of an existing client's phone number → same client appears in results.
- [ ] Select a result → name/phone lock into a read-only summary block, the search box
      disappears, **Crear cita** is disabled until a client is selected, then enabled once one is.
- [ ] Save → appointment created with that client linked (not free-text name/phone).

### 1b. Double-booking the same slot is rejected

_(Fix: `6070ea4`/`142962d` — found by manual testing on 2026-07-29, a real appointment could be
double-booked at the same date and time before this fix.)_

- [ ] With an existing **pending** appointment at a given date/time (e.g. 30/07/2026 15:00), try
      to create a **second** appointment (either mode, any client) at that exact same date and
      time.
  - ✅ **PASS** if the save is rejected with an inline/toast error — **"Ya existe una cita
    pendiente en esa fecha y hora."** — and no second row appears in Citas pendientes.
  - ❌ **FAIL** if a second appointment gets created for the same slot (the original bug).
- [ ] Confirm a **different** date, or a **different** time on the same date, saves normally (the
      check is exact date+time, not just date).
- [ ] Edit an **existing** appointment's date/time (pencil icon) to match another pending
      appointment's slot → same rejection as above, existing appointment is left unchanged.
- [ ] Edit an existing appointment **without** changing its date/time (e.g. just correct a typo in
      the name) → saves normally, does **not** falsely reject against itself.
- [ ] **Resolved** appointments don't block a slot: resolve one appointment (convert or renew, see
      Tests 2/5), then schedule a **new** appointment at that same date/time the resolved one used
      → should be allowed (a resolved appointment already happened, it doesn't occupy the slot
      anymore).

### 2. New-client conversion (paid) — the original flow, must still work

- [ ] From the **Nueva cita** created in Test 1 (Cliente nuevo), or the nutritionist queue, click
      through to **Convertir a cliente**.
- [ ] Complete the full new-client wizard (all existing steps unchanged), answer **"¿Pagó el
      servicio?" → Sí**.
- [ ] Submit → new client created immediately, `plan_assigned` history entry appears **right
      away** (not deferred), appointment is stamped resolved (no longer in either queue).

### 3. New-client conversion (unpaid) → mark paid later

- [ ] Repeat Test 2 but answer **"¿Pagó el servicio?" → No**.
- [ ] Submit → client is created but **no `plan_assigned` history entry appears yet**.
- [ ] As admin, open Evaluaciones → **Pendientes de pago** → the new client appears there.
- [ ] Click **Marcar como pagado** → confirm the `plan_assigned` history entry now appears
      (correct plan/price/discount), and the client disappears from Pendientes de pago.

### 4. New-client conversion (unpaid) → abandoned

- [ ] Repeat Test 3's unpaid creation, but instead of marking paid, click the delete action on
      that Pendientes de pago row.
- [ ] Confirm the modal title is **"Eliminar cliente pendiente"** (not the renewal-discard one).
- [ ] Confirm → the client disappears entirely (not just from the pending list — try navigating
      to their URL directly, should 404 or not resolve), and the originating appointment is gone
      too (not sitting in either queue as pending again).

### 5. Existing-client renewal (paid) — the new flow, the highest-risk path

- [ ] As admin, schedule a **Cliente existente** appointment (Test 1) for a client who currently
      has an active plan.
- [ ] As nutritionist, open the queue → confirm this card shows the **"Cliente existente"** badge
      and CTA text **"Renovar plan"** (not "Convertir a cliente"), linking to
      `/evaluaciones/citas/:id/renovar`.
- [ ] Click through → confirm the page shows **only**: name, phone, status, current plan, contract
      end date (the summary card) — nothing else about the client (no address, discount,
      restrictions, etc. should be visible or reachable from here).
- [ ] Fill the renewal form (plan, duration, start date), answer **"¿Pagó el servicio?" → Sí**,
      confirm.
- [ ] Confirm: new subscription created, `plan_renewed` (or `reactivated` if the client was
      `ended`) history entry appears immediately, appointment resolved and gone from the queue.
- [ ] As nutritionist, try navigating directly to a **different** client's URL or a different
      appointment's renewal URL that isn't linked to her → confirm she's blocked (403/redirect),
      not shown that client's data.

### 6. Existing-client renewal (unpaid) → mark paid later

- [ ] Repeat Test 5 answering **"¿Pagó el servicio?" → No**.
- [ ] Confirm no history entry appears yet; the client's **Pendientes de pago** row in the admin
      view is now branch-specific — verify it's still recognizable as a renewal, not a new client.
- [ ] Mark paid → confirm `plan_renewed`/`reactivated` history entry appears now, with correct
      plan/dates/discount.
- [ ] While this was still pending/unpaid, confirm the client's own detail page stayed **fully
      reachable and manageable** (pause/renew/suspend all still worked) — this only applies
      because they already had a prior subscription; contrast with Test 4 where a sole unpaid
      subscription blocks the page.

### 7. Existing-client renewal (unpaid) → abandoned

- [ ] Repeat Test 6's unpaid renewal, then from **Pendientes de pago**, click delete on that row.
- [ ] Confirm the modal title is **"Descartar renovación pendiente"** (distinct from Test 4's
      "Eliminar cliente pendiente") and its body mentions the renewal reappearing in the
      nutricionista's queue.
- [ ] Confirm → the **subscription is gone**, but the **client, their other subscriptions, and
      their history are all untouched** (check Historial — no rows lost).
- [ ] As nutritionist, check the queue again → the original appointment should have **reappeared**
      as pending (still showing the "Cliente existente" badge), ready to be resolved again.

---

## P1 — Access control

### 8. Nutritionist role boundaries

- [ ] Log in as nutritionist → confirm the sidebar shows **only** Evaluaciones (no Clientes,
      Planes, Menú, Producción, Entregas, Informes, Dashboard, Usuarios, Health).
- [ ] Try navigating directly by URL to `/clientes`, `/planes`, `/` → confirm each is blocked.
- [ ] Try navigating directly to a client detail URL (`/clientes/:id`) for a client she has **no**
      appointment linking her to → confirm blocked (403), not just visually hidden.
- [ ] Confirm she **cannot** see any "Editar datos", "Pausar", "Finalizar plan", "Eliminar", or
      group-management controls anywhere she does have access (the existing-client renewal view).
- [ ] Confirm the renewal she submits still goes through correctly despite these restrictions
      (i.e., the lockdown doesn't accidentally block her own legitimate action).

### 9. Admin/super_admin unaffected

- [ ] As admin, confirm normal client renewal from the **Clientes** screen (not via Evaluaciones)
      still has **no** paid/unpaid toggle — it's always implicitly paid, exactly as before this
      branch.
- [ ] Confirm admin still has full access to everything Evaluaciones-adjacent: create/edit/cancel
      appointments, mark paid, both delete flows.

---

## P1 — Appointment lifecycle & queue behavior

### 10. Pruning and visibility

- [ ] Create an appointment (either mode) dated **yesterday** directly against a test DB row (or
      wait for a real one to age), leave it **unresolved** → reload either the admin "Citas
      pendientes" list or the nutritionist queue → confirm it's gone (deleted, not just hidden —
      check it doesn't reappear after a hard refresh from a cached list).
- [ ] Do the same for a **resolved** past appointment → confirm it's hidden from both lists but
      still exists (e.g. still referenced correctly from the client's history / the subscription
      it created is unaffected).
- [ ] Confirm both lists only ever show today-or-later appointments in the normal case.

### 11. Nutritionist queue ordering and badge

- [ ] Create several appointments across different future dates/times → confirm the nutritionist
      queue lists them **soonest-first** (date then time ascending).
- [ ] Confirm existing-client appointments show the badge and new-client ones don't, at a glance.

### 12. Cannot resolve twice

- [ ] After resolving an appointment (either flow), confirm there's no remaining UI path to
      resolve it again, and that it no longer appears in the queue at all (resolved appointments
      drop out of the nutritionist's queue immediately, not just once their date passes).

### 13. Blocked renewal when one is already queued

- [ ] Give a client an existing **queued renewal** (a future-dated subscription not yet started,
      created via the normal Clientes-screen renewal) while their current plan is still active.
- [ ] Schedule a **Cliente existente** appointment for that same client and open it as
      nutritionist.
- [ ] Confirm the summary card shows a **"Renovación ya registrada"** banner with the correct plan
      and dates (or "· sin fecha de inicio" if the queued renewal has no start date).
- [ ] Confirm the renewal form is replaced by a **disabled** "Renovar plan" button with an
      explanatory note ("Ya hay una renovación registrada...", directing her to ask
      administración to delete it) — she cannot submit a second one.
- [ ] As admin, delete that queued renewal from the Clientes screen, then have the nutritionist
      reload → confirm the block clears and she can now submit normally.

---

## P2 — History, actor tracking, and data integrity

### 14. Every history event names its actor

- [ ] Perform one action per event type (`plan_assigned`, `plan_renewed`, `reactivated`,
      `paused`, `resumed`, `suspended`, `finalized`, `deleted`, `renewal_deleted`) and confirm
      each shows **"por {username}"** under the event title, matching whoever actually performed
      it (admin vs. nutritionist, where applicable).
- [ ] **Specific regression check** (this branch's own bug fix): trigger a `renewal_deleted` event
      (admin deletes a queued renewal from the Clientes screen header → confirm dialog → confirm)
      → open Historial → confirm the entry shows **exactly one** actor-credit line —
      `Eliminada por {username} · registrada el {date} · {time}` — and **not also** a separate
      generic `por {username}` line directly under the title. (This duplicated before the fix in
      `9157ee0`; a regression here means that fix broke.)
- [ ] Confirm every **other** event type still shows its plain `por {username}` line as before —
      the fix must not have suppressed actor display everywhere, only for `renewal_deleted`.

### 15. Deleting an upcoming subscription unlinks, doesn't orphan, the appointment

- [ ] For a client with a queued renewal that originated from a resolved Evaluaciones appointment,
      delete that queued subscription from the Clientes screen.
- [ ] Confirm the originating appointment is **not deleted** — it just loses its subscription
      link. If its date has since passed, confirm it doesn't get pruned early or crash the queue
      view (grace behavior added specifically for this case).

### 16. Appointment history provenance (API/devtools check)

- [ ] For any `plan_assigned`/`plan_renewed`/`reactivated` history entry that originated from
      Evaluaciones, open devtools → Network → `GET /api/clients/:id/history` → confirm that
      entry's `metadata.appointmentId` is populated. (Not shown in the UI directly — this is a
      data-integrity check, not a visual one.)

### 17. Client search safety

- [ ] In the Cliente existente search box, type a client's actual name/phone → results match
      correctly, case-insensitively.
- [ ] Type `%`, `_`, or `\` characters into the search box → confirm it doesn't error and doesn't
      return unrelated/all clients (these are SQL `LIKE` wildcards and must be escaped, not
      treated literally as "match anything").

---

## Not practically coverable by manual click-through (note, don't block on)

- **Resolve-renewal race condition** (two near-simultaneous submissions for the same client) —
  covered by a DB-level unique constraint + unit tests; not realistically reproducible by hand.
  Skip unless you have API tooling to fire concurrent requests.
- **Nutritionist blocked from `POST /clients/:clientId/subscriptions` directly** — the UI never
  exposes this path to her, so it can only be checked by calling the API directly with her token
  (curl/Postman) and confirming 403. Optional, backend-only.

---

## Sign-off

- [ ] All P0 items pass
- [ ] All P1 items pass
- [ ] All P2 items pass
- [ ] No regressions vs. current `main` behavior found, or any found have been triaged/fixed and
      re-tested
