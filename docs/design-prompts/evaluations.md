# Design Prompt: Evaluaciones (Appointments → Client Conversion)

> Code identifier for this feature: `evaluations` (backend `services/evaluation/`, frontend `features/evaluations/`, route `/evaluations`). See [`CONTEXT.md`](../../CONTEXT.md) for the full glossary and [`docs/adr/004-unpaid-clients-as-full-records.md`](../adr/004-unpaid-clients-as-full-records.md) for the data-model decision behind "pendiente de pago".

## Context

This is an addition to the **La Oliva** catering admin panel. The existing hifi design system lives in `design/README.md` and `design/prototypes/*.dc.html` — **read that file first.** Reuse its tokens (colors, type, spacing, radius, shadow, modal spec, table/card patterns, icon style) exactly; this prompt only calls out what's new or different. Do not restate or redesign anything from the existing system unless noted below.

Language: Spanish (Bolivia), same tone as the rest of the app. Currency `Bs`, dates `dd/mm/aaaa`.

## What's being added

1. A **new staff role**: `Nutricionista` (5th role, alongside Super admin, Admin, Cocina, Delivery).
2. A **new screen, "Evaluaciones"**, with two very different views depending on role:
   - **Admin / Super admin**: a management view with two sections — pending appointments, and clients awaiting payment confirmation.
   - **Nutricionista**: a conversion queue — her _only_ screen, and her landing page after login.
3. One new control added to the **existing** "Agregar cliente" wizard (`AgregarCliente.dc.html`) — a "¿Pagó?" toggle — but **only** when that wizard is entered from a Nutricionista's appointment card. The admin's own direct "Agregar cliente" entry point (from Clientes) is unchanged.
4. A small update to **Usuarios** (`Usuarios.dc.html`): role list grows from four to five.

## Explicitly out of scope

- Panel dashboard (KPIs, connections widget, birthdays) — untouched.
- Health view — untouched.
- **Clientes table — untouched.** No new status, no new filter chip, no visual trace of unpaid conversions. This is a hard requirement: unpaid clients live _only_ in Evaluaciones until an admin marks them paid, at which point they appear in Clientes for the first time, indistinguishable from any other client.

---

## Navigation changes

- Sidebar **Gestión** group gains **"Evaluaciones"** as the last item in the group, after "Planes" (order: Panel, Clientes, Planes, Evaluaciones). Visible to Admin / Super admin. Icon: calendar-check glyph (or closest Feather/Lucide equivalent), same 17px treatment as other nav icons.
- **Nutricionista** role: sidebar shows **only** "Evaluaciones" (no Panel, no other items). Footer role label reads "NUTRICIONISTA". This screen is her default route after login.
- Both roles land on the same `Evaluaciones.dc.html` file — model it like `Produccion.dc.html`'s existing `rol` tweakable prop (`"Admin"` / `"Cocina"`) — here `rol`: `"Admin"` / `"Nutricionista"` toggles which layout renders.

---

## Screen: Evaluaciones — Admin / Super admin view

Header: eyebrow "GESTIÓN · EVALUACIONES" (mono) + serif title "Evaluaciones" + primary button **"Nueva cita"** top-right (opens the cita modal, see below).

Two clearly separated sections, stacked vertically, each with its own sub-heading (serif, 20–22px) and its own empty state. No shared list — a pending cita and a pending-payment client are visually distinct.

### Section 1 — "Citas pendientes"

A compact table (same row/hover/border treatment as `Clientes.dc.html`'s table), columns: **Nombre · Teléfono · Fecha · Hora · Acciones**.

- Actions cell: two borderless ghost icon-buttons, gap 4px — pencil (olive `#6b9a3a`, opens edit modal, prefilled) and trash (warm-red `#c97b6a`, opens cancel-confirm modal) — same pair used on `Planes.dc.html` cards.
- A cita whose date/time has already passed and is still unconverted **stays visible** in this list (no auto-drop, no "Vencida" tag either) — it only leaves once an Admin or the Nutricionista acts on it (converts or cancels it). See "Resolved decisions" below — this supersedes the auto-drop behavior described in an earlier version of this prompt.
- Empty state: centered icon + "Sin citas pendientes" + "Nueva cita" CTA, same pattern as Clientes' empty state.

### Section 2 — "Pendientes de pago"

A responsive card grid (`auto-fill, minmax(300px,1fr)`, gap 20 — same grid as `Planes.dc.html`). Each card is a converted-but-unpaid client:

- Serif name, mono meta line (`teléfono · plan`), total price (`Bs` + number), contract start/end mini-line.
- A quiet amber accent (left border or small "Pendiente de pago" pill, using the existing amber warn tokens `#a87f10` / `#f4ead0` / `#e3cf95`) to signal it needs follow-up — same semantic amber already used for "por vencer"/suspensiones.
- Footer: two borderless ghost icon-buttons, gap 0 (mirrors the Planes card footer exactly) — a check icon "Marcar como pagado" (olive) and a trash icon "Eliminar" (warm-red). Both open their own confirm modal — no navigation to a client profile.
- Empty state: "Sin clientes pendientes de pago" (quieter copy, no CTA — nothing to create here).

---

## Modals (Evaluaciones — Admin)

All follow the existing shared modal spec (backdrop `rgba(21,42,6,.42)` + 3px blur, card `#faf9f3`, border `#dcd9c8`, radius 16, shadow `0 24px 60px -18px rgba(21,42,6,.4)`).

- **Nueva / Editar cita** — small modal (~420px). Fields: Nombre, Teléfono, Fecha (date), Hora (time). Fecha must be today or later — past dates are disabled on the picker, same validation spirit as renewal/reactivation start dates elsewhere in the app. Footer: Cancelar + Crear cita / Guardar cambios.
- **Cancelar cita** — standard confirm modal, red primary "Cancelar cita" (same shape as existing Eliminar confirms).
- **Marcar como pagado** — confirm modal, olive primary "Confirmar pago". Copy: "¿Confirmás que `<nombre>` pagó su suscripción? Pasará a aparecer en la tabla de Clientes."
- **Eliminar cliente pendiente** — confirm modal, red primary "Eliminar" (identical shape to the existing client-delete confirm in `ClienteDetalle.dc.html`).

---

## Screen: Evaluaciones — Nutricionista view

Header: eyebrow "EVALUACIONES · NUTRICIÓN" + serif title "Evaluaciones". **No "Nueva cita" button** — she never creates appointments.

A single card grid (same shell as the admin's pending-payment cards) — one card per cita, in chronological order (soonest first). Each card: Nombre (serif), mono meta line (`teléfono · fecha · hora`), and a status tag in the top-right corner of the card:

- **Not yet converted** → mono outline tag "Pendiente" (neutral, `#7b806d` on `#efece2`, same treatment as other neutral mono tags in the system). Card is clickable, hover-lifts (same hover spec as everywhere else).
- **Converted, paid** → filled tag "Pagado" (olive `#357e1c` / `#dee9c8`, same green "Activa" pill already used in the session-history modal).
- **Converted, unpaid** → filled tag "No pagado" (amber `#a87f10` / `#f4ead0`).

Once converted (either tag), the card stops being clickable (no hover-lift, default cursor) — it's a record, not an action.

Empty state: "Sin citas asignadas" (quiet, no CTA).

---

## Wizard change: Agregar cliente (Nutricionista entry point)

Reuse `AgregarCliente.dc.html`'s existing 4-step wizard **exactly** (Identidad → Restricciones → Plan → Confirmar) — same stepper, same cards, same footer. Two differences, active only when entered from a Nutricionista's pending cita card:

1. **Step 1 (Identidad)**: Nombre and Celular fields arrive pre-filled from the cita (still editable, in case of a typo).
2. **Step 4 (Confirmar)**: add one new control above the existing read-only summary/submit — a segmented toggle, same visual style as the "zona"/"delivery" segmented controls in Step 1: **"¿Pagó la suscripción?" [ Sí | No ]**. No default selection — force an explicit choice before "Confirmar" is enabled, so no one can submit without deciding. Submit button label stays "Confirmar" regardless of the choice.

Submitting always creates the full client + subscription record (same as the admin's flow) — the toggle only sets the paid flag; it changes nothing else about the form.

---

## Usuarios update

- Role list grows from four to five: **Super admin, Admin, Cocina, Delivery, Nutricionista.**
- New role color, distinct from the existing three (olive = Super admin/Admin, amber = Cocina, taupe = Delivery): confirmed as slate-blue `#4d7a8a` on `#e0eaee` background. Add it as a named token (per project convention, no inline hex).
- Role summary cards (count per role) gain a fifth card.
- Create/Edit user modal's role segmented control gains a fifth option.
- Row role-tag treatment for Nutricionista uses the new token, same shape as the other three tags.

---

## Resolved decisions

1. **Past-due, unconverted citas**: they stay visible — in both the Admin's "Citas pendientes" list and the Nutricionista's queue — with no "Vencida" tag, until someone actually acts on them (convert or cancel). Neither view auto-drops a stale row based on date; the Admin's list still only ever shows unconverted citas (that's what "pendientes" means there), while the Nutricionista's queue shows both converted and unconverted — but neither applies a date cutoff anymore. This supersedes an earlier version of this prompt, which had unconverted citas auto-drop once the date passed.
2. **Nutricionista role color**: confirmed as `#4d7a8a` (slate-blue), on `#e0eaee` background — no longer a placeholder.
3. **Evaluaciones nav position**: confirmed as the last item in the Gestión group, after Planes (superseding this prompt's original "before Planes" placement).
4. **Cita/Client link on conversion**: the `Appointment` record persists after conversion, linked to the resulting subscription via a nullable `subscriptionId` (set only at conversion). The Nutricionista's Pendiente/Pagado/No pagado tag reads off this link. Deleting the linked client from "Pendientes de pago" cascade-deletes the Appointment row too — the cita disappears entirely, it does not revert to "Pendiente".
5. **`plan_assigned` history event on conversion**: no new event type is added for "converted from appointment" — but `plan_assigned` itself becomes conditional on `paid`. A conversion marked paid immediately fires `plan_assigned` at creation, same as a direct client. A conversion marked unpaid fires nothing at creation; `plan_assigned` fires later, at the moment an Admin confirms payment via "Marcar como pagado," using the subscription's data as it stands then.
6. **Fecha validation on Nueva/Editar cita**: must be today or later — no past dates at creation/edit time (see Modals section above).
7. **Wizard entry-point routing**: the Nutricionista converts through the _existing_ `/clientes/nuevo` route (not a separate `/evaluaciones/...` route) — that route's allowed roles gain `nutritionist` as a one-off exception, while `/clientes` and `/clientes/:id` remain Admin/Super admin only. The page reads an `appointmentId` query param to switch into `origen: "Cita"` mode (prefill + Step 4 paid toggle); without it, behavior is unchanged for Admin's direct entry (`origen: "Directo"`).

---

## Files to produce

- `Evaluaciones.dc.html` — new, `rol` prop (`"Admin"` | `"Nutricionista"`), covering both sections (admin) and the queue (nutricionista), plus all four modals listed above.
- Update `AgregarCliente.dc.html` — add the pre-fill + Step 4 payment toggle as a tweakable entry-point prop (e.g. `origen`: `"Directo"` | `"Cita"`), not a separate file.
- Update `Usuarios.dc.html` — fifth role in sample data, role summary cards, and the create/edit modal's segmented control.
