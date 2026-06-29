# ADR 001 — Frontend Feature-Folder Colocation Architecture

**Date:** 2026-06-29
**Status:** Accepted
**Deciders:** Ruben Daleney

---

## Context

The frontend started with a flat structure: shared `hooks/`, `types/`, and `pages/` directories where each page had its own subfolder. As the codebase grew this created friction — working on a feature like "clients" required jumping between `hooks/useClient.ts`, `types/client.ts`, `pages/ClientDetailPage/`, `pages/clients/`, and `components/modals/`. Imports were all relative (`../../../hooks/useClient`), making moves and refactors expensive.

## Decision

Adopt **feature-folder colocation**: each domain feature owns all of its code (hooks, components, types) colocated under `src/features/<feature>/`.

```
src/
  features/
    clients/
      components/
        detail/      ← ClientDetailPage subcomponents
        list/        ← ClientsPage subcomponents
        modals/      ← all client modals
        wizard/      ← new-client wizard steps
      hooks/         ← useClient, useClientList, useClientGroup, etc.
      types.ts
    dashboard/components/, hooks/, types.ts
    delivery/components/, hooks/, types.ts
    health/hooks/
    menu/components/, hooks/, menuFields.ts, types.ts
    plans/components/, hooks/, tiers.ts, types.ts
    reports/components/, downloadButtonStyles.ts
    users/components/, hooks/
  pages/             ← thin route-level orchestrators, flat .tsx files only
  components/
    ui/              ← generic reusable UI library (Button, Card, Field, …)
    layout/
    auth/
  hooks/             ← only truly cross-feature generic hooks (useDebounce)
  constants/
  utils/
  services/api.ts
  contexts/AuthContext.tsx
```

All imports use `@/` path aliases — no relative `../` paths anywhere in the codebase.

## Alternatives Considered

**Keep the flat structure** — rejected. The flat structure scales poorly: adding a new feature means touching four separate directories, and the cognitive load of figuring out which hook belongs to which feature increases with each addition.

**Barrel files (index.ts per feature)** — rejected. Barrel files create implicit coupling, make tree-shaking harder, and hide the actual file structure. Direct imports from the specific file are more explicit and easier to trace.

**Feature + shared layer (hybrid)** — considered but unnecessary at current scale. A dedicated `shared/` layer adds indirection without enough benefit while the codebase remains a single app with one team.

## Consequences

**Positive:**

- All code for a feature lives in one place — opening `features/clients/` gives the full picture.
- Moving or renaming a feature is a single directory operation.
- `@/` aliases eliminate brittle relative import chains.
- Clear rule for where new code goes: if it belongs to a feature, put it in that feature's folder; if it's truly shared across many features, it goes in `components/ui/` or `utils/`.

**Negative / trade-offs:**

- `pages/` are now thin orchestrators only — any substantial logic must live in a feature, which requires discipline.
- The `hooks/` root directory is intentionally nearly empty (only `useDebounce`); developers must resist the temptation to drop hooks there instead of colocating them.
- Initial migration was a big-bang refactor (195 files changed in one commit) — not incrementally adoptable mid-flight.

## Rules Going Forward

1. New domain code (hooks, components, types) goes under the relevant `features/<feature>/` folder.
2. Generic UI primitives (no domain knowledge) go in `components/ui/`.
3. No barrel `index.ts` files at feature boundaries — import directly from the file.
4. `pages/` files are route orchestrators only — no business logic, no local state beyond UI toggles.
5. All imports use `@/` aliases; no relative `../` imports.
