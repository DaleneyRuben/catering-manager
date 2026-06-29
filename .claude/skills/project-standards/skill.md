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

## Frontend components → unit test (+ storybook for UI primitives)

Every new component needs a unit test (`ComponentName.test.tsx`) written before the component itself.

Generic UI components in `src/components/ui/` also need a Storybook story (`ComponentName.stories.tsx`). Feature components in `src/features/` do not.

---

## Date operations

Always use the project's existing date library — `date-fns` on the frontend. No manual date math, no `new Date()` arithmetic, no other libraries. The backend has its own established approach — follow whatever is already in use there.
