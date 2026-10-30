---
name: supply-chain-hygiene
description: Use when adding, upgrading or removing a dependency, plugin, script or build tool, and when setting up dependency automation. Controls what third-party code enters the app and keeps it patched.
---

# Supply-chain hygiene

## Rules

### 1. Adding a dependency needs a reason and approval
Before adding: does a native API, an existing dependency, or a small local function do it (`reuse-before-build`)? Check maintenance
(recent releases, maintainers), size (`performance-budgets`), licence, install scripts, and known advisories. Ask the user.
**Why:** every dependency is code you run and ship but did not write.

### 2. Pin and lock
Exact versions (or tight ranges reviewed by automation), committed lockfile, `npm ci` in CI. **Why:** reproducible builds.

### 3. Automated updates on a schedule
Renovate or Dependabot: grouped weekly PRs for minor/patch, separate PRs for majors; security updates immediately. CI must pass
before merge; Capacitor and Next majors are planned work.

### 4. Audit gates
`npm audit --omit=dev --audit-level=high` blocks merges; accepted risks are recorded with an expiry in `audit-exceptions.json`.

### 5. No surprise install scripts
Install with `--ignore-scripts` by default; allow-list packages that need scripts (native tooling). Review new `postinstall` code.

### 6. Licences
`license-checker` against an allowlist (MIT, Apache-2.0, BSD, ISC); copyleft needs approval.

### 7. SBOM and provenance
Generate a CycloneDX SBOM per release; prefer packages with provenance/signed releases; build in CI from a clean checkout, not a laptop.

### 8. Third-party scripts and SDKs
Scripts loaded in the page or native SDKs inside the app need an owner, purpose, data flow note, SRI hash where possible (`frontend-security`),
and store privacy-label updates.

### 9. Remove what you do not use
`depcheck`/`knip` in CI to flag unused dependencies and exports. **Why:** less surface, smaller bundle.

### 10. Lockstep for tooling
Node version pinned (`.nvmrc`, `engines`), package manager pinned (`packageManager`), CI uses the same.

## PR note for any dependency change
Name, version, why, size impact, licence, alternatives considered.
