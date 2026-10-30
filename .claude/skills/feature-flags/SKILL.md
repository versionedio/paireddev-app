---
name: feature-flags
description: Use for EVERY new feature, behaviour change or screen. Requires the work to ship behind a backend feature flag fetched at startup per user or tenant, read only through the flags module, with tests for both states and a removal plan.
---

# Feature flags

The backend owns flags. The front-end fetches them once at startup, per user/tenant, as a map of key to boolean or variant.
Every new feature is built behind a flag so it can ship dark, roll out gradually and be switched off without a deploy.

## Rules

### 1. Every new feature has a flag
**Why:** it separates deploying from releasing and gives an instant off switch.
**How to apply:** pick the key before coding (`kebab-case`, noun-first: `plan-preview`, `bulk-actions`), add it to the registry
(`src/flags/registry.ts`: key, owner, default, description, removal condition), and create it in the backend.

### 2. Flags are loaded once, through one module
`loadFlags()` runs at startup (`src/flags/`), result held in context. No component fetches flags or reads env for features.
**Why:** one source avoids flicker and inconsistent views. **How to apply:** a loading flag state renders the shell with
flagged items hidden, never half-shown.

### 3. Read only via `useFlag` and `<Feature>`
```tsx
const on = useFlag('bulk-actions');           // boolean
const variant = useFlagVariant('checkout');   // 'a' | 'b' | 'off'
<Feature flag="bulk-actions"><BulkBar /></Feature>
```
**Why:** one reading path makes flags greppable and testable. **How to apply:** a lint rule bans importing the flag store
directly; config entries use the `flag` key instead of a component check (`config-driven-ui`).

### 4. Safe default on failure
If the flag call fails or a key is unknown, use the registry default (almost always `false`) and report through `observability`.
**Why:** an outage must not turn unfinished features on. **How to apply:** cache the last good map in `platform/storage`
for offline starts, with an expiry.

### 5. Gate at the edge, not deep inside
Gate a route, a config entry, or one top-level widget. Do not sprinkle `if (flag)` through helper functions.
**Why:** deep gates make behaviour impossible to reason about. **How to apply:** prefer `flag` on the config entry.

### 6. Flags do not replace permissions
A flag says whether a feature is released; roles say who may use it. **Why:** mixing them hides access bugs.
The server still enforces both.

### 7. Test both states
Every flagged feature has tests with the flag on and off (renders / absent, no errors, no leaked routes).
**Why:** the off path is the one used in production first. **How to apply:** `renderWithFlags({ 'bulk-actions': true })` in `src/test/`.

### 8. Flags are temporary
Each registry entry has a removal condition. Once fully rolled out: delete the flag branch, the registry entry, the tests for
the off state, and ask the backend to retire the key.
**Why:** stale flags are untested code paths. **How to apply:** a scan test fails when a registry flag is older than its
review date without an owner note.

## Payload (example)
`GET /flags` -> `{ "flags": { "bulk-actions": true, "checkout": "b" } }`. Do not mirror backend names into components; the
registry is the contract.
