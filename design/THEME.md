# Changing how PairedDev looks

Everything visual is in **`theme.css`**. Section 1 (the `:root` block at the top) holds every value; the rest of the file only
uses them through `var(--name)`. Edit a value there, then hard-refresh the page (Cmd+Shift+R) because the browser caches the CSS.

## Fonts
| Change | Token |
|---|---|
| UI font | `--font-ui` (also add it to the Google Fonts link in `index.html`) |
| Code/label font | `--font-mono` |

## Text sizes
These seven roles are the only text sizes in the app.

| Token | Default | Used for |
|---|---|---|
| `--fs-2xs` | 11px | label: small mono labels, badges, nav captions |
| `--fs-xs` | 12px | caption: captions, chips, meta |
| `--fs-sm` | 13px | secondary: supporting text, descriptions, card titles |
| `--fs-md` | 15px | body: body text, request titles |
| `--fs-lg` | 17px | title: drawer and panel titles |
| `--fs-xl` | 22px | heading: section titles |
| `--fs-2xl` | 30px | display: page titles |

**There is no per-element size, by design.** An element takes the text role it *is* (a title, secondary text, a caption), never
a size chosen for how it should look. That is what keeps the app consistent: a new kind of text must pick an existing role. To
make all descriptions bigger, change the role they use (`--fs-sm`), and every description changes together. If a role truly is
missing, add one for the whole app and write it in the table above; do not add `--fs-<element>` tokens, inline sizes or literals.

Colours follow the same rule: text uses `--t1` (titles) to `--t5` (disabled), and status/brand colours come from the tokens below.
Never a colour for one element.

Run `node design/check-theme.mjs` after styling changes. It fails on font sizes or colours outside the roles and on per-element tokens.

## Web vs mobile
They may look different, but never as a copy. Same roles and components; only token **values** differ per platform, set in one place
in `theme.css` (see how `@media (pointer: coarse)` already enlarges `--h-sm/md/lg` on touch screens). To make text or spacing larger
on phones, override the role or spacing token under that condition. Do not write a second stylesheet or a mobile copy of a component.

## Colours (each has a light and a dark value)
| Token | Used for |
|---|---|
| `--primary`, `--primary-t`, `--primary-soft`, `--primary-line` | brand orange: buttons, active nav, human badges |
| `--agent`, `--agent-t`, `--agent-dim` | Claude / agent violet |
| `--t1` to `--t5` | text, from strongest to faintest |
| `--bg`, `--panel`, `--card`, `--raised`, `--sunken`, `--hover` | backgrounds, from the page to raised surfaces |
| `--line` to `--line-4` | borders, from faintest to strongest |
| `--green`, `--red`, `--warn`, `--info`, `--teal` | status colours (tints derive from them) |

## Spacing, shape, controls
| Token | Controls |
|---|---|
| `--sp-1` to `--sp-8` | spacing steps (4px to 48px) |
| `--r-xs` to `--r-xl`, `--r-pill` | corner radius |
| `--h-sm`, `--h-md`, `--h-lg` | height of every button, input, chip and tab (larger on touch screens automatically) |
| `--card-pad` | board card padding; `data-density="compact"` (set in `config.js`) shrinks it |

## Buttons and badges
Looks are classes in section 3 and 4 of `theme.css`: `.btn--primary`, `.btn--ghost`, `.btn--agent`, `.btn--success`, `.btn--warn`,
`.btn--danger-ghost`; badges and pills take a tone (`.tone-primary`, `.tone-agent`, `.tone-neutral`...). A new colour for a badge
is one `.tone-*` line.

## Rules
- Do not put `font-size`, colours or pixel sizes in a screen's JS or as `style=`. Add or change a token instead.
- Check both themes (the sun/moon button) after changing a colour.
- Product behaviour switches (density, AI score on cards) are in `config.js`, not here.
