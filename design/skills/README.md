# Front-end skills library

Reusable, app-agnostic Claude skills for building a data/config-driven, mobile-ready, SEO-friendly web app. Copy them into any
repo with `install.sh`, or paste `PROMPT.md` into a session if you prefer a prompt over files.

Default stack: Next.js static export + TypeScript, Capacitor for iOS/Android, S3 + CloudFront hosting. If an app differs, record
the difference in that app's CLAUDE.md and adapt the matching skill.

## Skills
| Skill | Purpose | Read when |
|---|---|---|
| `frontend-standards` | stack, folder layout, definition of done, index | first, always |
| `reuse-before-build` | search for similar code, ask about refactor | before any feature |
| `design-tokens-styling` | one place for fonts, colours, sizes; no inline styles | any styling |
| `config-driven-ui` | layout, fields, labels, order from config files | any screen, field, column |
| `api-data-layer` | adapters, typed errors, shared data states | any backend call |
| `feature-flags` | every feature behind a backend flag | every new feature |
| `component-architecture` | size limits, modular reusable components | any component |
| `state-and-rendering` | state placement, composition, no waterfalls | state, lists, fetching |
| `accessibility-responsive` | semantic HTML, states, keyboard, mobile-first | any UI |
| `performance-budgets` | lazy loading, images, bundle budgets | deps, images, release |
| `error-and-notifications` | success/info/warn/error display + backend contract | any message or failure |
| `input-validation` | validate every trust boundary, prevent XSS | any data entering the app |
| `frontend-security` | tokens, secrets, CSP, third parties | storage, auth, headers |
| `mobile-capacitor` | platform adapters, offline, lifecycle, permissions | device features |
| `seo-static-export` | pre-rendered public pages, S3 + CloudFront | public pages, deploy |
| `testing` | unit + integration + E2E | finishing any work |
| `helpful-hints-and-microcopy` | hints, empty states, per-screen Help | any page or form |
| `i18n-content` | keyed strings, locale formatting | any visible text |
| `observability` | privacy-safe errors, RUM, request correlation | monitoring, debugging |
| `storybook-visual-regression` | stories, a11y and visual gates | shared components |
| `supply-chain-hygiene` | dependency approval, audits, SBOM | any dependency change |
| `git-hooks-and-release` | hooks, PR checklist, store and OTA releases | commits, releases |

## Install into another app
```sh
sh design/skills/install.sh /path/to/other-app            # all skills
sh design/skills/install.sh /path/to/other-app testing feature-flags   # only these
sh design/skills/install.sh /path/to/other-app --force    # overwrite existing skills
```
It copies to `<app>/.claude/skills/`, adds a pointer block to `<app>/CLAUDE.md` if missing, and skips existing skill folders
unless `--force`. Enforcement templates are copied to `<app>/.claude/skills/_templates/` (copy them into the app root as needed).

## Enforcement templates (`_templates/`)
`eslint.config.js`, `.stylelintrc.json`, `jscpd.json`, `size-limit.json`, `jest.config.ts`, `playwright.config.ts`,
`enforcement.test.ts`. Nothing runs until you adopt them; they turn the written rules into failing builds.

## Worked examples in this repo
The POC in `design/` shows the ideas before the port: `theme.css` (tokens, variants, tints), `app.js` (data-driven nav and pages),
`data/docs.js` + `screens/help.js` (per-screen Help from data).

## Adding a skill
Frontmatter `name` + trigger-style `description`; every rule has **Why** and **How to apply**; keep it under ~150 lines; add a
row above and to `frontend-standards`' table.
