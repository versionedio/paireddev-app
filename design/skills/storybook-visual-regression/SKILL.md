---
name: storybook-visual-regression
description: Use when creating or changing a shared UI primitive or widget, or when a visual change needs review. Every primitive has stories across states, themes and viewports, with a visual snapshot gate and interaction tests.
---

# Storybook and visual regression

The component catalogue is also the first place to look before building (`reuse-before-build`).

## Rules

### 1. Every `components/ui` primitive and registry widget has stories
Cover each variant, size, state (default, hover, focus, disabled, loading, error, empty), long text, and RTL/pseudo-locale.
**Why:** states are where visual bugs hide. **How to apply:** a scan test fails if a primitive has no `*.stories.tsx`.

### 2. Stories are data-driven
Generate variants from the same variant lists the component uses (`design-tokens-styling`), so a new variant appears automatically.

### 3. Themes and viewports are toolbar options
Light, dark, density, and 360/768/1280 widths; a global decorator applies tokens and `data-theme`.

### 4. Interaction tests live in stories
`play` functions cover open/close, keyboard, focus trap and error display; they run in CI with the Storybook test runner and complement RTL (`testing`).

### 5. Accessibility addon is on
`@storybook/addon-a11y` runs axe per story; violations fail CI.

### 6. Visual snapshots gate PRs
Chromatic or Playwright screenshot comparison per story, light and dark, mobile and desktop. An intended change is approved in
the PR; an unintended diff blocks merge. Threshold small; disable animations and freeze time.
**Why:** token changes ripple everywhere; this shows exactly what moved.

### 7. Docs from stories
Props tables, usage notes ("use for..."/"do not use for...") and the token names each primitive uses.

### 8. No app logic in stories
Stories use mock props and the mock API adapter; they must not need the backend.

## CI
`storybook build` + test runner + visual snapshots run on PRs that touch `components/`, `theme/` or stories.
