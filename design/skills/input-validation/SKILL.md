---
name: input-validation
description: Use whenever data enters the app from a user, API, URL, storage, file, deep link or message, and whenever rendering user-provided text or links. Requires schema validation at every trust boundary and output that cannot inject HTML or script.
---

# Input validation and sanitization

## Trust boundaries (validate at each)
User input (forms, search, paste) - API responses - URL path, query and hash - deep links and Capacitor intents - local/secure
storage reads - `postMessage` and WebView bridges - imported or uploaded files - third-party widgets.

## Rules

### 1. One schema per shape, at the boundary
Define a zod schema once; the form, the API client and the adapter share it. Parse (not just type-check) data on entry.
**Why:** TypeScript types vanish at runtime. **How to apply:** `schema.safeParse(input)`; on failure produce an `AppError`
(`error-and-notifications`) and never pass unparsed data inward.

### 2. Allowlist, not denylist
Define what is allowed (types, lengths, enums, patterns), reject everything else. Normalise (trim, case) before validating.
**Why:** denylists miss variants. **How to apply:** `z.string().trim().min(6).max(120)`; enums for fixed sets; numbers have ranges.

### 3. Render text as text
React escapes by default; keep it that way. **No `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`, `new Function`,
string-built selectors, or inline event-handler strings.** ESLint bans them.
**Why:** these are the XSS entry points.
**How to apply:** if rich text is unavoidable, use one `SafeHtml` primitive: DOMPurify with a fixed allowlist of tags/attributes,
no `style`, no `on*`, links forced to `rel="noopener noreferrer"`; log and review any addition to the allowlist.

### 4. URLs are validated
Links, redirects, `returnTo` params and image sources pass through `safeUrl()`: allow `https:` (and `mailto:`/`tel:` where needed),
reject `javascript:`, `data:` (except vetted inline images), and unknown origins for redirects (allowlist hosts).
**Why:** open redirects and script URLs are common attack paths.

### 5. Route and query params are input
Parse params with a schema; unknown ids show the not-found state; never interpolate into queries, paths or HTML.

### 6. Files
Check type by content and extension, size limit, count limit, and image dimensions before upload; show the same validation message
format; never render uploaded SVG/HTML inline.

### 7. Storage and bridge reads are untrusted
Anything from storage may be stale, corrupt or tampered: parse with a schema, fall back to defaults, delete on failure.
Validate message origin and shape for `postMessage` and native bridges.

### 8. Client validation is for the user, the server is the authority
Show errors early for usability; the backend re-validates everything. Never rely on hidden fields, disabled buttons or role checks in the UI.

### 9. Form UX
Validate on blur and on submit, not every keystroke; keep entered values on error; focus the first invalid field; messages are
plain and specific (`helpful-hints-and-microcopy`), keyed to content config.

### 10. Don't leak through errors
Validation messages never echo secrets or full server errors; logs redact fields flagged sensitive.

## Test
Property-style cases per schema (empty, too long, wrong type, unicode, script tags); a test that rendering `<img onerror>` text
shows literal text; `safeUrl` table tests; adapter rejects a malformed response with `bad_response`.
