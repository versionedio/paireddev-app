---
name: helpful-hints-and-microcopy
description: Use when adding or editing a page, form, empty state, tooltip, callout, or help content. Every page gets consistent, brief, plain-language guidance defined as content config, rendered by shared Hint, Callout and EmptyState components, plus a Help page per screen.
---

# Helpful hints and consistent microcopy

Users should never wonder what a page is for, what a field wants, or what to do next. Guidance is **content config** shown by
**shared components** in **one style**.

## Rules

### 1. Every page explains itself in one line
Under the page title: one plain sentence saying what the page is for. **Why:** orientation. **How to apply:** `pageHint` key in
the screen config pointing to `config/content/<screen>.json`.

### 2. Every field and control has the right amount of help
Label (always), hint (when the format or consequence is not obvious), example placeholder, and a validation message that says how to fix it.
Icon-only controls have a tooltip and an accessible name.
**Why:** guidance at the point of need beats a manual. **How to apply:** `Field` takes `hint`, `error`; `Button iconOnly` requires `label`.

### 3. Empty states say what to do next
Every empty list/table/search result shows what it is, why it is empty, and one primary action. **Why:** empty screens are where
users stall. **How to apply:** `<EmptyState title action>` fed by content keys; searches say how to clear filters.

### 4. First-use and rule callouts
Show a dismissible `Callout` for first-time guidance and for rules that surprise ("Agents cannot sign off"). Dismissal is remembered
per user (`platform/storage`). Use sparingly: at most one visible per page.

### 5. Consistent components, one style
Only `Hint` (inline text), `Tooltip` (hover/focus/tap), `Callout` (info/warn blocks, uses severity tones) and `EmptyState`.
Tooltips must work on touch (tap) and keyboard (focus). Never roll a bespoke tip. Styling comes from tokens (`design-tokens-styling`).

### 6. Plain, brief language
Short sentences, user words, active voice, no route names, parameter names, API terms or internal jargon in UI text. Sentence case.
Buttons start with a verb ("Create sprint"). Keep template placeholders like `{{name}}` only where users really author them.
**Why:** copy is part of the interface. **How to apply:** content reviewed like code; length limits in the content schema.

### 7. Copy is config, never inline in components
All user-visible text is a key in `src/config/content/*.json` (`i18n-content`), validated: every key referenced exists, none unused.
**Why:** copy edits must not need a component change, and translation needs keys.

### 8. A Help page per screen
A built-in Help route documents every screen with: **objective**, **when to use it**, a **use-case diagram** (actors, cases), a
**process flow** (steps, decisions, who acts), **rules the screen enforces**, related pages, and the API surface if useful. The book/help
icon in the header opens Help at the current screen; topics are linkable (`#help-<screen>`).
**Why:** one place to understand the product, and it is data, so it stays accurate. **How to apply:** content in
`config/content/help/<screen>.json`; one `Help` screen renders diagrams from that data. Adding a screen adds a help entry in the
same change (definition of done).
Reference implementation: `design/screens/help.js`, `design/data/docs.js`, `design/data/docs-extra.js`.

### 9. Errors and confirmations match the notification system
Messages are the same tone and format as `error-and-notifications`: say what happened, why if known, and what to do.

### 10. Consistent terms
One glossary (`config/content/glossary.json`): one name per concept across pages, help and messages.

## Test
Content schema test (keys exist, length limits, no raw route/param patterns); a screen test asserts the page hint, empty state and
field hints render; Help page renders for every registered screen.
