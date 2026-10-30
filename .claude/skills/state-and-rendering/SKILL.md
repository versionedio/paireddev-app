---
name: state-and-rendering
description: Use when deciding where state lives, composing components, fetching data in components, optimising renders, or handling long lists and loading boundaries. Covers state placement, composition, rendering anti-patterns and request waterfalls.
---

# State management and rendering

## Rules

### 1. Place state at the lowest level that works
Ladder: **local state** -> **lifted to the nearest common parent** -> **context** (stable, app-wide: theme, flags, session)
-> **a store** (shared and frequently changing). Move up only when the lower level hurts.
**Why:** global state spreads coupling and re-renders. **How to apply:** start local; promote with a reason in the PR.

### 2. Server data is not component state
Use the query cache (`api-data-layer`). Never `useEffect(() => fetch().then(setState))`.
**Why:** it duplicates caching, loading and error handling, and goes stale.

### 3. Derive, do not store
Anything computable from props or state is computed (during render or `useMemo` if measured slow), not mirrored in state.
**Why:** mirrored state drifts. **How to apply:** an effect whose only job is to set state from other state is a bug.

### 4. Keep state minimal and normalised
Store ids and flags, not copies of objects; one source of truth per fact; reducers for multi-field transitions.
**Why:** fewer states mean fewer impossible combinations. **How to apply:** model status as one union (`'idle' | 'loading' | 'error'`),
not three booleans.

### 5. Compose instead of drilling or flagging
Pass `children`/slots; use context for deep stable values; do not thread props through four layers or add boolean switches.
**Why:** composition keeps parts reusable.

### 6. Avoid rendering anti-patterns
- Components defined inside components; inline object/array/function props that defeat memoization where it matters.
- Index keys on reorderable lists; unstable keys.
- Giant context values that change often (split contexts by rate of change).
- Effects for derived data or event handling; missing cleanup for subscriptions and timers.
- Layout thrash (reading then writing layout in loops); animating layout properties instead of `transform`/`opacity`.
**How to apply:** React profiler before `memo`/`useMemo`/`useCallback`; add them only with a measured reason noted in a comment.

### 7. No waterfalls
Independent fetches start together; fetch at the route, not inside deeply nested children; prefetch on intent (hover/focus/route change);
code-split with `next/dynamic` but preload the next likely chunk.
**Why:** each serial step adds a full network round trip, painful on mobile.

### 8. Boundaries per feature
Wrap each feature in an error boundary (fallback uses `error-and-notifications`) and Suspense/skeleton boundary so one failure or load
does not blank the page. **How to apply:** boundaries sit at region level in `ConfigScreen`.

### 9. Long lists are virtualised or paged
Anything over ~100 rows uses virtualisation or server paging; row components are memoized and cheap.
**Why:** large DOMs wreck mobile scroll. **How to apply:** the table widget owns this, not each screen.

### 10. Forms
Controlled only where needed; one schema validates (`input-validation`); field state local to the form; submit state is one union.

## Smells to flag in review
`useEffect` setting state, a prop passed through 3+ components, `useState` copied from props, array index as key,
fetch inside a list item, a context with 10 values.
