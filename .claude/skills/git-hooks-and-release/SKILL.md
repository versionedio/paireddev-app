---
name: git-hooks-and-release
description: Use when setting up commit hooks, commit conventions and PR checks, or when preparing a web, iOS or Android release, including OTA updates. Defines local gates, the PR checklist and a safe release policy.
---

# Git hooks and release

## Local gates

### 1. Pre-commit is fast
husky + lint-staged: lint and format changed files, typecheck, run related unit tests. Under ~10 seconds.
**Why:** slow hooks get bypassed. Heavy checks (E2E, visual, Lighthouse) run in CI.

### 2. Commit-msg: conventional commits
`feat(scope): ...`, `fix`, `refactor`, `test`, `docs`, `chore`; breaking changes marked. **Why:** automated changelog and version bumps.

### 3. No bypass as a habit
`--no-verify` only for a stated emergency; CI re-runs everything.

## PR rules

### 4. PR checklist is the definition of done
Copy from `frontend-standards`: reuse decision, flag, no inline styles, config-driven, states, validation, a11y, tests (unit, integration, E2E),
size/duplicate checks, help content updated. Screenshots at 360px and desktop, light and dark.

### 5. Small PRs
One concern per PR; refactors separate from features (`reuse-before-build` asks first). Required reviewers include one who checks the flag and config.

## Release

### 6. Trunk-based with flags
Merge to main continuously behind flags (`feature-flags`); releasing a feature is flipping a flag, not shipping a branch.

### 7. Versioning
Semantic versions from conventional commits; each build embeds version + commit (`observability`); the backend can report a minimum supported version.

### 8. Web release
CI: lint, types, tests, build `out/`, size and Lighthouse budgets, upload to S3 with correct cache headers, invalidate HTML in CloudFront,
smoke E2E against the deployed URL. Rollback = redeploy previous build artifact.

### 9. Store builds (Capacitor)
`next build` -> `cap sync` -> Fastlane lanes for iOS/Android (signing via CI secrets/match), beta tracks (TestFlight / internal testing) before production,
staged rollout (for example 5% -> 25% -> 100%), release notes from the changelog.

### 10. OTA (live update) policy
OTA may ship **web-layer changes only**. Never OTA: native plugins, permissions, entitlements, or behaviour that changes what the store reviewed.
Each OTA is signed, targets compatible native versions, rolls out in stages, auto-rolls back on a crash-rate or error-rate spike, and
is recorded in the changelog.

### 11. Force-upgrade
Backend-returned minimum version triggers a blocking `critical` message (`error-and-notifications`) with a store link.

### 12. Post-release
Watch error rate, crash-free sessions and Web Vitals for 24h; flags provide the first line of rollback.
