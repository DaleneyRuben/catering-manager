# ADR 003 — Backend Service Architecture

**Date:** 2026-06-30
**Status:** Accepted
**Deciders:** Ruben Daleney

---

## Context

The backend started with a flat `services/` directory: one file per domain (`client.service.ts`, `dashboard.service.ts`, etc.). As each service grew it accumulated multiple unrelated functions — `client.service.ts` held both query logic and mutation logic, `dashboard.service.ts` bundled six separate concerns into one 211-line file, and `subscription.service.ts` mixed creation and update flows. This made tests harder to scope, imports harder to trace, and files harder to maintain as the codebase grew.

## Decision

Adopt **domain-subfolder service architecture** with one public function per file:

```
services/
  <domain>/
    <function-name>.ts     ← exports exactly one public function
    _helpers.ts            ← shared private helpers within the domain (not exported)
    __tests__/
      <function-name>.test.ts
    index.ts               ← re-exports all public functions for the domain
```

### Rules

1. **One public function per file.** Each file exports exactly one function (and any types that belong to it). File names are kebab-case matching the function: `find-by-id.ts` exports `findById`.

2. **Private helpers are colocated.** If a helper is only used by one function, it lives in that function's file. If a helper is shared across multiple functions in the same domain, it goes in `_helpers.ts` within the domain folder. `_helpers.ts` is never re-exported from `index.ts`.

3. **Each function file has its own test file.** Tests live in `<domain>/__tests__/<function-name>.test.ts`. One test file per function file.

4. **Each domain has an `index.ts`.** It imports and re-exports all public functions (and types) for that domain. Nothing else. Controllers and other consumers import from the domain index — never from individual function files.

5. **TDD order is mandatory.** Write or update the failing test first. Create the implementation after. Never ship a function without a test.

### Example — `delivery/`

```
delivery/
  _helpers.ts              ← (if needed) shared private types or utilities
  set-group.ts             ← exports setGroup
  find-members.ts          ← exports findMembers
  find-route.ts            ← exports findRoute (buildZones, buildDayRoute colocated)
  __tests__/
    set-group.test.ts
    find-members.test.ts
    find-route.test.ts
  index.ts                 ← export { setGroup, findMembers, findRoute }
```

Controllers import from the index:

```ts
import { setGroup, findMembers } from '../services/delivery';
```

### Domains

| Domain         | Public functions                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `auth`         | `login`, `createUser`, `signToken`, `verifyToken`                                                  |
| `client`       | `findAll`, `findById`, `create`, `update`, `finalize`, `softDelete`                                |
| `dashboard`    | `findCounts`, `findContractEnding`, `findConnections`, `findBirthdays`, `findMenus`, `findSummary` |
| `delivery`     | `setGroup`, `findMembers`, `findRoute`                                                             |
| `health`       | `getReport`                                                                                        |
| `login-event`  | `record`, `findForUser`                                                                            |
| `menu`         | `upsert`, `findByDate`, `findAll`                                                                  |
| `plan`         | `findAll`, `findById`, `getClientCounts`, `create`, `update`, `remove`                             |
| `production`   | `findGroups`                                                                                       |
| `report`       | `findDeliveryClientsForDate`, `findActiveClientsWithPlansForDate`                                  |
| `subscription` | `create`, `update`, `findActiveSubscriptionsForDate`, `findSuspendedSubscriptionsForDate`          |
| `user`         | `findAll`, `findById`, `create`, `update`, `remove`                                                |

## Alternatives Considered

**Keep the flat service files** — rejected. Flat files grow unbounded: `client.service.ts` was already 264 lines handling both queries and mutations. A new developer has no clear signal for where new code belongs within an existing service file.

**Group by responsibility only (queries/mutations split)** — partially adopted as an intermediate step, but still left multiple functions per file. One function per file is a stronger constraint that eliminates the ambiguity of "which functions belong in the mutations file."

**No index.ts (import directly from function files)** — rejected for the backend. Unlike the frontend where direct imports were preferred to avoid barrel-file coupling, the backend service layer benefits from a stable import surface. Controllers depend on the domain API, not on individual file locations. The index makes reorganization transparent to consumers.

## Consequences

**Positive:**

- Each file is immediately understandable — open `plan/get-client-counts.ts` and see exactly one function.
- Test scope is unambiguous — one test file per function file, zero guesswork about what to test or where.
- Controllers import from `../services/<domain>` — a stable, intentional API surface.
- Adding a function to a domain is mechanical: create the file, create the test, add to `index.ts`.
- Private helpers declared in `_helpers.ts` are clearly not part of the public API.

**Negative / trade-offs:**

- More files overall — a domain with six public functions produces six `.ts` files, six test files, an `index.ts`, and possibly a `_helpers.ts`.
- Cross-domain imports are explicit (e.g. `report` imports `findActiveSubscriptionsForDate` from `../subscription`), which is by design but requires awareness.
- The `index.ts` must be kept in sync when functions are added or removed.

## Rules Going Forward

1. Every new backend function lives in its own file under the relevant `services/<domain>/` folder.
2. File name is kebab-case matching the function name.
3. Private helpers used by one function stay colocated in that function's file. Helpers shared across functions in the same domain go in `_helpers.ts`.
4. Every function file has a corresponding `__tests__/<function-name>.test.ts`. Test first.
5. The domain `index.ts` re-exports all public functions. Controllers import from the index only.
6. `_helpers.ts` is never imported from outside its domain and never re-exported from `index.ts`.
