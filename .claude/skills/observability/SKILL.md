---
name: observability
description: Use when adding error reporting, analytics, performance monitoring, client logging, or debugging production issues. Defines privacy-safe monitoring with request correlation to the backend.
---

# Observability

## Rules

### 1. One reporting module
`src/lib/telemetry` (or `platform/telemetry`) is the only place that talks to Sentry, a RUM provider or analytics.
**Why:** one choke point for scrubbing, sampling and swapping vendors. **How to apply:** components call `report(error, context)` / `track(event)`.

### 2. Privacy first
No tokens, emails, names, free text, or identifying ids in events. Scrub centrally with an allowlist of fields; use an opaque user id.
**Why:** monitoring data is long-lived and widely accessible. **How to apply:** unit test the scrubber with known-bad payloads.

### 3. Correlate with the backend
Every request carries a `requestId` (`api-data-layer`); errors report it; the UI shows it to the user (`error-and-notifications`).
**Why:** a support ticket should map to one backend trace.

### 4. What to capture
Unhandled errors and promise rejections, error-boundary catches, failed API calls (status, code, requestId, no payloads), Core Web
Vitals, slow interactions, flag-load failures and fallbacks (`feature-flags`), app version, platform (web/iOS/Android), locale.

### 5. Structured logs, levels, no `console` noise
`log.debug/info/warn/error` with structured context; debug off in production; no `console.log` committed (lint).

### 6. Sampling and cost
Sample performance traces; cap error events per session; dedupe repeats.

### 7. Releases and source maps
Tag every build with version and commit; upload source maps to the vendor in CI only (never publish them publicly); alert on a new release's error spike.
**Why:** unreadable stack traces are useless.

### 8. Product analytics are opt-in aware
Respect consent and platform privacy rules (ATT/GDPR); events are named verb-object (`item_created`) from a typed registry; no event without an owner and purpose.

### 9. Alerts have owners
Alert on user-impacting signals (error rate, failed sign-in, crash-free sessions, LCP regression), each with a runbook link.

### 10. User feedback
"Report a problem" includes version, route and `requestId`, never page content.

## Test
Scrubber tests; `report()` is called by error boundaries and failed requests; telemetry disabled in tests.
