---
name: design-tokens-styling
description: Use whenever writing or changing CSS, styling a component, choosing a colour, font, size, spacing or radius, or adding a visual variant. Enforces a single token file as the only place for fonts, colours and sizes, and bans inline styles and literal values.
---

# Design tokens and styling

One file controls how the whole app looks: `src/theme/tokens.css`. Change a font, a colour or a size there and everything follows.

## Rules

### 1. Tokens are the only source of visual values
Fonts, type scale, colours (with light and dark values), spacing, radii, borders, shadows, control heights, motion, z-index
and status colours are CSS custom properties in `src/theme/tokens.css`.
**Why:** a value written in a component can only be changed by finding every copy.
**How to apply:** need a value that is not there? Add a token with a semantic name (`--color-surface`, not `--grey-2`),
then use it. Never reach for a literal.

### 1a. Never create drift: no per-element design
Fonts sizes, weights and colours belong to a small, shared set of **roles** (display, heading, title, body, secondary, caption, label;
text colour ladder; status tones), and an element picks the role it *is*. Never add `--fs-<element>`, `--color-<element>`, a one-off
size, or an override for "just this card".
**Why:** per-element values let the same kind of text look different on different screens, and every new element adds another
value to keep in sync. **How to apply:** new kind of text -> find its role. No role fits -> propose a new role for the whole app
(and where it applies everywhere), never a local one. The check script and stylelint fail on literals and per-element tokens.

### 1b. Web and mobile may look different, but never as a copy
The same roles and components serve both. A platform difference is a different **value** for a token (a larger `--h-md` and
`--fs-body` on touch, bottom sheets instead of popovers, bottom nav instead of top nav), set once in the token/theme layer under a
breakpoint, `(pointer: coarse)` or a `data-platform="native"` attribute (set by `platform/`). It is never a second component, a
second stylesheet or a per-screen `if (isMobile)`.
**Why:** a duplicated mobile UI doubles every future change and drifts from the web one. **How to apply:** need the app to look
different on mobile? Change token values or layout variables under the platform condition, or let config choose a different
layout region (`config-driven-ui` `hideBelow`/`showBelow`). If a screen needs a genuinely different structure, the config
describes it; the widgets stay shared.

### 2. No inline styles
No `style={{...}}`, no `style="..."`. The one exception: setting a CSS variable from data
(`style={{ '--progress': pct }}`), where the stylesheet decides what it means.
**Why:** inline styles bypass themes, dark mode, density and media queries.
**How to apply:** use a CSS Module class, or a variant prop that maps to a class. ESLint blocks the `style` prop.

### 3. Component CSS uses only `var(--token)`
No hex, `rgb()`, `hsl()`, `oklch()`, `px` font sizes, or font names outside `src/theme/`.
**Why:** it keeps theming and re-branding a one-file job. **How to apply:** stylelint (`_templates/.stylelintrc.json`) fails
the build; spacing may use `calc(var(--space-2) * 2)`.

### 4. Variants live in the theme, not at the call site
Button looks (`primary`, `ghost`, `danger`), status tones (`success`, `info`, `warn`, `error`), and sizes (`sm`, `md`, `lg`)
are defined once and selected by prop.
**Why:** screens that invent their own look drift apart. **How to apply:** a new look is a new variant class in the primitive,
reviewed like any API change. Tints derive from one accent with `color-mix`, so a new status is one colour.

### 5. One control-height ladder
`--h-sm`, `--h-md`, `--h-lg` size every button, input, select and chip; coarse pointers get larger values.
**Why:** mixed heights (24/26/29/31/32/34) look untidy and fail touch targets. **How to apply:** controls never set their own height.

### 6. Light and dark are both complete
Define each colour once as a pair (`light-dark()` or a theme attribute), set `color-scheme`, give `body` an explicit background.
**Why:** a colour defined for one theme alone breaks the other. **How to apply:** check every new token in both themes.

### 7. Typography is a scale
Two families at most (UI and mono), sizes from `--fs-*`, weights from `--fw-*`, line-heights from `--lh-*`.
**Why:** ad-hoc sizes destroy hierarchy. **How to apply:** components pick a role (`heading`, `body`, `caption`, `label`)
through a class, not a size.

## Token file shape
```css
:root {
  --font-ui: "Inter", system-ui, sans-serif;  --font-mono: ui-monospace, monospace;
  --fs-xs: .75rem; --fs-sm: .875rem; --fs-md: 1rem; --fs-lg: 1.25rem;
  --space-1: .25rem; --space-2: .5rem; --space-3: .75rem; --space-4: 1rem;
  --r-sm: 4px; --r-md: 8px;  --h-sm: 32px; --h-md: 40px; --h-lg: 48px;
  --color-surface: light-dark(#fff, #14120f);  --color-primary: light-dark(#c2410c, #fb923c);
  --tone-success: ...;  --tone-info: ...;  --tone-warn: ...;  --tone-error: ...;
}
```
(Literals appear here, and only here.) Worked example: `design/theme.css`.
