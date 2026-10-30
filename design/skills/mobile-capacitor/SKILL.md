---
name: mobile-capacitor
description: Use when a feature touches device capabilities, storage, navigation, network state, app lifecycle, permissions, or anything that must also run inside the Capacitor iOS/Android wrapper. Keeps the web code portable to mobile.
---

# Mobile-ready with Capacitor

The same static build runs in the browser and inside the Capacitor WebView. Anything platform-specific hides behind an adapter.

## Rules

### 1. Platform access only through `src/platform/`
No direct `window`, `document`, `navigator`, `localStorage`, `Capacitor.*` or plugin imports outside `src/platform/`. Adapters:
`storage`, `secureStorage`, `network`, `share`, `haptics`, `appLifecycle`, `backButton`, `keyboard`, `statusBar`, `openUrl`,
`camera`/`files` as needed. Each has a web fallback and a mock for tests.
**Why:** this is what makes the app portable and testable. **How to apply:** ESLint restricts globals outside `platform/`.

### 2. Responsive and touch-first
Everything in `accessibility-responsive` applies: 44px targets, bottom sheets, bottom navigation on small screens,
no hover-only UI, `env(safe-area-inset-*)` on fixed bars, `dvh` units, no horizontal page scroll.
**Why:** the WebView has notches, home indicators and soft keyboards.

### 3. Static-export constraints
No API routes, server actions, middleware, or request-time rendering; routes work from `file`/`capacitor://` origins, so use
relative asset paths and `trailingSlash`, and avoid absolute-origin assumptions. The base API URL comes from build config.
**Why:** Capacitor bundles files, it does not run Node.

### 4. Navigation and back button
Client routing with deep-linkable routes; the Android hardware back button goes back, closes overlays first, and exits only at the
root; swipe-back on iOS must not lose form data (confirm discard). Deep links are validated as input (`input-validation`).

### 5. Offline and flaky networks
`platform/network` exposes online state; screens show the offline banner (`error-and-notifications`); reads use cached data;
writes either queue safely or fail clearly; retry with backoff. Never assume a request completes before the app is suspended.

### 6. App lifecycle
Pause timers/streams on background, refresh stale data and re-check flags and session on resume; no sensitive content in app-switcher snapshots if required.

### 7. Storage
Non-sensitive: `platform/storage` (Preferences / localStorage fallback). Sensitive: `platform/secureStorage`. All reads are
validated and versioned (`input-validation`); schema changes migrate or reset.

### 8. Permissions
Request lazily at the moment of need with a plain explanation first; handle denial gracefully with a path to settings; list every
permission and its purpose in the native manifests and store listing.

### 9. Plugins are dependencies
Adding a plugin needs approval (`supply-chain-hygiene`), an adapter, a web fallback, and a note on iOS/Android config changes.
Keep native changes out of OTA updates (`git-hooks-and-release`).

### 10. Performance on devices
Budgets from `performance-budgets` apply on mid-range phones; avoid heavy synchronous work at startup; show the shell fast and load flags/data after.

### 11. Inputs and keyboards
Correct `inputmode`, `autocomplete`, `enterkeyhint`; scroll focused fields into view above the keyboard; avoid fixed bottom bars that the keyboard covers.

### 12. Build and sync
`next build` -> `out/` -> `npx cap sync` -> open in Xcode/Android Studio. CI builds the web bundle on every PR; store builds run in release pipelines.

## Test
Adapter unit tests with mocks; Playwright mobile viewport and touch emulation; a manual device checklist (offline, back button, rotate, permission denied, background/resume).
