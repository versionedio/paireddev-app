---
name: api-data-layer
description: Use when calling a backend, adding or changing an endpoint integration, mapping API responses, handling loading/empty/error states, or caching server data. Keeps the backend shape out of components via adapters and typed errors.
---

# API data layer

## Rules

### 1. The backend shape is a contract, not a mirror
Components never see raw API responses. `src/api/` calls the backend; adapters map responses to **view models**.
**Why:** a backend rename or restructure must change one adapter, not every screen.
**How to apply:** `api/items.ts` (calls) -> `api/adapters/item.ts` (`toItemView(raw)`) -> components consume `ItemView`.
Never expose storage keys or internal ids the UI does not need.

### 2. Validate at the boundary
Every response is parsed with a zod schema before the adapter runs (`input-validation`).
**Why:** a wrong response should fail loudly in one place. **How to apply:** an invalid response becomes an `AppError`
with code `bad_response` (`error-and-notifications`), not a crash in a component.

### 3. One client, one error type
A single `request()` function sets base URL, auth, `requestId`, timeouts and retry policy, and throws `AppError`.
**Why:** consistent behaviour and one place to add headers. **How to apply:** no `fetch` outside `src/api/`.
Retries only for idempotent calls and 429/5xx, with backoff.

### 4. Server data lives in a query cache
Use one query library (for example TanStack Query) for loading, caching, invalidation and optimistic updates.
**Why:** copying server data into component state causes stale and duplicated data (`state-and-rendering`).

### 5. Loading, empty, error and offline states are shared components
`<DataState query={q} empty={...}>` renders skeletons, empty guidance, error panel with retry, or offline notice.
**Why:** every screen handling these by hand means every screen handles them differently.

### 6. No request waterfalls
Independent requests start together; route-level prefetch; never fetch in a child after the parent finished fetching what the child needs.
**Why:** serial calls are the biggest avoidable delay on mobile networks.

### 7. Mock adapter for tests and demos
`src/api/mock/` implements the same interface with seed data and configurable latency; `msw` handlers mirror it for tests.
**Why:** screens must be developed and tested without the backend. **How to apply:** swapping mock for real is one config switch.

### 8. Writes are explicit
Mutations return the changed view model, invalidate affected queries, and surface failures through `notify()`.
Destructive actions confirm in the UI; the server still enforces.

## Layout
```
src/api/client.ts        request(), auth, requestId, retry
src/api/errors.ts        AppError, parseError(envelope)
src/api/<resource>.ts    calls + zod schemas
src/api/adapters/        raw -> view model
src/api/mock/            seed + latency
```
