# Nutricionista's existing-client renewal view reuses the full client-read endpoint

Status: accepted

When an Appointment links to an existing Client, the Nutricionista needs enough context
(status, current plan, contract end date) to make a renewal/reactivation decision. We
considered building a narrow, purpose-specific endpoint returning only those fields, versus
granting the Nutricionista role access to the existing `GET /clients/:id` — the same full
record an Admin sees, including restrictions, underlying diseases, NIT, razón social, and
discount — and having the frontend render only a subset.

We chose to reuse the full endpoint. It avoids a second read path for what is, structurally,
"read one client by id," and the Nutricionista is already a trusted staff role handling
client-facing data (name, phone, plan) elsewhere in Evaluaciones.

The trade-off: medical (restrictions, underlying diseases) and billing-identity (NIT, razón
social, discount) fields now travel to the Nutricionista's browser on every use of this view,
even though the UI only displays name, phone, status, plan, and contract end date. Nothing
enforces that scoping beyond "the view doesn't render those fields" — a network inspector, or a
future UI change, would expose them. If that turns out to matter, the fix is a dedicated
minimal-response endpoint; we deferred that cost until there's evidence it's needed.
