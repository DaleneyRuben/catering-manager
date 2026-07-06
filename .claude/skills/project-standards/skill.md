---
name: project-standards
description: >
  Full implementation rules for the catering-manager codebase. Use this skill
  when writing, reviewing, or refactoring any code in this project — frontend
  (React + TypeScript + TanStack Query) or backend (Node.js). Invoke it whenever
  the user asks to add a feature, fix a bug, refactor, write tests, or create
  components. Covers file size limits, architecture, DRY, imports, UI conventions,
  testing requirements, storybooks, Spanish/English conventions, and date libraries.
---

## Tech stack

- **Frontend**: React 18, TypeScript, TanStack Query, React Hook Form, Tailwind CSS v4, date-fns, Sonner (toasts)
- **Backend**: Node.js, Express, Sequelize, PostgreSQL
- **Testing**: Jest + React Testing Library (frontend), Jest (backend)
- **Storybook**: for generic UI components only

---

## Architecture (backend)

Backend services live under `backend/src/services/<domain>/`. Each domain is a folder with one public function per file, a test subfolder, and an index.

```
services/
  <domain>/
    <function-name>.ts     ← exports exactly one public function (kebab-case filename)
    _helpers.ts            ← shared private helpers within the domain; never exported
    __tests__/
      <function-name>.test.ts
    index.ts               ← re-exports all public functions for the domain
```

**Rules:**

- One public function per file — file name is kebab-case matching the function (`find-by-id.ts` exports `findById`)
- Private helpers used by one function stay colocated in that function's file
- Private helpers shared across multiple functions in the same domain go in `_helpers.ts`
- `_helpers.ts` is never re-exported from `index.ts` and never imported outside its domain
- Each function file has a corresponding `__tests__/<function-name>.test.ts` — test first
- Controllers import from the domain index only: `import { findById } from '../services/client'`
- Never import directly from a function file outside its domain

See `docs/adr/003-backend-service-architecture.md` for the full rationale and domain map.

---

## Architecture (frontend)

The frontend uses **feature-folder colocation** under `src/features/<feature>/`. Each feature owns its hooks, components, and types.

```
src/
  features/<feature>/
    components/   ← domain components for this feature
    hooks/        ← data-fetching and domain hooks
    types.ts      ← feature-specific types
  pages/          ← thin route orchestrators only (no business logic)
  components/ui/  ← generic reusable UI primitives
  hooks/          ← only truly cross-feature hooks (e.g. useDebounce)
  utils/
  constants/
  services/api.ts
```

**Rules:**

- Same-directory and one-level-up imports may use relative paths (`./Foo`, `../Foo`)
- Anything two or more levels up must use an alias — `../../` paths are never allowed
- Two aliases are available: `@/` maps to `src/`, `@ui/` maps to `src/components/ui/`
- No barrel `index.ts` files at feature boundaries — import directly from the file
- `pages/` files are route orchestrators only — no business logic, no complex state
- New domain code goes in the relevant `features/<feature>/` folder
- Generic UI primitives (no domain knowledge) go in `components/ui/`

---

## File size

Keep files under 400 lines. If a file grows beyond that, split it — extract subcomponents, separate hooks, or break out helper modules. A React component that's getting long is almost always doing too much.

---

## Reuse before creating

Before writing a new function, hook, helper, or constant, search the codebase for something equivalent. Shared helpers live longer and stay consistent — duplication is the real cost.

---

## Separation of concerns

Functions and components should do one thing. UI rendering, data fetching, and business logic belong in separate layers. If a component is importing from many places and managing complex state, it's a signal to split.

---

## DRY

Don't repeat logic. If the same pattern appears twice, extract it. The third occurrence is already technical debt.

---

## Language conventions

- **UI labels, copy, and messages** → Neutral Spanish (no regional slang or localisms)
- **Code identifiers** → English: variable names, function names, constants, route names, type names, file names — even when the concept is Spanish-only
- **Comments** → only when the WHY is non-obvious; write them in English

---

## UI components

**Always use the `Button` component** for interactive buttons — never raw `<button>` elements. The `Button` component handles variants, disabled states, and consistent styling.

**Color tokens**: never inline arbitrary hex values in `className`. If a color is needed that doesn't have a token yet, add a named token to `tokens.css` first, then use it.

**Storybooks**: only for components in `src/components/ui/`. Feature components and page components do not get Storybooks.

---

## Git workflow

This project uses **GitHub Flow**:

1. Create a feature branch off `main` before starting any change (`git checkout -b <type>/<short-description>`)
2. Work on the branch with atomic commits (use `/commit`)
3. Open a PR — CI runs lint, typecheck, frontend tests, and backend tests
4. Merge to `main` only after CI passes

`main` is always production. Never commit directly to `main`.

Branch naming: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/` prefix followed by a short kebab-case description.

---

## Committing

Always use the `/commit` skill when committing changes — never run `git commit` manually. The skill enforces atomic commits, correct message format, and runs related tests before committing.

---

## Business logic

Never change or extend business logic without asking the user first. Present the proposed change and wait for explicit approval before implementing.

---

## Tests first — always

Any code addition or modification (frontend or backend) requires a failing test first. Follow Red → Green:

1. Write or update the failing test first
2. Confirm it fails for the right reason
3. Implement the minimum code to make it pass
4. Confirm tests pass

Never write implementation code before a failing test exists. Never ship a backend change without verifying the full backend test suite still passes.

---

## Verify end-to-end before calling it done

Passing unit tests, typecheck, and lint proves the code is internally consistent — it does not prove the fix works. Unit tests mock the API/DB boundary, so they can't catch mismatches in how layers are actually wired together (e.g. a response-shape or encoding change that breaks a consumer silently).

After tests are green, verify through the running app using the Playwright MCP tools — never a standalone script that imports services/models directly or talks to the DB out of band:

- **Frontend/UI changes**: use Playwright to load the page in the running browser and exercise the golden path plus edge cases.
- **Backend changes that affect an API contract or cross a service boundary**: use Playwright to drive the change through the running frontend (or hit the real endpoint via its network tools) and confirm the actual behavior — not just that mocked tests pass.
- **Bug fixes involving a data claim** (counts, totals, filters): use Playwright to cross-check the result against an independent source of truth in the app (a different view/table showing the same underlying data) rather than trusting a single code path.

If the environment doesn't allow running or testing the app, say so explicitly instead of declaring the task complete.

---

## Frontend components → unit test (+ storybook for UI primitives)

Every new component needs a unit test (`ComponentName.test.tsx`) written before the component itself.

Generic UI components in `src/components/ui/` also need a Storybook story (`ComponentName.stories.tsx`). Feature components in `src/features/` do not.

---

## Date operations

Always use the project's existing date library — `date-fns` on the frontend. No manual date math, no `new Date()` arithmetic, no other libraries. The backend has its own established approach — follow whatever is already in use there.
