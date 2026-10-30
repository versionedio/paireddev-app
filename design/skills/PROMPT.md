# Paste-in prompt: front-end standards

Use this when you want the rules without installing skill files. Paste it at the start of a session or into a CLAUDE.md.
If `.claude/skills/` exists in the repo, read the matching skill for the full rules.

---

You are building a data/config-driven, mobile-ready, SEO-friendly web app. Stack: Next.js static export (`output: 'export'`) + TypeScript,
wrapped by Capacitor, deployed to S3 + CloudFront. No API routes, SSR or middleware.

**Before any feature:** search the codebase for similar or duplicate functionality (components, hooks, adapters, widgets, tokens, helpers).
Report what you found with paths. If something similar exists, STOP and ask whether to reuse, extend, or refactor first; offer the smallest-diff
option and the number of consumers. Never silently duplicate and never refactor unasked. A second copy is a warning, a third is a refactor.

**Rules (each has a reason; apply the reason to cases not listed):**
1. **Styling:** all fonts, colours, sizes, spacing, radii and control heights live in `src/theme/tokens.css`. Components use CSS Modules with
   `var(--token)` only. No inline styles (except setting a CSS variable), no hex/rgb/px literals or font settings outside `theme/`. Never create drift: sizes, weights and colours are a small shared set of roles that elements pick by what they ARE; no per-element tokens or
   one-off overrides. New looks are variants in the theme. Light and dark both complete.
   Web and mobile may look different, but only as different token values per platform/breakpoint, never a second component or stylesheet.
2. **Config-driven:** screens, nav, tabs, columns, fields, labels, order, visibility are JSON in `src/config/`, zod-validated, rendered through a
   widget registry. Typed arrays with a `type` discriminator, never parallel fields. Config binds to view-model paths, not backend fields.
3. **Feature flags:** every new feature ships behind a backend flag, fetched once at startup per user/tenant, read only via `useFlag`/`<Feature>`
   or the `flag` key in config. Safe default on failure; test on and off; remove when rolled out.
4. **Components:** file <= 200 lines, component <= 150, function <= 30, <= 4 params, complexity <= 8. One component per file; logic in hooks/`lib`;
   build from shared primitives; data-driven lookups over growing `if/else`.
5. **State and rendering:** local -> lifted -> context -> store; server data in a query cache; derive, don't store; no fetch waterfalls;
   error and Suspense boundaries; virtualise long lists.
6. **API layer:** backend shape is a contract, not a mirror; adapters map to view models; zod-validate responses; one client, one `AppError`.
7. **Errors and notifications:** severities `success | info | warn | error | critical`; one `notify()`; presentation (toast, inline, banner, panel,
   dialog) comes from `messages.json`; backend errors are `{code, message, details, requestId}`; never show raw server text; show requestId.
8. **Validation and XSS:** validate at every trust boundary (forms, API, URL, deep links, storage, files) with one schema per shape; render text,
   never HTML; no `dangerouslySetInnerHTML`/`eval`; allowlist URLs.
9. **Security:** tokens never in `localStorage` (secure storage on device, memory/httpOnly cookie on web); no secrets in `NEXT_PUBLIC_*`;
   CSP + headers via CloudFront; approve every dependency and third-party script.
10. **Mobile:** window/storage/Capacitor only through `src/platform/` adapters; 44px targets; safe areas; offline states; back button; lazy permissions.
11. **Accessibility and responsive:** semantic HTML, labels, visible hover/focus/active/disabled/loading states defined once, keyboard and focus
    management, AA contrast, mobile-first from 360px, no horizontal page scroll.
12. **Performance:** route splitting, lazy heavy widgets, one `Image` primitive (dimensions, lazy, srcset), budgets (170 kB first-load JS gzip, LCP 2.5 s).
13. **SEO:** public pages pre-rendered with per-route metadata from config, one h1, sitemap/robots at build, `noindex` private routes.
14. **Hints and copy:** every page has a one-line purpose, field hints, empty states with a next action, tooltips on icon-only controls, a per-screen
    Help page (objective, use-case diagram, process flow, rules). Plain brief language, no jargon; all text in content config (`t('key')`).
15. **Tests:** unit (Jest), integration (React Testing Library + msw + jest-axe), and Playwright E2E for each major workflow, desktop and mobile
    viewport. Order: schema -> adapter -> component -> flag -> tests. Bugs get a failing test first.

**Definition of done:** reuse decision recorded; behind a flag (on/off tested); no inline styles or literals; layout/fields/labels in config; loading,
empty, error, offline states; inputs validated; keyboard + 360px checked; tests at all three layers; lint, types, duplicate and size checks pass.

Do not run installs, tests or git commands yourself unless asked; give the commands to run.
