---
name: component-architecture
description: Use when writing or reviewing any component, hook or module. Enforces small files and functions, one component per file, logic outside JSX, and composition from shared primitives so code stays modular and reusable.
---

# Component architecture

## Limits (enforced by ESLint)
| Thing | Limit |
|---|---|
| any file | 200 lines |
| component file | 150 lines |
| function | 30 lines |
| parameters | 4 (else pass one context object) |
| cyclomatic complexity | 8 |

**Why:** bulky files and functions are untestable, unreusable and the most expensive code to change.
**How to apply:** near a limit, split. Do not raise a limit to fit a change.

## Rules

### 1. One component per file, one job per component
A component renders one thing. A "coordinator" composes small parts; it does not do the parts' work.
**Why:** a component that needs a comment to explain it is too big. **How to apply:** if you cannot name it in two words, split it.

### 2. Logic lives outside JSX
Business rules, formatting and data shaping go in `lib/` (pure) or a hook (`useXxx`). Components wire props to markup.
**Why:** pure functions test in one line. **How to apply:** `lib/score.ts` computes, `useScore` fetches, `<ScoreBadge>` shows.

### 3. Side effects are confined
Network in `api/`, device and storage in `platform/`, timers/subscriptions in hooks. Never in render, never in `lib/`.
**Why:** it keeps components predictable and tests simple.

### 4. Build from primitives
Screens compose `components/ui` (Button, Field, Input, Select, Badge, Tag, Modal, Sheet, Tabs, Table, Card, Callout, EmptyState).
Need a new look? Add a variant to the primitive (`design-tokens-styling`), not a local copy.
**Why:** consistent controls everywhere. **How to apply:** `reuse-before-build` first.

### 5. Data-driven over branching
Prefer a lookup (`STATUS_TONE[status]`, `TRANSITIONS[trigger]`) over growing `if/else` or `switch`.
**Why:** adding a case becomes adding data. **How to apply:** a third branch is the signal to extract a table.

### 6. Typed, narrow props
Props are explicit types; no `any`; no passing whole objects when two fields are needed; no boolean-prop piles
(`primary danger large`): use `variant` and `size`.
**Why:** narrow props make reuse and memoization honest.

### 7. Composition over configuration sprawl
Use `children` and slots (`<Card><Card.Header/>...`) instead of ten props for optional pieces.
**Why:** it keeps the primitive small while allowing variety.

### 8. Naming
Suffix encodes role: `Foo` component, `useFoo` hook, `foo.ts` pure module, `foo.adapter.ts`, `foo.test.tsx` beside it,
`Foo.module.css` beside the component. Avoid `Manager`/`Helper`/`Utils` grab-bags.
**Why:** the name should tell you what it may touch.

### 9. Public surface is small
Each feature folder exports through `index.ts`; other features import only from it.
**Why:** hidden internals can change freely.

## Quick review questions
Does it fit the limits? Could a config entry replace it? Is there a primitive for it already? Is there logic in the JSX?
Can I test it without rendering the whole app?
