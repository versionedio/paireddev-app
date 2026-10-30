---
name: config-driven-ui
description: Use when adding or changing a screen, navigation item, tab, table column, form field, widget, label, ordering or visibility. Layout and content are defined in validated config files and rendered through a widget registry, so moving things around never needs component edits.
---

# Config-driven UI

The backend sends data. Config files decide **what appears, where, in what order, with what label, and for whom**.
Moving a column or hiding a field is a JSON edit, not a code change.

## Rules

### 1. Screens are config
Each screen is `src/config/screens/<id>.json`: regions, widgets, order, labels, breakpoints, `flag`, `roles`.
**Why:** layout in JSX needs a developer and a deploy for every move. **How to apply:** a route file only does
`<ConfigScreen id="board" />`. If you reach for JSX to place something, add a config key instead.

### 2. Widgets come from a registry
`src/components/widgetRegistry.ts` maps a config `type` to a component. A widget takes typed props from config plus its data.
**Why:** it makes the set of building blocks finite and reusable. **How to apply:** a new widget is one component + one
registry entry + one schema entry. Reuse an existing widget before adding one (`reuse-before-build`).

### 3. Typed arrays, never parallel fields
Repeated concepts are arrays with a `type` discriminator.
**Why:** `col1_label, col2_label...` fails the third-instance test.
```json
{ "id": "backlog", "regions": [{ "id": "main", "widgets": [
  { "type": "table", "source": "items", "columns": [
    { "field": "title", "label": "content.backlog.title", "width": "fill" },
    { "field": "votes", "label": "content.backlog.votes", "align": "end", "hideBelow": "md" } ] } ] }] }
```

### 4. Config binds to view-model paths, not backend fields
`"field": "item.title"` refers to the adapter's view model (`api-data-layer`).
**Why:** a backend rename must touch one adapter, not every screen.

### 5. Every config file is validated
A zod schema in `src/config/schema.ts` validates all config at build and load; unknown widget types fail.
**Why:** a typo should break the build, not the screen. **How to apply:** the enforcement test loads every JSON and checks
each `type` exists in the registry and each `label` key exists in content.

### 6. Visibility is config: flag, role, breakpoint
Entries carry `flag` (feature flag key), `roles` (who sees it), `hideBelow`/`showBelow` (breakpoint token names).
**Why:** one mechanism for gating beats scattered `if`s. **How to apply:** the renderer filters; components never check
flags or roles themselves. Roles only hide UI; the server enforces access.

### 7. Text is content config
Labels, hints and empty-state copy are keys into `src/config/content/*.json` (`helpful-hints-and-microcopy`, `i18n-content`).
**Why:** copy changes should not need a component change.

### 8. Defaults and escape hatch
A missing optional key has a documented default. A screen that truly cannot be expressed in config registers a custom widget;
it still takes its place and props from config.
**Why:** an escape hatch stops people bypassing the system. **How to apply:** if a second screen needs the same custom
widget, promote it to a general one.

## Checklist for a new screen
Schema entry -> config JSON -> content keys -> data adapter -> flag -> tests (config renders; reorder changes output).
