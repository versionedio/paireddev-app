---
name: performance-budgets
description: Use when adding dependencies, images, fonts, heavy widgets, routes or lists, and before release. Enforces lazy loading, image optimisation and measured bundle budgets so the app stays fast on phones.
---

# Performance budgets

## Budgets (defaults, set per app in `_templates/size-limit.json`)
| Measure | Budget |
|---|---|
| First-load JS per route | <= 170 kB gzip |
| Largest Contentful Paint (mobile, 4G) | <= 2.5 s |
| Cumulative Layout Shift | <= 0.1 |
| Total Blocking Time | <= 200 ms |
| Single image | <= 150 kB, dimensions set |

**Why:** budgets turn "feels slow" into a failing check. **How to apply:** `size-limit` and Lighthouse CI run in CI; a failure
is fixed, not relaxed.

## Rules

### 1. Split by route and lazy-load heavy widgets
Routes are separate chunks. Charts, editors, rich text and diagrams load with `next/dynamic` when first needed.
**How to apply:** the widget registry registers heavy widgets lazily; show a skeleton while loading.

### 2. One `Image` primitive
Static export has no image optimiser, so all images go through `components/ui/Image`: explicit `width`/`height` (prevents layout
shift), `loading="lazy"` below the fold, `decoding="async"`, `srcset`/`sizes`, modern formats (AVIF/WebP) prepared at build.
The hero/LCP image is eager with `fetchpriority="high"`. Raw `<img>` fails the enforcement scan.
**Why:** one place to get this right.

### 3. Fonts
Self-host or preconnect, subset to needed scripts, `font-display: swap`, preload one primary face, at most two families (`design-tokens-styling`).

### 4. Know the cost of a dependency
Before adding a library check its bundle size and tree-shaking (bundlephobia/`size-limit --why`); prefer native APIs and small
libs; import named functions, not whole packages (`lodash-es`, not `lodash`); no date or icon libraries that ship everything.
**Why:** dependencies are the usual cause of bloat. **How to apply:** ask before adding one (`supply-chain-hygiene`).

### 5. Render cheaply
Virtualise long lists, avoid re-render storms (`state-and-rendering`), animate `transform`/`opacity` only, debounce
search/typeahead, move heavy computation to a worker or the server.

### 6. Network
Compress (Brotli) at CloudFront; hashed asset filenames with `Cache-Control: public, max-age=31536000, immutable`; HTML
`no-cache` or short; prefetch the next likely route; cache API reads in the query cache; paginate.
**Why:** repeat visits and app relaunches should hit cache.

### 7. Measure on real conditions
Test on a mid-range phone profile with throttled network; track Web Vitals via `observability`.

### 8. No layout shift
Reserve space for async content (skeletons with fixed dimensions), set image sizes, avoid inserting banners above content.

## Before release
`npm run size`, Lighthouse CI report attached to the PR, bundle analyzer diff for any new dependency.
