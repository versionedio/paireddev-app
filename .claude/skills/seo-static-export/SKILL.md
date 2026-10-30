---
name: seo-static-export
description: Use when adding or changing public pages, metadata, routing, sitemap, or deployment of the static site to S3 and CloudFront. Keeps public pages crawlable as pre-rendered HTML while private screens stay client-rendered.
---

# SEO with static export (S3 + CloudFront)

Public pages are **pre-rendered to HTML at build time**; private pages (signed-in screens) render on the client and are not indexed.
The same `out/` folder feeds CloudFront and Capacitor.

## Rules

### 1. Static export settings
`next.config`: `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`. No `getServerSideProps`, API routes,
middleware, `revalidate` or request-time cookies/headers.
**Why:** those need a server that S3 does not have. **How to apply:** the build fails if they appear.

### 2. Public content must be in the HTML
Anything a crawler should index (title, headings, body, links) is rendered at build, from config or build-time data. No public
content that appears only after a client fetch. Dynamic public routes list their params with `generateStaticParams`.
**Why:** crawlers and link previews read the first HTML.

### 3. Metadata is config
Each public route has `title`, `description`, `canonical`, Open Graph (`og:title/description/image`), Twitter card and
`lang` in its screen config (`config-driven-ui`), rendered by one `<Seo>`/metadata helper. Titles unique, <= 60 chars;
descriptions <= 160.
**Why:** SEO copy changes should not need a component edit.

### 4. Semantic structure
One `<h1>`, ordered headings, landmarks, descriptive link text, `alt` on images (`accessibility-responsive`), structured data
(JSON-LD) for the entities that matter. Internal links are real `<a href>`.

### 5. Sitemap and robots at build
Generate `sitemap.xml` and `robots.txt` from the public route list in config. Private routes: `noindex, nofollow` meta and
`Disallow`, and they must not be linked from public pages.
**Why:** the list of public routes should have one source.

### 6. Performance is SEO
Core Web Vitals budgets (`performance-budgets`): reserve image space, preload the LCP image and primary font, no render-blocking scripts.

### 7. S3 + CloudFront specifics
- Origin: private S3 bucket with Origin Access Control; no public bucket.
- `trailingSlash: true` produces `route/index.html`; a CloudFront Function rewrites `/route` and `/route/` to `/route/index.html`.
- Custom error response: 403/404 -> `/404.html` with status 404 (real 404s, not soft 404s). Client-only dynamic routes use a fallback shell page.
- Cache: hashed assets `public, max-age=31536000, immutable`; HTML `no-cache` (or short TTL) and invalidate on deploy.
- Response-headers policy carries the security headers (`frontend-security`); enable Brotli/gzip; HTTP/2 and 3.
- One canonical host; redirect `www`/http via CloudFront; HTTPS only.

### 8. Social previews
Provide a 1200x630 OG image per public section; test with link-preview tools.

### 9. i18n
If multilingual: one URL per locale, `hreflang` links, `lang` attribute (`i18n-content`).

### 10. Verify
Build, then `curl` the static HTML (no JS) for title/h1/body; Lighthouse SEO category >= 95 for public routes in CI.

## Test
A scan test: every public route in config has metadata, appears in the sitemap and renders an `<h1>` in `out/`; every private
route has `noindex`.
