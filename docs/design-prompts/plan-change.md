# Design Prompt: Cambio de plan — plan selector on the client's active plan card

> Scope is one card on one screen: `ActivePlanCard` inside `ClienteDetalle.dc.html`'s plan tab. No new screen, no new route, no modal.
>
> Read [`business-rules.md`](../business-rules.md) → "Change of plan" and [`CONTEXT.md`](../../CONTEXT.md) → "Plan change" first. They are the source of truth for the rules; this prompt covers only what the user sees. Work breakdown lives in [`plan-change-implementation.md`](../implementation-prompts/plan-change-implementation.md).

## What's being added

Clients switch plans about a week in, once they have tried the food. Today there is no control for it, so admins **finalize the plan and create a new one** — which records the client as having left and come back, and leaves a second subscription behind. This card replaces that workaround.

The card's existing edit mode (currently "Precio y descuento" — Precio / Descuento / Total) gains two fields: the **plan** and the **duración**. Everything else about the card is unchanged.

## The rule the design has to carry

**A plan change moves no money, in either direction.** An upgrade is not charged a difference; a downgrade is not refunded. The client keeps what they paid and the admin adjusts the **duración** so that amount covers the new plan over a shorter or longer period. The system does not compute the new duration — the admin decides it.

This is counter-intuitive enough that the UI must say it out loud. An admin who expects a "cobrar diferencia" field needs to understand within a second why there isn't one.

---

## Edit mode — new layout

Opened by the same pencil `IconButton` already on the card. Section label changes from **"Precio y descuento"** to **"Plan y precio"**.

**Row 1** — two fields side by side:

- **Plan** — a select listing every plan by name, current plan preselected. Same select styling as the rest of the app (`inputCls()`).
- **Duración** — number input, suffix "días", preloaded with the subscription's current duration.

**Row 2** — the existing three-column Precio / Descuento / Total block, unchanged in structure. Note that **Precio's `max` is the selected plan's price**, so switching plan re-bases it: the field currently caps at the current plan's price, and must follow the selection rather than the stored plan.

**Row 3 — the consequence line.** Always visible while editing, recalculated on every keystroke in either row:

> **Vence el 21/08/2026 · 10 días restantes**

Mono, muted, same weight as the other derived values on the card. This is the number the admin is actually negotiating — they type a total duration and read the remaining days back. When the duration field is empty or invalid, show `—` rather than a stale value.

**Row 4 — the no-money note.** Appears **only when the selected plan differs from the stored one**, between the consequence line and the buttons:

> Ligero → Completo · El cambio no genera cobro ni devolución; ajusta la duración.

Neutral tone, not a warning colour — this is normal procedure, not a hazard. The `antes → ahora` fragment uses plan names so the admin can confirm at a glance they picked the right one.

Footer buttons (Cancelar / Guardar) are unchanged.

## Read mode

Unchanged. The card already shows the plan name, its meal chips, and Precio / Descuento / Total. After a save with a new plan, the plan name, the meal chips and the totals all reflect the new plan — no new elements, but the chips must actually re-render, since the meal composition is what changed for the kitchen.

## Copy

Neutral Spanish, tuteo, no regionalisms:

- Section label: **Plan y precio**
- Field labels: **Plan**, **Duración** (suffix "días"), **Precio**, **Descuento**, **Total**
- Consequence line: **Vence el {fecha} · {n} días restantes**
- Plan-change note: **{plan anterior} → {plan nuevo} · El cambio no genera cobro ni devolución; ajusta la duración.**
- Success toast on save: **Plan actualizado** when the plan changed, **Precio actualizado** when only the price did. The toast should not claim the plan moved when it didn't.

## Out of scope

- **No proportional calculator.** The design must not suggest the system knows what the new duration should be — no "sugerido: 10 días", no auto-fill on plan change. The admin decides.
- **No difference charge, no refund field.** See the rule above.
- **No confirmation dialog.** The change is reversible by editing again, and both halves land in the client's history.
- **Start date is not editable here.** Only plan, duration, price.
