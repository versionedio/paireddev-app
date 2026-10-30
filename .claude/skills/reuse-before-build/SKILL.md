---
name: reuse-before-build
description: Use before implementing ANY feature, component, hook, helper, style or config. Requires searching the codebase for similar or duplicate functionality, reporting it, and asking the user about a refactor before writing new code.
---

# Reuse before build

## Rules

### 1. Search first, every time
Before writing code, look for what already exists: components, hooks, adapters, config widgets, tokens, `lib` helpers, tests.
**Why:** most duplication is not copy-paste, it is two people solving the same problem under different names.
**How to apply:**
- Grep and glob for the feature's nouns and verbs, its props, and its markup shape (for example a table with sortable
  headers, a modal with a footer, a form field with a hint).
- Check `src/components/ui/`, `src/config/` widget registry, `src/lib/`, `src/theme/tokens.css`, and the component catalogue
  (`storybook-visual-regression`) if present.
- Also check config: the thing you need may be a new entry in an existing screen config, not a new component.

### 2. Report before you build
Tell the user what you found, with file paths, before writing code.
**Why:** the user can see the whole codebase's intent; you only see what you searched.
**How to apply:** one short message: "Found X in `path` (used by N screens), similar to what you asked for. Y differs in Z."
If nothing similar exists, say so in one line and continue.

### 3. If similar or duplicate code exists, stop and ask
Do not decide silently between duplicating and refactoring.
**Why:** duplicating creates drift; refactoring unasked expands the change and risks other consumers.
**How to apply:** ask, with options, and recommend one:
- **Reuse as is** (config or props already cover it).
- **Extend** the existing piece (smallest diff; say how many consumers it has).
- **Extract** a shared piece first, then build on it (state the files that change).
- **Build separately** (only if the user confirms the two are genuinely different, record why in the PR).

### 4. Never refactor without approval
Refactors that touch other features are proposed, sized (files, consumers, tests affected) and approved first.
**Why:** surprise refactors make reviews unreadable and break unrelated screens.

### 5. Third-instance test
A second copy is a warning, a third is a refactor.
**Why:** two copies hide the real shape; the third shows it, and by then changing it is expensive.
**How to apply:** when about to create a third similar thing, propose the shared abstraction as part of the task.

### 6. Say what you reused
End the task by listing what was reused or extracted. **Why:** it keeps the catalogue honest and teaches the next change.

## Enforcement
`jscpd` runs in CI (`_templates/jscpd.json`: minimum 6 lines or 60 tokens, fail above 3% duplication in `src/`).
A failing duplicate check means: stop and apply rule 3, do not raise the threshold.
