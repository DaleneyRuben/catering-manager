# ADR 007 — Domain Ownership: Free Reads, Owned Writes

**Date:** 2026-07-30
**Status:** Accepted
**Deciders:** Ruben Daleney

---

## Context

ADR-003 split the backend into domain folders with a public `index.ts` each. That discipline
has held — an audit found **zero** deep cross-domain imports across all 14 domains.

But the domain API was never the only way in. Every domain imports models directly, so the
front door is bypassable for free:

- `client_history` had **eight** writers across three domains, each hand-copying the same
  six-field event shape, while the `history` domain could only read.
- `subscriptions` was written by four domains (`subscription`, `client`, `evaluation`, and
  indirectly `delivery`).
- `clients` was written by four (`client`, `subscription`, `evaluation`, `delivery`).

Nothing in the code says who is _allowed_ to change a subscription's end date. That question
had no answer, and the cost was not theoretical: a sin-fecha renewal for an already-paused
client silently overwrote `pausedSince` — written from three different domains — and
shortened the client's plan by several delivery days (fixed in PR #115).

## Decision

**Any domain may read any table. Exactly one domain may write it.**

Reading is unrestricted, joins included. Writing (`create` / `update` / `destroy`) belongs to
a single owning domain; every other domain calls that domain's public function.

Three supporting rules make it workable:

1. **Domain APIs expose intentions, not fields** — `subscription.finalize(clientId, actor)`,
   not `subscription.update(id, { contractEndDate, finalizedAt })`. Without this, the owner
   degrades into a CRUD shell and its rules leak back out to callers.
2. **Every write function accepts an optional `transaction`** — rule 1 turns a multi-domain
   workflow into several API calls, and they must be able to commit or fail together.
3. **A view domain must own a rule, not just a query** — a domain owning no table earns its
   existence by holding a business rule. If deleting it costs only a `Promise.all`, it was
   screen assembly, and that belongs in the controller.

The full ownership table and domain list live in
[docs/architecture/domains.md](../architecture/domains.md), which is maintained as the code
changes. This ADR records only the decision and its rationale.

## Alternatives Considered

**Full isolation — each domain owns its tables and no other domain may read them either.**
Rejected. This is the shape you need if domains are rehearsal for extraction into separate
services, and it would have fixed the write problem too. But it forbids cross-domain joins,
and several read paths legitimately need them — the dashboard summary, the kitchen report,
and the delivery route all join clients, subscriptions and plans in a single query. Under
full isolation each becomes N API calls stitched together in JavaScript, losing both the SQL
and the shared transaction. That is a permanent tax paid to enable an extraction this
project has no plans to perform: one Postgres, one deployment, one team, one business.

**Keep convention-only boundaries.** Rejected. The discipline held for deep imports but had
already slipped twice where nothing checked — `evaluation/mark-paid.ts` importing
`subscription/_helpers` (forbidden by ADR-003 rule 6), and `client.controller.ts` querying
the `Appointment` model directly. Honor systems degrade silently as a codebase grows.

## Consequences

**Positive:**

- "Who can change this table?" has exactly one answer, written down.
- The eight duplicated history-writing sites collapse to one validated function.
- Joins, transactions and read performance are untouched — the monolith keeps its advantage.
- The `dashboard` domain dissolves: it owned no rule, and had to duplicate `delivery`'s
  stop-counting logic to do its job.

**Negative / trade-offs:**

- Domains are no longer extractable into separate services without further work. Accepted
  deliberately — see the rejected alternative.
- `subscription` becomes the largest domain (~11 public functions). Correct, since
  subscriptions are the heart of the business, but worth expecting.
- Enforcement is partial. Lint catches structural violations and static writes
  (`Model.create`), but **not** instance writes (`sub.update({ ... })`), where ESLint has no
  type information. This gap is narrowed by returning data rather than live Sequelize
  instances from domain APIs, and otherwise rests on review.
