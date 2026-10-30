---
name: frontend-security
description: Use when handling auth tokens, storage, secrets, environment variables, third-party scripts, headers, logging or permissions in the front-end. Complements input-validation with storage, transport, headers and dependency rules.
---

# Front-end security

Input and output handling is in `input-validation`. This skill covers everything else.

## Rules

### 1. Tokens: never in `localStorage`
Device: Capacitor secure storage (Keychain/Keystore) through `platform/secureStorage`. Web: in memory, or an httpOnly,
Secure, SameSite cookie set by the backend. Refresh tokens never reach JavaScript on web.
**Why:** any XSS reads `localStorage`. **How to apply:** lint bans `localStorage`/`sessionStorage` outside `src/platform/`.

### 2. No secrets in the bundle
Anything in `NEXT_PUBLIC_*` or the static build is public. Only public identifiers (API base URL, public keys) belong there.
**Why:** a static export has no server to hide values. **How to apply:** the build fails if an env var matching `SECRET|KEY|TOKEN|PASSWORD`
is prefixed `NEXT_PUBLIC_`; keep secrets in the backend.

### 3. Content Security Policy and headers
CloudFront response-headers policy sets: `Content-Security-Policy` (default-src 'self'; script-src 'self' plus hashes; no
`unsafe-inline`/`unsafe-eval`; connect-src lists the API), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`.
**Why:** it limits damage when something slips through. **How to apply:** `<meta http-equiv>` CSP for the Capacitor build;
document both in `seo-static-export`'s deploy notes.

### 4. Third-party scripts need approval
Each script has an owner, purpose and SRI hash; no tag managers loading arbitrary code; analytics through `observability`.
**Why:** a third-party script has full page access.

### 5. Dependencies
Pinned versions, committed lockfile, `npm audit --omit=dev` gate, no unreviewed `postinstall` scripts (`supply-chain-hygiene`).

### 6. Authentication UX
Sign-out clears memory, storage and query cache; 401 triggers the single `session.expired` flow
(`error-and-notifications`); re-auth returns to a validated `returnTo` (`input-validation`).

### 7. Permissions are a convenience
Role-based hiding of UI is for clarity only. Every action is authorised by the server. Never ship admin-only data to the client
and hide it.

### 8. Logging and analytics
No tokens, emails, free text or ids that identify a person in logs, error reports or analytics; scrub in one place
(`observability`).

### 9. Clickjacking, framing and links
`frame-ancestors 'none'`; external links use `rel="noopener noreferrer"`; open external URLs through the platform adapter.

### 10. Mobile specifics
Disable WebView debugging in release builds; no cleartext HTTP; certificate pinning only if the backend team agrees; request
permissions lazily with a reason; clear sensitive data on background if the app handles it (`mobile-capacitor`).

### 11. Clipboard, deep links, file access
Treat deep link params as input; never auto-execute actions from a link without confirmation for destructive ones.

## Review checklist
Any new storage use? any new env var? new origin in `connect-src`? new script? new permission? new deep link route?
