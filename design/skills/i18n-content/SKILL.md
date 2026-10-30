---
name: i18n-content
description: Use when adding any user-visible text, date, number, currency or plural, or when preparing the app for more than one language. Keeps all strings in keyed catalogues and formatting locale-aware.
---

# Internationalisation and content

## Rules

### 1. No string literals in components
User-visible text is a key into `src/config/content/<locale>/*.json`; components call `t('backlog.title')`.
**Why:** configurable labels and translation both need keys. **How to apply:** lint rule `no-literal-jsx-text` (allow punctuation/numbers); the content scan fails on missing or unused keys.

### 2. Keys are semantic and namespaced
`<screen>.<element>` or `msg.<code>`; never the English text as the key. **Why:** copy edits must not rename keys.

### 3. Never concatenate sentences
Use whole messages with named placeholders (`"Moved {count, plural, one {# item} other {# items}} to {lane}"`), ICU plural/select.
**Why:** word order and plurals differ by language. **How to apply:** no `a + ' ' + b` for user text; no hard-coded "s".

### 4. Locale-aware formatting
Dates, times, numbers, currency, lists and relative time use `Intl` through one `format` helper that reads the active locale and
timezone; store UTC, display local. **Why:** formats differ and ambiguity causes errors.

### 5. Layout survives expansion
Translations run 30-40% longer: no fixed-width labels, allow wrapping, test with pseudo-locale (`en-XA`).

### 6. Logical CSS properties
`margin-inline-start`, `padding-inline`, `text-align: start`, `inset-inline-*`; flip icons that imply direction. **Why:** RTL support without a rewrite (`design-tokens-styling`).

### 7. Default language and fallback
One default locale; missing keys fall back to it and are reported (`observability`), never shown as raw keys in production.

### 8. Locale selection
From user setting, then device language; persisted via `platform/storage`; `lang`/`dir` set on `<html>`; one URL per locale for public pages (`seo-static-export`).

### 9. Content is reviewed
Copy follows `helpful-hints-and-microcopy`; a glossary keeps terms consistent; translators get context notes in the catalogue.

### 10. Server text
Backend messages are never shown directly; codes map to content keys (`error-and-notifications`).

## Test
Pseudo-locale render without clipping; plural cases (0, 1, 2, many); date/number snapshots for two locales; catalogue parity between locales.
