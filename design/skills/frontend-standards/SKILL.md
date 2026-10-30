---
name: frontend-standards
description: Entry point for building or changing any web front-end feature. Read FIRST for any new screen, component, field, style, API call or flag. Defines the stack, folder layout, definition of done, and which other skill to read for each kind of change.
---

# Front-end standards (entry point)

Default stack: **Next.js static export (`output: 'export'`) + TypeScript**, SEO-friendly public pages, wrapped by **Capacitor**
for iOS/Android, deployed as static files to **S3 + CloudFront**. No API routes, no per-request server rendering, no
middleware. If an app deviates, say so in its CLAUDE.md and adapt the matching skill, do not silently ignore it.

## The non-negotiables
1. Search for similar code and ask about a refactor before building (`reuse-before-build`).
2. Every colour, font, size, space and radius comes from `src/theme/tokens.css` (`design-tokens-styling`). No inline styles.
3. What appears on a screen, where, in what order and with what label is config, not code (`config-driven-ui`).
4. Every new feature ships behind a backend feature flag (`feature-flags`).
5. Small files, small functions, reusable components (`component-architecture`).
6. Every trust boundary validates (`input-validation`); every failure is shown the same way (`error-and-notifications`).
7. Nothing is done until it is tested at unit, integration and E2E level (`testing`).

## Folder layout
```
src/app/          routes only: thin pages that pick a screen config and render it
src/components/   ui/ (primitives), notifications/, layout/ (shell, nav, sheet)
src/features/     one folder per feature: components, hooks, adapters, tests
src/config/       screens/*.json, content/*.json, messages.json, schema.ts
src/theme/        tokens.css, tokens.ts (names only), base.css
src/flags/        flag loading, useFlag, <Feature>, registry
src/platform/     the ONLY place that touches window, storage, Capacitor plugins
src/api/          client, adapters (backend shape -> view model), errors
src/lib/          pure helpers, no React, no I/O
src/test/         factories, msw handlers, enforcement scans
e2e/              Playwright specs
```
**Why:** where code lives tells the next reader what it may depend on. **How to apply:** if a file does not obviously belong
in one folder, the file does two things; split it.

## Which skill for which change
| You are... | Read |
|---|---|
| starting any feature | `reuse-before-build`, then `feature-flags` |
| adding or restyling UI | `design-tokens-styling`, `accessibility-responsive` |
| adding a screen, field, column, tab | `config-driven-ui`, `helpful-hints-and-microcopy` |
| calling the backend | `api-data-layer`, `error-and-notifications`, `input-validation` |
| writing a component or hook | `component-architecture`, `state-and-rendering` |
| touching device features or storage | `mobile-capacitor`, `frontend-security` |
| adding a public page | `seo-static-export` |
| adding an image, library or heavy widget | `performance-budgets`, `supply-chain-hygiene` |
| adding user-visible text | `i18n-content` |
| finishing | `testing`, `git-hooks-and-release`; wiring monitoring: `observability` |

## Definition of done
- [ ] Searched for similar code; reuse or refactor decision recorded in the PR.
- [ ] Behind a flag, with a test for flag on and off.
- [ ] No inline styles, hex, px literals or font settings outside `src/theme/`.
- [ ] Layout/fields/labels in config; a config edit alone changes the screen.
- [ ] Loading, empty, error and offline states exist and use shared components.
- [ ] Inputs and API responses validated; no HTML injection paths.
- [ ] Keyboard, focus and screen-reader checks pass; works at 360px wide.
- [ ] Unit + integration tests, and an E2E for a major workflow; lint, types, duplicate and size checks pass.
