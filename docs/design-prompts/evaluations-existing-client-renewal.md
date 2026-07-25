# Design Prompt (follow-up): Evaluaciones — existing-client renewal via cita

> Follow-up to [`evaluations.md`](./evaluations.md) — read that prompt first, it's still the base spec for the Evaluaciones screen, the new-client wizard entry point, and the Usuarios role update. This prompt only covers what's **new or changed** on top of it. Do not re-derive the base screen from scratch; treat this as a diff.
>
> See [`CONTEXT.md`](../../CONTEXT.md) for the updated glossary, and [`docs/adr/005-unpaid-pattern-extended-to-renewals.md`](../adr/005-unpaid-pattern-extended-to-renewals.md) / [`docs/adr/006-nutritionist-renewal-view-reuses-full-client-read.md`](../adr/006-nutritionist-renewal-view-reuses-full-client-read.md) for the data-model decisions behind this flow. Implementation work breakdown lives in [`evaluations-renewal-implementation.md`](./evaluations-renewal-implementation.md).

## What's being added

A cita can now link to a pre-existing client at creation time. When it does, the Nutricionista's action on that cita is a **renewal/reactivation** of that client's plan, not a new-client conversion.

1. **Nueva/Editar cita modal** gains a Cliente nuevo / Cliente existente mode toggle, with a client search in the existing mode.
2. **Citas pendientes table** (Admin) and the **Nutricionista's queue** gain a "Cliente existente" tag on linked citas.
3. **Both lists** now only show citas dated today or later — this supersedes `evaluations.md`'s "Resolved decisions" #1 (past-due citas no longer stay visible indefinitely; an unconverted one past its date is removed outright).
4. A **new screen**, "Cita → Renovación", for the Nutricionista's existing-client flow.

## Superseded from the base prompt

- **`evaluations.md` "Resolved decisions" #1** (past-due citas stay visible, no auto-drop): reversed. Both lists now apply a today-or-later date filter; an unconverted cita past its date is deleted outright rather than lingering.
- **`evaluations.md` "Resolved decisions" #4** (deleting the linked client cascade-deletes the cita): still true for a new-client cita. For an existing-client cita whose renewal is abandoned unpaid, the behavior differs — see "Pendientes de pago" below.
- **`evaluations.md` "Resolved decisions" #5** (`plan_assigned` conditional on `paid`): the same deferred-until-paid treatment now applies identically to `plan_renewed`/`reactivated`.
- **`evaluations.md` "Resolved decisions" #7** (wizard entry-point routing): only describes the new-client path. The existing-client path uses a different route entirely (see "Cita → Renovación" below), and the Nutricionista still never reaches `/clientes/:id`.

Everything else in the base prompt (Admin's "Pendientes de pago" section shape, the Usuarios update, the base wizard's paid toggle for new clients) is unchanged.

---

## Modal: Nueva / Editar cita (Admin) — Cliente nuevo / existente toggle

Top of the modal, above Nombre/Teléfono: a two-option segmented toggle **"Cliente nuevo" / "Cliente existente"** (same segmented-control style as the "zona"/"delivery" controls in `AgregarCliente.dc.html`'s Step 1), mutually exclusive:

- **Cliente nuevo** (default) — Nombre, Teléfono free-text fields, exactly as the base prompt.
- **Cliente existente** — a single search input (placeholder "Buscar por nombre o teléfono...") replaces the Nombre/Teléfono fields. Typing filters a dropdown of matching clients (name + phone per row, debounced). Selecting one shows Nombre/Teléfono as **read-only** (muted text, no input border) below the search box — pulled from and locked to that client's record.
- In **Cliente nuevo** mode, if the typed Teléfono matches an existing client's phone, show a small inline warning under the field (amber text, no icon) — "Ya existe un cliente con este número — ¿quisiste buscarlo en su lugar?" — non-blocking, submit stays enabled.

Fecha/Hora fields and footer are unchanged from the base prompt.

---

## Citas pendientes table (Admin) — existing-client tag

A row for a cita linked to an existing client shows a small secondary tag next to the name — mono outline "Cliente existente" (same neutral tag treatment as the Nutricionista's "Pendiente" tag) — so the Admin can tell which citas will route the Nutricionista to a renewal instead of a new-client conversion.

Both the Admin's table and the Nutricionista's queue now only ever list citas dated today or later (see "Superseded" above) — no design change needed beyond the tag, since this filtering happens server-side.

---

## Nutricionista queue — existing-client badge and routing

- A card for an unresolved cita linked to an existing client shows a small secondary badge near the status tag — "Cliente existente" (same mono-outline neutral treatment), placed so it doesn't compete visually with the "Pendiente" status tag.
- Clicking a "Pendiente" card without the badge behaves exactly as the base prompt (opens `AgregarCliente.dc.html`).
- Clicking a "Pendiente" card **with** the badge opens the new "Cita → Renovación" screen instead.
- Once resolved, the card's status tag reads "Pagado"/"No pagado" exactly as the base prompt, regardless of which path produced it.

---

## New screen: Cita → Renovación (existing-client renewal) — Nutricionista

Reached only by clicking a "Cliente existente" cita card from the queue. Not part of `Clientes.dc.html`/`ClienteDetalle.dc.html` — the Nutricionista cannot reach it any other way, and has no access to the full client detail page.

Header: eyebrow "EVALUACIONES · RENOVACIÓN" + serif title with the client's name. A quiet back-link ("← Volver a Evaluaciones") in place of any sidebar nav.

A single, compact summary card (same card shell as elsewhere in the app) showing exactly:

- Nombre, Teléfono (mono meta line).
- Current status pill, using the same status-color mapping already established in `ClienteDetalle.dc.html`/`Clientes.dc.html` (active/paused/expiring/future/suspended/ended).
- Current plan name.
- Contract end date (dd/mm/aaaa).

No other client fields (restrictions, address, NIT, billing, history) are shown here — deliberately minimal, see ADR-006 for why the underlying data fetch is broader even though the UI shows only this.

Below the summary card, the **existing** Renovar/Reactivar modal opens automatically on page load — same modal component/shape used from `ClienteDetalle.dc.html`'s header button, title and field set swapping between "Renovar"/"Reactivar" via the same `status === Finalizado` rule already established there. One addition, present **only** in this entry point: a segmented toggle **"¿Pagó el servicio?" [ Sí | No ]** above the modal's submit button, no default selection, same visual treatment as the equivalent Step-4 toggle in `AgregarCliente.dc.html`. The Admin's own Renovar/Reactivar modal (from `ClienteDetalle.dc.html`) is unchanged — no payment toggle there.

Submitting (paid or not) returns her to the Evaluaciones queue, where the cita now shows "Pagado" or "No pagado" instead of "Pendiente"/"Cliente existente".

---

## Pendientes de pago (Admin) — branching cleanup

The existing "Pendientes de pago" card grid and its two actions (Marcar como pagado / Eliminar) are unchanged in shape. What "Eliminar" actually does now depends on the underlying cita:

- **New-client cita, still unpaid** — unchanged from the base prompt: deletes the whole client record and cascades the cita with it.
- **Existing-client cita, unpaid renewal never paid** — different and non-destructive: only the pending subscription is removed; the client and their history are untouched; the originating cita reverts to "Pendiente" (with its "Cliente existente" badge) in the Nutricionista's queue, so she can attempt the renewal again.

No new UI is needed for this distinction — the same "Eliminar" button and confirm-modal copy work for both; the branching is a backend concern (see the implementation prompt). If you want the confirm modal's copy to differ for the existing-client case (e.g. "Se eliminará la suscripción pendiente; el cliente no se verá afectado" vs. the base prompt's client-deletion copy), that's worth a small copy variant — flagging as an open question rather than deciding it here.

---

## Files to produce / update

- `Evaluaciones.dc.html` — update Nueva/Editar cita modal (mode toggle + search), Citas pendientes table (tag), Nutricionista queue (badge + routing).
- `CitaRenovacion.dc.html` — new screen described above.
- No changes needed to `AgregarCliente.dc.html` or `Usuarios.dc.html` beyond what the base prompt already specifies.
