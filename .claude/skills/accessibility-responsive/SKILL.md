---
name: accessibility-responsive
description: Use when building or reviewing any UI for semantic HTML, keyboard and screen-reader support, visible interactive states, contrast, touch targets, and responsive layout from phone to desktop.
---

# Accessibility and responsive design

## Rules

### 1. Semantic HTML first
Use `<button>` for actions, `<a>` for navigation, `<table>` for tabular data, `<ul>` for lists, landmarks (`header`, `nav`,
`main`, `aside`, `footer`), one `<h1>` per page and ordered headings. ARIA only when HTML cannot express it.
**Why:** native elements bring keyboard, focus and screen-reader behaviour for free. **How to apply:** `jsx-a11y` lint (strict) and `jest-axe`.

### 2. Every control is labelled
Inputs have a visible `<label>` (or `aria-label` for icon-only), errors and hints linked with `aria-describedby`, icon-only
buttons have a name and a tooltip. **Why:** unlabeled controls are unusable by assistive tech.

### 3. Visible interactive states, defined once
Every interactive element has hover, `:focus-visible`, active, disabled, loading and selected states, defined in the theme
(`design-tokens-styling`) and inherited by primitives. Never `outline: none` without a replacement.
**Why:** users need to see what is interactive and where focus is. **How to apply:** new control = reuse a primitive; if
none fits, add the states to the theme, not locally.

### 4. Keyboard and focus
Everything works without a mouse; logical tab order; Escape closes overlays; modals and sheets trap focus and restore it on close;
skip-to-content link; drag-and-drop always has a keyboard/menu alternative.
**Why:** touch, keyboard and switch users share this path.

### 5. Contrast and meaning
Text and controls meet WCAG AA from tokens; never colour alone for meaning (add icon or text); respect `prefers-reduced-motion`
and `prefers-color-scheme`.
**How to apply:** check new tokens in light and dark; status tones always include an icon and a label.

### 6. Touch targets
Interactive targets are at least 44x44 CSS px (via `--h-*` and padding), with space between neighbours; no hover-only affordances.
**Why:** this is also a Capacitor requirement (`mobile-capacitor`).

### 7. Mobile-first responsive
Write base styles for 360px, enhance upward with breakpoint tokens (`--bp-sm/md/lg`). No fixed widths on variable content;
use `min()`, `clamp()`, grid/flex with `minmax(0, 1fr)`. The page never scrolls sideways; wide tables, charts and code scroll
inside their own container. Use `dvh` not `vh`, and `env(safe-area-inset-*)` on fixed bars.
**Why:** most traffic and every Capacitor build is a phone. **How to apply:** test at 360, 768 and 1280.

### 8. Overlays become sheets on small screens
Popovers and modals present as bottom sheets under the small breakpoint with a clear close control.

### 9. Text scales
Sizes in `rem`; layouts survive 200% text zoom; no truncation that hides meaning without a tooltip or expand.

### 10. Announce changes
Toasts and async results use `role="status"`/`aria-live="polite"` (errors `role="alert"`), consistent with
`error-and-notifications`.

## Test
`jest-axe` on every screen render; Playwright keyboard-only path for each major workflow; one mobile viewport run in E2E (`testing`).
