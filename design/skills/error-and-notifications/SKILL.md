---
name: error-and-notifications
description: Use when showing any success, info, warning or error message, handling API failures, validating forms, or defining how the app reports problems. One severity model, one display system, one backend error contract.
---

# Error handling and notifications

Every message the user sees has a **severity**, a **presentation**, and comes from **config**, not from the call site.

## Severity model (one set everywhere)
| Severity | Meaning | Default presentation | Live region |
|---|---|---|---|
| `success` | something worked | toast (auto-dismiss ~4s) | status |
| `info` | useful, no action needed | toast or inline note | status |
| `warn` | works but needs attention | banner (stays until resolved) | status |
| `error` | an action failed | inline (field/section) or error panel with retry | alert |
| `critical` | cannot continue (session expired, version too old) | blocking dialog | alert |

Each severity has tokens in the theme (colour, icon, tint) so they look identical across screens (`design-tokens-styling`).
Status is never colour alone: icon + text always.

## Rules

### 1. One API: `notify()`
`notify({ code: 'item.saved' })` or `notify(appError)`. A single `<Notifications>` host renders toasts, banners and dialogs.
**Why:** call sites should say what happened, not how to draw it. **How to apply:** no ad-hoc `alert`, `console.error`-only
failures, or hand-built toasts.

### 2. Presentation is config
`src/config/messages.json` maps a `code` to `{ severity, presentation, text (content key), retryable, action? }`.
```json
{ "item.saved": { "severity": "success", "presentation": "toast", "text": "msg.item.saved" },
  "item.conflict": { "severity": "error", "presentation": "inline", "text": "msg.item.conflict", "retryable": false },
  "session.expired": { "severity": "critical", "presentation": "dialog", "text": "msg.session.expired" } }
```
**Why:** changing how a message appears is a config edit. **How to apply:** enforcement test fails if a code has no
severity or presentation.

### 3. Backend error contract
The backend returns `{ "code": "item.conflict", "message": "...", "details": {...}, "requestId": "..." }`.
`api/errors.ts` parses it (and any non-conforming/network failure) into a typed `AppError { code, severity, status, retryable, requestId, fields? }`.
**Why:** one contract lets every endpoint behave the same. **How to apply:** unknown codes map to a generic message per
HTTP class; **raw server `message` is never shown to users** (it may leak internals) but is logged.

### 4. HTTP status mapping (in `api/errors.ts`, data-driven)
| Status | Behaviour |
|---|---|
| network down / timeout | offline banner + retry; queue-safe writes only |
| 400/422 | field errors inline from `details.fields`; form stays filled |
| 401 | clear session, `session.expired` dialog, return to sign-in |
| 403 | forbidden state on that region, no data leak |
| 404 | empty/not-found state, not an error toast |
| 409 | conflict inline with a reload/resolve action |
| 429 | wait per `Retry-After`, auto-retry once, then banner |
| 5xx | error panel with retry (idempotent GETs auto-retry with backoff), show `requestId` |

### 5. Show a reference, not a stack trace
Error panels show a short plain message, what to do next, and the `requestId` for support. **Why:** it ties the UI to backend logs.

### 6. Success and info are quiet
One toast per user action; no toast for passive loads; never stack more than 3; keep messages short and in the user's words
(`helpful-hints-and-microcopy`).

### 7. Inline beats toast for input problems
Validation errors appear next to the field (linked by `aria-describedby`) and a summary focuses the first error on submit.

### 8. Accessibility
`role="status"` / `aria-live="polite"` for success/info/warn; `role="alert"` for error/critical; focus moves to blocking dialogs.

### 9. Boundaries catch the rest
Region error boundaries show the same error panel and report through `observability` (`state-and-rendering`).

### 10. No PII in messages or logs. Messages are translatable keys (`i18n-content`).

## Test
Per code: severity + presentation render correctly; unknown code falls back; each HTTP status maps as above; live-region role is set.
