---
name: testing
description: Use when writing or finishing any feature, fixing a bug, or setting up CI. Requires unit tests (Jest), integration tests (React Testing Library with mocked API) and browser end-to-end tests (Playwright) for major workflows.
---

# Automated testing

Three layers, all required for a major workflow. A feature is not done until its tests exist and pass.

## Layers
| Layer | Tools | What it proves |
|---|---|---|
| Unit | Jest | pure logic: `lib/`, adapters, zod schemas, flag registry, config validity, error mapping |
| Integration | Jest + React Testing Library + `msw` + `jest-axe` | a screen renders from config with a mocked API; user interactions; flag on/off; loading/empty/error; notifications; accessibility |
| E2E | Playwright (`e2e/`) | real browser, built static site, full workflow on desktop and a phone viewport |

## Rules

### 1. Order of work for a feature
schema -> adapter -> component -> flag -> unit tests -> integration tests -> E2E.
**Why:** each layer's test pins the behaviour before the next layer builds on it.

### 2. Unit tests are fast and pure
No network, no timers without fakes. Table-driven for rules (scores, error mapping, `safeUrl`, flag defaults).
**Coverage thresholds:** 80% lines overall; 100% on `flags/`, `config/` schema and `api/errors`.

### 3. Integration tests use behaviour, not implementation
Query by role/label/text (`getByRole`), never by class or test-id unless there is no accessible name. Use `userEvent`.
Mock the network with `msw`, never mock your own components.
**Must cover:** happy path; loading, empty, error and offline states; each notification mapping; flag on and off; keyboard use;
`axe` clean.

### 4. Config-driven tests
A screen test renders from its real config JSON and a variant: reorder columns, hide a field via `flag`/`roles`, and assert the output changes.
**Why:** it proves the screen is actually config-driven.

### 5. E2E for each major workflow
Playwright against the static build (`next build` then serve `out/`) with the backend mocked at the network layer (or a seeded test backend).
Cover each workflow end to end (for example: sign in, create item, edit, status change with a gate, error path, sign out), in a desktop and a
mobile viewport, with a keyboard-only pass for one flow. Tag `@smoke` for the pre-merge set, full suite nightly.
**Why:** unit and integration cannot catch routing, bundling or CSP problems.

### 6. Enforcement scans are tests
`src/test/enforcement/` fails on: inline styles, hex/px outside `theme/`, files/functions over limits, storage access outside
`platform/`, raw `<img>`, invalid config, unknown widget types, flags without tests, error codes without presentation.
A ratchet file lists known violations and may only shrink.

### 7. Test data
Factories in `src/test/factories/` build valid view models; never copy-paste fixtures; time and randomness are injected.

### 8. Bugs get a test first
Reproduce with a failing test, then fix.

### 9. Flaky tests are bugs
No sleeps; wait on conditions; quarantine with an issue, never retry-until-green silently.

### 10. CI
PR: lint, types, unit + integration, duplicate check, size budget, `@smoke` E2E. Main/nightly: full E2E, Lighthouse CI, visual regression
(`storybook-visual-regression`). Reports and traces uploaded on failure.

## File placement
`Foo.test.tsx` beside `Foo.tsx`; adapters `foo.adapter.test.ts`; E2E in `e2e/<workflow>.spec.ts`; shared helpers in `src/test/`.
