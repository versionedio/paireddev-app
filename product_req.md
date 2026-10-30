# Handoff: PairedDev — AI-native SDLC board

## Overview

PairedDev is an AI-native SDLC board that sits between product feedback and shipped code. A single
backlog flows through five lanes (Intake → Triage → In Progress → Review → Done/Deployed) and every
card can be worked by a human, by Claude, or by both in sequence.

Three actor types touch the board and the UI visibly distinguishes them:


1. **Requesters** (clients / app users) — submit issues and feature requests, vote on open items
2. **Product owner / devs** — own items, prioritize, assign, approve phase transitions
3. **AI agents** (Claude / Claude Code) — pick up assigned work, post status, request review, flag
   merge conflicts, run through review checklists

Every project has a **cadence**: Flow (continuous, the default) or Sprint (1/2/3/4-week). Cadence is
not cosmetic — it changes which screens exist. In Sprint mode a Sprints tab appears and Analytics
shows burndown and velocity; in Flow mode the Sprints tab is hidden entirely and Analytics shows
cumulative flow, cycle time, throughput, and aging instead.

Work is organised along two axes that must not be merged:

* A **Group** is a standing, broad container of *projects* ("Platform" = API Studio + JS SDK). Scoping
  the app to a Group filters Portal, Backlog, Board, and Analytics to every project in it.
* A **Delivery** is a specific, changing, release-scoped set of *items* — which may come from any
  project, not necessarily one Group. It has a mode: **Gated** (ships together, one combined release
  gate) or **Rollup** (ships independently, visibility only).

Ownership and work are separate concepts. Every card has one **owner** (always a human, accountable
for the outcome) and zero or more **workers** (humans, Claude, or both, doing the work right now).
The board shows both.

The backend is assumed to be [nostack.ai](http://nostack.ai) (a browser-based, agentic API management studio exposing
REST + MCP). Every data operation in the prototype is mock data, but the UI is structured as though
real nostack.ai-generated endpoints back it (see **Data / endpoint surface** below).

## Business requirements


 1. **Single system of record** for requests, prioritisation, planning, agent execution, review, and release — human and agent work on the same cards.
 2. **Plan before execute.** An agent writes nothing until a human approves a Plan Preview (files, order, risks). Approve or send back with notes are the only exits.
 3. **Supervised execution.** Agent sessions stream step by step. A hook set to `ask` halts the session until a human approves or denies inline.
 4. **Humans own outcomes.** Every card has one human owner; agents can be workers, never owners. Agents cannot sign off checklist items or approve releases — enforce server-side, not in the UI.
 5. **Gates at three levels.** Card checklist sign-off before a lane advance; release pre-flight before promotion; cross-project pre-flight for Gated deliveries.
 6. **Configurable agent behaviour per project** — [CLAUDE.md](http://CLAUDE.md) (committed to the repo), Skills, and Hooks. Org-managed hooks cannot be widened by a project.
 7. **Bring your own model.** Org connects Anthropic (optionally via Bedrock / Vertex / Foundry) or Google; each project picks its execution provider. Keys are write-only.
 8. **Source control via a [nostack.ai](http://nostack.ai) connector.** All git operations on the Work tab call the GitHub connector (section 14); inbound webhooks keep cards in step with the repo.
 9. **Cadence-aware.** Flow or Sprint per project changes which screens and metrics exist.
10. **Append-only audit.** Every state transition, human or agent, is recorded and attributable.
11. **Scale.** Backlog designed for hundreds of items with server-side filtering, pagination, and totals.

## About the Design Files

The file in this bundle is a **design reference created in HTML** — a prototype showing intended look
and behavior, not production code to copy directly. The task is to **recreate this design in the
target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established
patterns, component library, and state conventions. If no environment exists yet, choose the most
appropriate framework for the project and implement the design there.

Specifically: do not port the prototype's inline-style strings or its single-class architecture. Those
are artifacts of the prototyping environment. Port the *design* — the layout, tokens, states, and
interaction model documented below.

## What is real and what is seeded

Interactive and stateful: all navigation, scope switching, voting, drag-and-drop, the card drawer,
checklist sign-off and its gate, cadence switching, sprint create/close, the range picker, retro
digest, both pre-flight passes, invites, permission and notification toggles, group and delivery
creation, and the entire Backlog screen (search, filters, sort, pagination, selection, bulk actions).

Still seeded rather than live: the audit log does not append as you act on cards; the 90-day metrics
series is generated, not derived from item history; and drag-and-drop has no drop-position ordering
(a dropped card lands in the column sorted by score).

## Fidelity

**High-fidelity.** Final colors, typography, spacing, and interactions. All ten screens are
interactive: navigation, voting, drag-and-drop, the triage run, the card drawer, checklist sign-off,
the theme toggle, and the submit modal all work. The developer should recreate the UI faithfully using
the codebase's existing libraries and patterns.

Two areas are deliberately shallow and need real implementations:

* The audit log is a static seed array; it does not append as you act on cards.
* Drag-and-drop uses the native HTML5 drag API with no drop-position ordering (a card dropped in a
  column lands in that column, sorted by priority score, not at the cursor position).


---

## Screens / Views

Shared chrome on every screen: a 50px sticky header, then a single scrolling main region.

### Header (shared)

* Height 50px, `flex:none`, sticky top, z-index 40. Background `--s2`, 1px bottom border `--line`,
  padding `0 14px`, `gap:14px`, `overflow:hidden`.
* Children left to right: logo lockup (19px rounded-5px `--blue` square with a mono "P", then
  "PairedDev" at 14px/600), nav, flexible spacer, API status, theme toggle, role switcher, identity avatar.
* **Flex behavior matters.** The header's contents exceed narrow viewports. The nav is
  `flex:0 1 auto; min-width:0; overflow:hidden` and the API status div is `flex:0 100 auto; min-width:0; overflow:hidden`, so the status label absorbs the squeeze first and the nav truncates
  second. Everything to the right of the spacer must never be the element that loses.
* **Nav**: eight or nine pills — Portal, Backlog, Triage, Board, \[Sprints\], Deliveries, Analytics,
  Activity, Releases — each 29px tall, `0 11px`, radius 6,
  12\.5px/500, with a mono count badge (9.5px, radius 3, bg `--line2`, color `--t3`). Active pill:
  bg `--s4`, color `--t1`. Inactive: transparent, color `--t3`, hover bg `--s4`.
  Counts are live but only where a count means something, and every one of them respects the current
  scope: backlog = backlog items in scope, board = items not in Backlog or Done, deliveries = delivery
  count, releases = staged items. Portal, Triage, Analytics, and Activity carry no badge (their count
  style is `display:none`) — the nav is wide enough already.
  **Sprints only exists when cadence is Sprint.** Switching back to Flow while on that tab redirects
  to Board.
* **Group switcher**: immediately right of the nav — a 29px button (1px `--line2`, radius 6,
  `white-space:nowrap`) showing a 7px `--purple` square, the current scope name, and a ▾. It opens a
  272px popover at `top:56px; left:14px` (same construction as Project settings: rendered outside the
  `overflow:hidden` header, z 45 over a z-44 dismiss layer, `itr-in` 0.16s) with three labelled
  sections: **Scope** — "All projects" (default, "no group filter"); **Groups** — each with a
  `--purple` square and "N projects"; **Projects** — each with its own project chip. The selected row
  takes `--blue-soft` / `--blue-t`.
  Selecting a scope filters Portal, Backlog, Board, Triage, and Analytics, and updates every nav count.
  When the scope spans more than one project (All projects, or any Group), board cards and backlog rows
  show a **project chip**; scoped to a single project the chips disappear, because then they say nothing.
* **API status**: a 6px pulsing `--green` dot (`itr-pulse` 2.4s), `flex:none`, with the endpoint host
  on a `title` attribute. The label text was removed: seven nav pills plus the settings control do not
  leave room for it, and the dot alone carries the signal.
* **Theme toggle**: 28×26 button, 1px `--line2`, radius 6, transparent, showing ☀ in dark mode and
  ☾ in light mode. Persists to `localStorage['itr-theme']`.
* **Project settings**: a 28×26 gear button (same shell as the theme toggle; when open it takes bg
  `--s4`, border `--line3`, color `--t1`). It opens a popover — **rendered outside the header**, since
  the header is `overflow:hidden` — at `position:fixed; top:56px; right:14px`, width 300, 1px
  `--line2`, radius 9, bg `--s3`, `box-shadow:0 20px 50px var(--shadow)`, `itr-in` 0.16s, z 45, over a
  transparent full-screen dismiss layer at z 44. The header sits at **z 46** so its buttons stay
  clickable while the popover is open, and any nav click closes it.
  The popover holds six things: **Cadence** (segmented, wrapping: Flow / 1w / 2w / 3w / 4w, with a
  sentence under it explaining what the choice changes), **Viewing as** (segmented: Requester / Owner /
  Agent — this is where the old header role switcher now lives),
  **Execution provider** (a native select of org-connected providers, non-connected options disabled,
  with a sentence naming what Plan Preview and Live Session will run against — placed quietly under
  Cadence, not promoted), then three links: **Agent configuration — [CLAUDE.md](http://CLAUDE.md), skills, hooks →**,
  **Team, permissions & notifications →**, **AI providers (org) →**, plus
  **Groups & project membership →**.
* **Viewing as** changes the identity avatar (Requester → Lena Kovač, Owner → Maya Okonkwo,
  Agent → Claude). In the prototype it does not yet gate permissions — in production, Requester should
  see only the portal, and Agent should be read-only on human sign-off.
* **Identity avatar**: 22px circle, left-padded and separated by a 1px `--line` left border.


---

### 1. Public Feedback Portal

**Purpose**: requesters submit and vote on requests; anyone can see status.

**Layout**: `padding:26px 30px 60px`, inner `max-width:1180px` centered.

* Header row: eyebrow ("PUBLIC FEEDBACK PORTAL", 10.5px mono, uppercase, `letter-spacing:0.09em`,
  `--t4`), h1 "What should we build next?" (25px/600, `letter-spacing:-0.02em`), lede (`--t3`,
  `max-width:520px`, `text-wrap:pretty`). Right-aligned primary button "Submit new request"
  (34px, `0 15px`, radius 6, bg `--blue`, color `--on-blue`, 12.5px/600; hover `--blue-h`).
* Filter bar: 1px `--line` border, radius 7, bg `--s2`, `padding:9px 12px`, wrapping flex row.
  Contains a mono "SORT" label, three sort chips, a 1px vertical divider, a mono "STATUS" label, five
  status chips, and a right-aligned mono count ("N of M requests").
  * Chip: 26px tall, `0 11px`, radius 6, 11.5px/500. Off: 1px `--line2`, transparent, `--t3`.
    On: 1px `--blue-line`, bg `--blue-soft`, color `--blue-t`.
  * Sorts: Most voted (default) · Newest · My submissions (filters to `lena@northwind.io`).
  * Statuses: All · Under Review · Planned · In Progress · Shipped.
* Card grid: `repeat(auto-fill, minmax(340px, 1fr))`, `gap:12px`. Each card animates in with
  `itr-in` 0.3s.

**Card**: flex row, `gap:14px`, `padding:14px`, 1px `--line`, radius 8, bg `--s3`; hover border `--line4`.

* **Vote button** (left, `flex:none`, 44px wide): column, centered, `padding:8px 0`, radius 7, mono.
  A 9px ▲ over the count at 13px/600. Off: 1px `--line2`, bg `--s3`, color `--t3`. Voted: 1px
  `--blue-line`, bg `--blue-soft`, color `--blue-t`. On click the count animates with
  `itr-bump` (0.42s: translateY(-5px) scale(1.14) at 40%).
* **Body**: status badge + mono item id; title 13.5px/600 `line-height:1.35`; description 12px/1.5
  `--t3` `text-wrap:pretty`; footer row of tag chips with the submitter email right-aligned (10px mono `--t5`).
* **Status badge**: 9.5px mono, uppercase, `letter-spacing:0.03em`, `padding:2px 7px`, radius 4;
  color C, bg `color-mix(in oklch, C 12%, transparent)`, border `color-mix(in oklch, C 28%, transparent)`.
  Derived from the item's lane:
  `done → Shipped (--green)` · `backlog → Under Review (--t3)` · `assigned → Planned (--blue)` ·
  everything else `→ In Progress (--ai)`.
* **Tag chip**: 9.5px mono, `padding:1.5px 6px`, radius 4, same 12%/30% color-mix treatment. Tag colors:
  `high-impact → --warn`, `agent-owned → --ai`, `regression-risk → --red`, `quick-win → --green`,
  everything else `--t3`.

**Submit modal**: scrim `--scrim` (fixed inset 0, z 60) + panel (fixed, `top:9vh`, centered via
`left:50%; translateX(-50%)`, width 540 / `max-width:94vw`, z 61, 1px `--line2`, radius 10, bg `--s3`,
`box-shadow:0 30px 70px var(--shadow)`, `itr-in` 0.2s).

* Head: "Submit a request" 15px/600 + ✕ close (26×26, 1px `--line2`, radius 6).
* Body `padding:18px`, `gap:14px`: Title input (34px, 1px `--line2`, radius 6, bg `--s1`, 12.5px);
  Description textarea (4 rows, same treatment, `resize:vertical`); Category segmented control
  (Bug / Feature / Performance / Docs, default Feature); Screenshot dropzone (56px, 1px dashed
  `--line2`, radius 7, bg `--s1`, 11px mono, "Attach a screenshot"). Clicking the dropzone simulates
  an attachment: it flips to "✓ safari-oauth-blank.png · 284 KB" with 1px dashed `--green-line`,
  bg `--green-soft`, color `--green-t`.
* Each field label: 9.5px mono, uppercase, `letter-spacing:0.08em`, `--t4`, 6px below.
* Foot: mono "POST /v1/requests" hint, Cancel (ghost), Submit request (primary blue).
* **Validation**: title must be ≥6 non-whitespace characters, else an 11px `--red` message appears
  under the field ("Give it at least a few words so we can route it."). Error clears on keystroke.
* **On submit**: a new item is prepended (id `ITR-2NN` random, votes 1, already voted, lane
  `backlog`, bucket `backlog`, impact 5, effort 4, no AI tags), the modal closes, and the sort
  switches to Newest so the user sees their submission at the top.


---

### 2. Triage / Prioritization Board

**Purpose**: product owner (with Claude) scores, labels, and slots the intake queue.

**Layout**: `padding:22px 24px 60px`. Header row: eyebrow + h1 "Score, label, and slot the queue";
right side holds a mono note and the triage button.

* **Note** (10.5px mono): "N items have no AI labels" in `--warn-dim` while any item is unlabelled,
  "All items labelled" in `--t4` once done, and "POST /v1/triage/run" while running.
* **"Ask Claude to triage" button**: `inline-flex`, `flex:none`, `white-space:nowrap`, 32px,
  `0 13px`, radius 6, 12px/600, 1px `color-mix(--ai 50%)`, bg `color-mix(--ai 16%)`, color `--ai-t`.
  Running: bg drops to 10% mix, label becomes "Claude is triaging…", and an 11px spinner
  (1.5px border, `--ai` top edge, `itr-spin` 0.7s) replaces the ✦ glyph. After 1900ms every item
  without tags gets AI tags and the label becomes "Re-run triage".
* **Three columns**: `grid-template-columns:repeat(3,1fr)`, `gap:12px`, `align-items:start`.
  Backlog ("later maybe") · Next ("this sprint") · Later ("parked"). Column shell: radius 9, bg
  `--s2`, 1px `--line` — turning `--blue-line2` while a card is dragged over it. Head:
  `padding:11px 12px`, 1px bottom `--line`, 7px radius-2 hue dot, 12px/600 label, mono count,
  right-aligned mono hint. Body: `padding:10px`, `gap:8px`, `min-height:180px`.
* Only `lane === 'backlog'` items appear here, sorted by composite score descending.

**Triage card**: `padding:11px`, radius 7, bg `--s3`, 1px `--line2`, `cursor:grab`. While dragging:
border `--blue-line2`, `opacity:0.5`.

* Left: mono id (10px `--t5`), title 12.5px/500.
* Right: **score chip** — 38px wide, `padding:5px 0`, radius 6, column-centered. Score ≥70:
  bg `color-mix(--ai 14%)`, 1px `color-mix(--ai 40%)`, color `--ai-t`. Below 70: bg `--s4`,
  1px `--line2`, color `--t2`. Number 13px/600 mono over an 8.5px mono "AI" caption.
* Footer: mono ▲ vote count, then AI tag chips.

**Score breakdown tooltip** (`cursor:help`, shown on hover of the score chip): absolutely positioned
`top:calc(100% + 7px); right:0`, width 212, `padding:11px`, 1px `--line3`, radius 7, bg `--s3h`,
`box-shadow:0 12px 30px var(--shadow)`, z 30. Title "SCORE BREAKDOWN" in 9.5px mono `--ai-t`.
Three labelled rows (label `--t3` / value mono `--t1`) each over a 3px progress bar (track
`--line2`; fills `--blue`, `--ai`, `--green` respectively), then a divider and "Composite N / 100".

**Composite score formula** (0–93 in practice, presented out of 100):

```
votesTerm  = round(min(votes, 220) / 220 * 45)   // max 45
impactTerm = round(impact / 10 * 32)             // max 32, AI-assessed 1–10
effortTerm = round((11 - effort) / 10 * 16)      // max 16, AI review effort 1–10, inverted
score      = votesTerm + impactTerm + effortTerm
```

Tooltip rows read "Votes (142) +29", "AI impact (9/10) +29", "AI review effort (3/10) +13". Under the
composite total the tooltip closes with a reasoning note in the same treatment as the checklist
tooltips (2px left border `--ai`, 8% amber fill, 10.5px `--ai-dim`):

> Review effort is my estimate of the human verification burden once the work is done — diff size,
> blast radius, and how much of it a person has to read to sign off. It is not how long I take to
> build it.

That distinction matters: the third term of the score is about **how expensive this is for a human to
check**, not about agent build time. Keep the wording if you keep the score.

**AI labelling rule** (what the triage pass computes): tags = `[category.toLowerCase()]`, plus
`high-impact` if impact ≥8, `quick-win` if effort ≤3, `agent-owned` if assignee is Claude,
`regression-risk` if it is a Bug with impact ≥8 — capped at the first 3.

**Drag and drop**: native HTML5. `draggable="true"` on the card, `onDragStart` sets the dragged id,
`onDragEnd` clears it, the column handles `onDragOver` (preventDefault + highlight), `onDragLeave`
(clear highlight) and `onDrop` (reassign the item's bucket).


---

### 3. Iteration Kanban Board (core screen)

**Purpose**: the working board. Most design effort lives here.

**Layout**: a `flex:none` toolbar over a scrolling board region.

* **Toolbar**: `padding:12px 18px`, 1px bottom `--line`. "Iteration board" 15px/600, mono
  "sprint 24 · N items", spacer, then a three-item legend: Human action (blue "MO" chip),
  Claude action (amber ✦ chip), Needs escalation (red "!" chip). Legend chip: 16px circle, 8.5px mono,
  12%/34% color-mix of its accent.
* **Board region**: `overflow:auto`, `padding:14px`, inner flex row `gap:11px`, `min-width:1500px`
  (so it scrolls horizontally rather than crushing columns).
* **Seven columns**, `flex:1`, `min-width:246px`, radius 9, bg `--s2` (a step darker/lighter than
  cards), 1px `--line` → `--blue-line2` on drag-over:
  Backlog · Assigned · In Progress · Code Review · Integration Testing · **Staged** · Done.
  The board track is `min-width:1740px` and scrolls horizontally.
  Column head is `position:sticky; top:0` with bg `--s2` and a 1px bottom `--line`: 7px radius-2
  hue dot, 11.5px/600 label, mono count, right-aligned WIP hint. Hue per column:
  `backlog 265/0.004`, `assigned 250/0.05`, `inprogress 62/0.09`, `review 300/0.06`,
  `testing 200/0.06`, `staged 225/0.028`, `done 152/0.08` (dot lightness 0.62 dark / 0.56 light).
  **Staged** is the "finished but deliberately held" column: a muted slate-teal, deliberately quiet
  next to the amber of agent-active states and the green of Done. Cards landing there take the pill
  "Staged · held for release" with a new pill kind `hold` (accent `--teal`, no pulse — nothing is
  happening, which is the point), and the column carries a `held` WIP hint.
  WIP hints: Assigned "4 max", In Progress "3 max"; the hint turns `--red` when the column holds
  more than 3 cards. Body `padding:9px`, `gap:8px`, `min-height:220px`. Cards sort by score desc.

**Board card**: `padding:11px` (9px in compact density), radius 7, bg `--s3`, 1px `--line2`,
`cursor:pointer`; hover border `--line4`; dragging → border `--blue-line2`, `opacity:0.45`.
Blocked cards carry a 1px `color-mix(--red 50%)` border instead.

* **Conflict banner** (blocked cards only): a full-bleed strip pulled out with
  `margin:-11px -11px 9px`, `padding:6px 11px`, radius `7px 7px 0 0`, bg `color-mix(--red 16%)`,
  1px bottom `color-mix(--red 40%)`. Mono "!" + "Merge conflict · needs human" at 10.5px/600 `--red-t`.
* Row 1: mono id, an "✦ agent" badge when Claude is the assignee (9.5px mono, radius 4,
  `color-mix(--ai 14%)` bg, `color-mix(--ai 35%)` border, `--ai-t`), spacer, score pill (9.5px mono,
  `padding:1px 5px`, radius 4, bg `--s4`; color `--ai-t` at ≥70 else `--t3`). Hidden when the
  `showAiScore` flag is off.
* Title 12.5px/500 `line-height:1.4`.
* **Live status pill**: `inline-flex`, `gap:6px`, 10.5px/500, `padding:3px 8px`, radius 5, with a
  5px leading dot; color/bg/border are the 11%/28% color-mix of the kind's accent:
  `ai → --ai` · `block → --red` · `wait → --purple` · `ok → --green` · `idle → --t3`.
  The `ai` and `block` dots animate with `itr-pulse` 1.6s. Real pill copy in the seed data:
  "Claude: coding", "Claude: writing tests", "Claude: awaiting sign-off", "Claude: queued",
  "Claude: review requested", "Blocked: merge conflict detected", "Waiting for review",
  "Integration tests running", "Ready to start", "In progress", "Deployed to production",
  "Deployed to staging", "Unassigned".
* Footer, above a 1px `--line` top rule: the **owner avatar** (22px, always a human), then an
  **overlapping worker stack** — up to 3 badges at 19px, each `margin-left:-5px` after the first with
  `box-shadow:0 0 0 2px var(--s3)` to cut the overlap, showing human initials or the ✦ Claude glyph
  (Claude's badge keeps the amber treatment: bg `color-mix(--ai 22%, --s3)`, border
  `color-mix(--ai 60%)`, color `--ai-t`). Then branch name (9.5px mono `--blue-dim`,
  `max-width:118px` with ellipsis; "no branch" in `--t5` when absent), spacer, checklist progress
  ("2/4 ✓", mono 9.5px, `--green` when complete else `--t4`, hidden when the agent has not pre-checked).
* **Avatars**: 22px circle. Humans: bg `oklch(0.34 0.06 H)` / text `oklch(0.92 0.04 H)` in dark,
  bg `oklch(0.90 0.045 H)` / text `oklch(0.38 0.10 H)` in light, initials 9.5px/600 mono. Per-person
  hue: Maya 250, Devin 196, Sana 320, Tom 150. **Claude**: a ✦ glyph, bg `color-mix(--ai 16%)`,
  1px `color-mix(--ai 55%)`, color `--ai-t` — this is the AI signature and must stay distinct.
  Unassigned: 1px dashed `--line3` with an em dash.
* Cards drag between all six columns (same native DnD contract as triage). Dropping into Done also
  rewrites the pill to "Deployed to staging" / kind `ok`; dropping into Backlog resets it to "Unassigned".

**Detail drawer** — opens on card click. Scrim `--scrim` (z 50) + panel: `position:fixed`,
`top/right/bottom:0`, width 560 / `max-width:94vw`, z 51, bg `--s2`, 1px left `--line2`,
`box-shadow:-24px 0 60px var(--shadow)`, `itr-drawer` 0.22s (translateX 28px + fade).

* **Head** (`padding:16px 18px`, 1px bottom `--line`): mono id, lane badge (9.5px mono, uppercase,
  the lane's own hue at L 0.72 dark / 0.46 light, 13% bg, 32% border, `white-space:nowrap`), spacer,
  ✕ close. Title 17px/600 `letter-spacing:-0.015em`. Then a 3-column meta grid — **Owner**
  (avatar + name, ellipsised), Branch (11px mono `--blue-dim`, ellipsised), Priority ("74" 14px
  mono/600 + "/ 100 · ▲142" in 10px mono `--t5`) — and below the grid, a full-width **Workers** row:
  a wrapping row of pill chips, each `padding:3px 8px 3px 4px`, `border-radius:20px`, 11.5px, a 17px
  avatar inside, reading "Claude · coding", "Devin Reyes · pairing", "Sana Iqbal · shipped". Chip
  colour follows the actor: `--ai-t` for Claude on a 10%/26% amber tint, `--blue-t` for humans on the
  equivalent blue. Each meta cell carries a 9.5px mono uppercase `--t4` label.
  Owner and Workers are deliberately different people in the seed data — the split only reads as
  meaningful when they differ.
* **Tabs** (`padding:8px 14px 0`, 1px bottom `--line`): Detail · **Work** · Activity · Review. 32px tall,
  `0 12px`, 12.5px/500, 2px bottom border `--blue` when active (else transparent), color `--t1`
  active / `--t3` idle. Activity carries an event-count badge, Review carries "2/4", and Work carries a state glyph
  (empty when idle, "1" when a plan is waiting, "●" while a session runs, "!" when paused on a gate,
  "✓" when complete).
* Content region scrolls, `padding:18px`.

**Detail tab**: "DESCRIPTION" label + 12.5px/1.6 `--t2` paragraph. "ACCEPTANCE CRITERIA" label +
a stack of rows (`padding:9px 11px`, 1px `--line`, radius 6, bg `--s3`) each with a zero-padded
mono index ("01") and the criterion. "ORIGIN" label + a row showing a 24px `--purple-soft` initial
circle, the submitter email, "Submitted via public portal · N days ago", and the vote count.

**Activity tab**: a "Dev ↔ Claude" feed. Each entry is a flex row: a 24px rail column holding a
22px actor chip (✦ for Claude, ○ for system, initials for humans; 13%/32% color-mix of the actor's
accent — `--ai-t` for Claude, `--blue-t` for humans, `--t3` for system) with a 1px `--line`
connector line beneath (hidden on the last entry); then actor name 12px/600 in the actor's color,
a 10px mono timestamp, and the body at 12px/1.55 `--t2`. Entries may carry a `<pre>` block:
`padding:10px 11px`, 1px `--line`, radius 6, bg `--s1`, 10.5px/1.65 mono `--t2`,
`white-space:pre`, `overflow-x:auto` — used for diffstats and conflict hunks.

* Below the feed: a prompt composer — input (34px, bg `--s1`, 1px `--line2`, radius 6,
  "Send a prompt to Claude on this card…") + amber "✦ Send" button. Sending appends the human entry
  immediately and a Claude acknowledgement 900ms later.
* **Escalation panel** (blocked cards only, above the feed): `padding:13px`, radius 8,
  1px `color-mix(--red 45%)`, bg `color-mix(--red 10%)`. Mono "!" + "Claude escalated this to a human"
  12px/600 `--red-t`, then Claude's plain-language explanation at 12px/1.55 `--red-dim` with inline
  mono spans for paths, then two buttons:
  * **"✦ Rebase with Claude"** (solid `--ai`, `--on-ai` text): sets the pill to
    "Claude: rebasing onto main" (kind `ai`) and appends two feed entries — Maya's decision about
    which backoff wins, then Claude confirming the rebase.
  * **"I'll handle it locally"** (ghost, 1px `--line3`): reassigns the card to Devin, sets the pill
    to "Devin: resolving conflict locally" (kind `idle`), and appends Devin's note.

**Review tab**: "REVIEW CHECKLIST" label with a right-aligned mono "✦ Claude pre-checked 4 of 4"
(or "No agent pre-check yet") in `--ai-t`.

* Four rows (`padding:11px`, radius 7, bg `--s3`, 1px `--line` → 1px `--green-line` once signed):
  Tests pass · Docs updated · No secrets committed · Style guide followed.
* Each row: an 18px AI box (radius 4, mono ✦, `color-mix(--ai 16%)` bg, `color-mix(--ai 55%)`
  border, `--ai-t`) — empty with a 1px `--line2` border when the agent has not checked it; the label
  at 12.5px/500; a sub-line at 10.5px reading "Pre-checked by Claude · hover for reasoning" in
  `--ai-dim` (or "Not yet checked by the agent" in `--t5`); and a **human sign-off toggle** on the
  right (26px, `0 9px`, radius 6, a 13px check box + label; off: 1px `--line2` / `--t3` / "Sign off",
  on: 1px `--green-line`, bg `--green-soft`, color `--green-t`, "✓ Signed").
* **Hovering a pre-checked row** reveals Claude's reasoning: `margin-top:9px`, `padding:9px 11px`,
  2px left border `--ai`, radius `0 5px 5px 0`, bg `color-mix(--ai 8%)`, a 9.5px mono uppercase
  "CLAUDE'S REASONING" caption in `--ai-t`, body 11.5px/1.55 `--ai-dim`. The four reasoning strings
  are in the seed data and are worth keeping — they model an agent that explains itself and names
  what it deliberately did *not* do.
* **Gate panel**: `padding:14px`, radius 8. Locked: bg `color-mix(--warn 7%)`, 1px
  `color-mix(--warn 32%)`, 🔒 glyph, "Human sign-off required", and the body "Claude has pre-checked
  its work, but a person on the team has to sign each item before this card can leave <Lane>. Agents
  cannot sign off on their own output." Cleared: bg `color-mix(--green 8%)`, 1px
  `color-mix(--green 35%)`, ✓ glyph, "Cleared to advance", body "All checklist items carry a human
  signature. Moving this card writes a transition event to the audit log."
  Two buttons: "Advance to <next lane>" (solid `--green` / `--on-green` when enabled;
  bg `--s4`, color `--t5`, `cursor:not-allowed` when locked) and a ghost
  "Sign off all 4" / "Clear all signatures".
* **Gate rule**: a card may advance only when every checklist item has a human signature. Cards the
  agent has not touched at all (no pre-checks) are not gated. The `requireHumanSignoff` flag can
  disable the gate for demos — in production this should be a server-enforced policy, not a UI flag.


---

### 4. Agent Activity / Audit Log

**Purpose**: the trust layer. A git log crossed with a Slack thread.

**Layout**: `padding:24px 30px 60px`, inner `max-width:900px`. Eyebrow + h1 "Every action, human or
agent" + lede "Append-only. Written by the [nostack.ai](http://nostack.ai) audit endpoint on each state transition."

* Filter chips (same chip component as the portal): All actors · Claude only · Humans only, with a
  right-aligned mono "N events".
* List container: 1px `--line`, radius 8, bg `--s2`, `overflow:hidden`.
* **Row**: flex, `gap:12px`, `padding:12px 14px`, 1px bottom `--line`. Claude rows get a subtle
  wash — `background: color-mix(in oklch, var(--ai) 4%, transparent)` — which is what makes agent
  activity scannable at a glance. A 22px actor chip on the rail (✦ / ○ / initials, 13%/32% color-mix).
  Then a baseline-aligned line: actor name 12px/600 in the actor's color, the action phrase 12px
  `--t2`, the target id in 10.5px mono `--t5`, and a right-aligned 10px mono relative timestamp.
  Below it, an optional branch chip (10.5px mono `--blue-dim`, bg `--blue-soft`, 1px `--blue-line`,
  radius 4) and an optional mono detail string ("+214 −26", "132 passed · 0 failed",
  "Code Review → Integration Testing").
* 24 seed events spanning 2h → 4d ago. The "Claude only" filter keeps `actor === 'claude'`;
  "Humans only" excludes both Claude and the system actor.


---

### 5. Deploy / Release View

**Purpose**: see what is queued at each gate and whether CI is green.

**Layout**: `padding:24px 26px 60px`, eyebrow + h1 "Pipeline", then a
`grid-template-columns:1fr auto 1fr auto 1fr` with `gap:10px` and `align-items:stretch` —
three environment columns separated by two gate arrows.

* **Gate arrow**: centered column, `--t5`, a 15px "→" over the gate name set vertically
  (`writing-mode:vertical-rl`, 9px mono, uppercase, `letter-spacing:0.1em`): "tests green" then
  "human approval".
* **Environment column**: 1px `--line`, radius 9, bg `--s2`, `overflow:hidden`, full height.
  Head (`padding:12px 13px`, bg `--s3`, 1px bottom `--line`): 7px status dot, name 12.5px/600,
  right-aligned mono "N queued", then the host in 10.5px mono `--t4`.
  Integration (`int.nostack.app`, `--teal` dot) · Staging (`staging.nostack.app`, `--warn` dot) ·
  Production (`api.nostack.ai`, `--green` dot).
* **Release card**: 1px `--line2`, radius 7, bg `--s3`, `padding:11px`. Mono id + assignee avatar;
  title 12px/500; branch 10px mono `--blue-dim`; **CI strip**; footer with a gate chip and a mono
  timestamp.
* **CI strip**: a 3-segment flex row, `gap:1px`, radius 5, `overflow:hidden`. Each segment
  `padding:5px 7px`, label (9px mono, uppercase) pushed apart from a glyph: build · test · deploy.
  Per-state color C with bg `color-mix(in oklch, C 12%, var(--s2))`:
  `pass ✓ --green` · `run • --ai` (pulsing) · `fail ✕ --red` · `queued – --t4`.
  Integration cards run `pass/run/queued`, staging `pass/pass/queued`, production all `pass`.
* **Gate chip**: 9.5px mono, radius 4, 12%/30% color-mix. "auto-promote" (`--t3`) ·
  "awaiting Maya" (`--warn`) · "live" (`--green`).
* Integration holds every `testing` item; Staging mirrors the `staged` lane; Production holds `done`
  items.

**Release pre-flight** — the release-gate counterpart to the card-level review checklist. Above the
pipeline: a status line (mono `--t4`, or `--warn-dim` once conflicts are found) and a
**"Run pre-flight check"** button in exactly the triage-run treatment (32px, 1px
`color-mix(--ai 50%)`, bg `color-mix(--ai 16%)` dropping to 10% while running, `--ai-t` text, ✦ glyph
replaced by an 11px `itr-spin` spinner). It runs 2100ms — "Claude is checking…" — then reveals a
results panel (1px `--line`, radius 9, bg `--s2`, `itr-in` 0.25s) headed
"Release pre-flight · N staged items" with the mono provenance
"ran just now · POST /v1/releases/preflight".

One row per staged branch (`padding:11px`, radius 7, bg `--s3`, `cursor:help`; 1px `--line` when
clean, 1px `color-mix(--warn 32%)` when overlapping):

* an 18px verdict icon — ✓ on green, ! on amber, 14%/45% color-mix
* item id + title, then a one-line assessment of combined impact
* a row of **path chips** (10px mono, `--blue-dim` on `--blue-soft` with a `--blue-line` border) —
  the overlapping file paths are the evidence, so they stay visible rather than hiding behind hover
* a right-aligned verdict chip: "clean" or "overlap"
* **on hover, Claude's reasoning** in the identical treatment to the review-checklist tooltip (2px
  left border `--ai`, 8% amber fill, "CLAUDE'S REASONING" caption, 11.5px `--ai-dim` body)

It closes with a **gate panel identical in structure to the Review tab's**: amber
(`color-mix(--warn 7%)` on a 32% border, 🔒) reading "2 conflicts to resolve", or green
(`color-mix(--green 8%)` on a 35% border, ✓) reading "Cleared to release". The primary button is
"Promote N items to production" — solid `--green` when cleared, `--s4`/`--t5`/`not-allowed` when not —
beside a ghost "Dismiss".

The seeded finding is the point of the screen: two staged branches both touch `queue/retry.ts` and
implement the retry budget incompatibly, and one of them sits under an escalation that is still being
rebased. Claude states the interaction, names the file, predicts the failure mode ("no error, just an
ignored config value"), proposes an order — and stops, because ordering a release is a product call.
The same escalation pattern as the card-level gate, one level up.


---

### 6. Sprints (Sprint cadence only)

**Purpose**: commit a block of work, watch it burn down, close it honestly.

Hidden entirely in Flow mode. `padding:24px 26px 60px`, inner `max-width:1000px`. Eyebrow
"SPRINTS · <cadence>", h1 "Sprint planning", primary "Create sprint" button on the right.

* **Active sprint card** (1px `--line`, radius 9, bg `--s2`): a pulsing `--green` dot, name at
  15px/600, mono date range, right-aligned mono "5 of 10 days left". Goal beneath at 12.5px/1.55,
  `max-width:640px`.
  Then a **two-segment progress bar** (7px, radius 7, track `--line2`): solid `--green` for shipped,
  `color-mix(--blue 45%)` for in flight, percentage in mono beside it. Under that, four inline stats —
  shipped (`--green`), in flight (`--blue-t`), committed, blocked (`--red`).
  A footer strip (bg `--s3`, 1px top `--line`) states the projection in plain words
  ("15 items still open with 5 days left. Projected finish: 2 items short of the commitment.") beside
  a ghost **"Close sprint"** button that turns `--warn` on hover.
* **Past sprints**: rows (1px bottom `--line`) with name (86px), mono date range (120px),
  "11 of 13 shipped", and a right-aligned 74px velocity bar (`--green` when it met the commitment,
  `--blue` when it missed) plus a mono velocity readout.
* **Create sprint modal** (500px): Name (validated ≥3 chars), Start date (mono input), Duration
  (segmented 1w/2w/3w/4w), Sprint goal (textarea). Footer shows `POST /v1/sprints`. Submitting pushes
  the current sprint into the past list and makes the new one active.
* **Close sprint modal** (480px): states how many committed items shipped and how many are still
  open, then offers two **radio cards** (11px, radius 7; selected takes bg `--blue-soft`, a
  `--blue-line` border, and a 4px-ring radio):
  * *Move to the next sprint* — "Unfinished cards keep their column and carry over. Branches stay open."
  * *Send back to Backlog* — "Cards return to intake and lose their sprint assignment. Branches are
    left for cleanup."
    The confirm button is `--warn` and names the consequence: "Close sprint · move 15 items". Choosing
    Backlog actually resets those items' lane and pill.


---

### 7. Analytics

**Purpose**: answer "is this working?" — a different question per cadence.

`padding:24px 26px 60px`, inner `max-width:1120px`. Eyebrow "ANALYTICS · <cadence>"; h1 flips between
**"Flow health"** and **"Sprint health"**. A **date-range picker** sits top right in both modes: a
segmented 7d / 14d / 30d / 90d beside a mono readout "last 30 days · computed on demand". Metrics
recompute from the raw series on every change; nothing is bucketed to a period boundary.

**Retro digest** (top of the screen, both modes). Panel header with the ✦ glyph, "Retro digest", and a
mono subtitle that changes once run. The **"Prepare retro"** button uses the same amber run-treatment
as triage and pre-flight (29px variant), runs 1500ms — "Reading the log…" — then becomes
"Refresh digest". The result is a condensed Activity-log list **grouped by category**, each group
headed by a count badge in the category's accent plus a short note:

* *Merge-conflict escalations* (`--red`)
* *Human overrides of agent pre-checks* (`--ai-t`)
* *Rejected sign-offs* (`--warn`)
* *Cycle-time outliers* (`--purple`) — derived live from the aging data, not seeded

Rows reuse the audit-row anatomy exactly (20px actor chip, actor name in the actor's colour, text,
mono target id, right-aligned relative time) including the 4% amber wash on Claude rows. Empty groups
are dropped, never shown as zero.

**Flow mode** — four charts, in this order of visual weight:


1. **Cumulative flow** (the hero, 300px tall SVG, `viewBox="0 0 620 300"`): one stacked band per board
   column, stacked Done-first from the baseline up, so the growing floor is throughput and the
   widening upper bands are queues. Band fill is the column's own hue at a deliberately desaturated
   `oklch(0.88 …)` light / `oklch(0.42 …)` dark with chroma capped at 0.052 — the chart must read as
   data, not decoration — separated by a 0.6px `--s2` hairline. Gridlines at 5 ticks, mono axis
   labels, x labels "-29d … today". A wrapping legend (`white-space:nowrap` per item) below a 1px rule.
2. **Cycle time** (half width): a 6-bucket histogram (<1d, 1–2d, 2–3d, 3–5d, 5–8d, 8d+) built from
   divs, fill `color-mix(--blue 45–85%, --s2)` scaled by count, value above and label below in mono.
   Subtitle carries the median.
3. **Throughput** (half width): items shipped per week as an SVG polyline (2px `--blue`) with 3px
   dots, three gridlines, mono x labels ending in "now". Subtitle states the direction in words.
4. **Aging work in progress**: one horizontal bar per in-flight card — mono id, truncated title, a
   lane chip in that lane's hue, the bar (`color-mix(accent 55%)` on an `--s1` track), and the day
   count. Thresholds: ≤4d `--green`, 5–8d `--warn`, >8d `--red`. Subtitle counts how many are past the
   8-day threshold. This is the chart that finds forgotten cards.

**Sprint mode** — two charts:


1. **Burndown** (240px SVG): a dashed `--t4` target line from committed-at-day-0 to zero-at-day-D, the
   actual remaining as a 2.5px `--blue` polyline with 3.5px dots over a 14% blue fill, gridlines at 4
   ticks, mono axis labels ("d0 … d10"). Legend below: "Actual remaining" (solid) / "Target" (dashed).
   The actual line stops at today — it does not project.
2. **Velocity**: items shipped per sprint as div bars — past sprints in
   `color-mix(--green 45%, --s2)`, the live sprint in `color-mix(--blue 55%, --s2)` with a dashed
   `--blue-line2` border so an in-progress bar is never mistaken for a finished one. Subtitle gives
   the rolling average.

All charts are data-driven SVG or divs computed in the logic layer — no chart library, no hand-drawn
illustration. The seeded series is a deterministic 90-day generator, so the 7d/14d/30d/90d slices stay
consistent with each other.


---

### 8. Team & invites

**Purpose**: who can touch the board, and what an agent is allowed to do.

Reached from Project settings → "Manage team & invites". `padding:24px 30px 60px`, inner
`max-width:900px`. Eyebrow "TEAM & ACCESS", h1 "Who can touch the board", lede "Agents appear in the
roster like anyone else, but cannot be granted sign-off rights." Primary "Invite member" button.

* **Roster table**: a header strip (bg `--s3`, mono uppercase labels) then rows (1px bottom `--line`):
  26px avatar, name + mono email/provenance, Role (130px), Status chip (110px), right-aligned mono
  action word. Statuses: active (`--green`), away (`--warn`), read-only (`--teal`). Roles: Product
  owner / Dev / Requester / **Agent**.
  The **Claude row keeps the full agent signature** — ✦ avatar, an "✦ agent" badge beside the name,
  the name itself in `--ai-t`, and a 4% amber row wash. Its provenance line reads
  "claude-code · operator: Maya", its status is read-only, and its action column reads "Locked", not
  "Edit". An agent is a roster member with an accountable human behind it.
* **Pending invites**: dimmed rows (`opacity:0.72`) with a dashed-border initial circle, mono email,
  "Invited 2 days ago", role, and **Resend** / **Revoke** buttons. Resend flips its own label to
  "Sent ✓"; Revoke removes the row.
* **Invite modal** (470px): Email (mono input, validated against a real address pattern), Role
  (segmented Requester / Dev / Owner) with a sentence describing what that role can do — including
  that Dev "can own cards, run agents, and sign off review items". Footer shows `POST /v1/invites`.
  Sending prepends a pending invite reading "Invited just now".


---

### 9. Backlog (the primary list surface)

**Purpose**: the full, searchable backlog — built for hundreds of items. Separate from Triage (a
prioritisation ritual over a handful of items) and from the Board's Backlog column (a teaser handle).

A `flex:none` header region over a scrolling table region, so filters and the bulk toolbar stay put
while the list scrolls. `padding:20px 22px 0`. Eyebrow "BACKLOG · <scope>", h1 "Everything not yet
committed", and a right-aligned mono result count — **"1 – 50 of 127 items"**, which is the design's
statement that not everything fits on screen.

**Filter bar** (1px `--line`, radius 8, bg `--s2`, two wrapping rows, `padding:10px 12px`):

* row 1: a 30px search input (titles and ids), **Project** chips (STU/POR/SDK/BIL, multi-select),
  **Bucket** segmented (All / Backlog / Next / Later)
* row 2: **Tags** chips (bug, feature, performance, docs, high-impact, quick-win, regression-risk —
  multi-select), a vote-floor segmented (any votes / 25+ / 50+ / 100+), a submitted-date segmented
  (any date / 7d / 30d / 90d), then right-aligned **Sort** (Votes / AI score / Newest / A–Z) and a
  **Clear filters** button that only exists while something is filtered.
* Group scope is not duplicated here — it lives in the header switcher and is named in the eyebrow.
* Every control is instant and combinable; the result count and pagination recompute from the filtered
  set, not from a cached page.

**Table** (1px `--line`, radius 8, bg `--s2`, `min-width:940px` inside a horizontal scroller). A
sticky header strip (34px, bg `--s3`, mono uppercase labels) and 38px rows separated by 1px `--line`,
hover `--s3`, selected `--blue-soft`. Columns, left to right:
checkbox (14px) · Votes (38px, mono, right) · Id (64px, mono `--t5`) · **Title** (flex, ellipsised,
12\.5px) · Proj (46px chip) · Tags (172px, up to 2 chips, clipped) · Score (34px, mono, `--ai-t` at
≥70) · Status (92px badge) · Submitted (66px, mono, right).
Deliberately denser than the portal's card grid — roughly spreadsheet-adjacent — because the job here
is scanning, not reading.

**Selection and bulk actions.** Each row has a checkbox; the header checkbox selects the visible page.
Once ≥1 row is selected a **bulk toolbar** appears above the table (`position:relative; z-index:20` so
its dropdowns clear the sticky table header; 1px `--blue-line`, bg `--blue-soft`, `itr-in` 0.16s):
"N selected", a divider, then **Add tag ▾**, **Send to triage pass**, **Move to project ▾**,
**Add to delivery ▾**, a right-aligned green confirmation line, and **Clear selection**.
Dropdowns are 180px panels (1px `--line3`, radius 7, bg `--s3h`, the standard `--shadow`). Every
action really mutates the selected items and reports what happened — "12 items tagged 'quick-win'",
"12 items moved to Billing", "12 items added to Q3 auth hardening" — for \~2.6s.

**Pagination**: 50 per page, below the table — the result count again, a mono "page 2 of 3",
Prev / numbered pages (windowed to five) / Next. Disabled ends go `--t5` with `not-allowed`.

**Clicking a row opens the same detail drawer** used by the board. It is not a second drawer: same
tabs, same checklist, same gate.

**Board integration**: the Board's Backlog column now shows only the top 9 by score and ends with a
dashed-border footer button — **"54 more in Backlog →"** — that navigates here. The column header still
reports the true total, so the truncation is visible rather than silent.


---

### 10. Deliveries

**Purpose**: manage release-scoped change-sets that cross project lines.

**List view** (`max-width:1000px`): eyebrow, h1 "Release-scoped change-sets", a lede that states the
distinction from Groups in one sentence, and a primary "Create delivery" button. Cards in an
`auto-fill minmax(300px,1fr)` grid: mono id, a right-aligned mode chip (🔒 Gated on `--warn`, ○ Rollup
on `--teal`), the name at 14px/600, the mode's consequence in prose, then a footer above a 1px rule
with **project chips** for every constituent project, an optional red "blocked" chip when any member
item is escalated, and the item count. Gated cards carry a `color-mix(--warn 26%)` border — the mode
is legible before you click.

**Create delivery modal** (560px): Name; **Mode** as two side-by-side radio cards each with its
one-line explanation ("ships together, one combined release gate" / "ships independently, this is a
visibility view only"); then a 210px scrolling multi-select of candidate items, each row a checkbox +
project chip + id + title, with a live "N selected" count. Footer shows `POST /v1/deliveries`.

**Detail view** — its own layout, not the single-project Release view:

* **Rollup**: a read-only `auto-fit minmax(280px,1fr)` grid, **one column-group per constituent
  project** (header: project chip, project name, item count), each listing that project's items as
  compact cards with lane chip, owner avatar, and live status pill. It closes with a plain statement
  of what Rollup means: no combined gate, each project releases on its own cadence, this view exists
  so one person can see the whole set without opening five boards.
* **Gated**: a **pooled** change-set — one flat list, explicitly *not* grouped by project, because the
  items are being evaluated as one combined change. Each row: project chip, id, title, lane chip,
  status pill, branch, owner. Above it, the same "Run pre-flight check" control as the single-project
  release view (2200ms, amber spinner).
  The result panel is headed **"Cross-project pre-flight"** with the mono provenance
  `POST /v1/deliveries/DLV-04/preflight`, and its findings reason **across project boundaries** — the
  path chips are namespaced (`studio: config/env.ts`, `sdk: src/retry-envelope.ts`) and the verdict
  chip reads "cross-project overlap". Hover reveals Claude's reasoning in the same amber treatment as
  the review checklist. It ends in the same green/amber gate panel as everywhere else.
  The seeded finding is the one a single-project view structurally cannot catch: API Studio makes the
  retry budget resolvable per environment while the JS SDK pins that shape at build time, so shipping
  Studio first silently degrades every older SDK client. Claude names the interaction, predicts the
  failure, proposes an order, and escalates the compatibility decision.

**On items**: a delivery chip sits in the drawer header next to the lane badge and the project chip —
same visual weight, because "which release is this in" is the same class of fact as "which column".

**Cross-project dependency links**: the drawer's Detail tab gains a **"Depends on"** block above
Origin — its own labelled section, not folded into it. Each dependency is a full-width button: project
chip, mono id, title, lane chip; clicking it opens that item's drawer. Under the list, one line of
explanation: a dependency inside the same gated delivery is satisfied by the gate; one outside it is a
release-order problem.


---

## Interactions & Behavior

| Interaction | Behavior |
|----|----|
| Nav pill click | Switches page, closes any open drawer |
| Role switch | Changes the identity avatar (no permission gating yet) |
| Theme toggle | Flips `.itr-light` on the root element, persists to `localStorage['itr-theme']` |
| Portal upvote | Toggles vote, ±1 count, `itr-bump` animation for 420ms |
| Portal sort / filter | Client-side sort and filter, live "N of M" count |
| Submit request | Validates title ≥6 chars, prepends the item, switches sort to Newest |
| Screenshot dropzone | Click toggles a simulated attachment |
| Ask Claude to triage | 1900ms loading state, then AI tags populate on every unlabelled item |
| Score chip hover | Reveals the composite breakdown tooltip |
| Triage drag | Moves an item between Backlog / Next / Later |
| Board drag | Moves a card between all six columns; drop rewrites the pill for Done and Backlog |
| Card click | Opens the detail drawer on the Detail tab |
| Drawer tab click | Switches Detail / Work / Activity / Review |
| Start work | Opens the Plan Preview gate; nothing is written until the plan is approved |
| Approve plan | Starts the Live Session; steps stream in at \~780ms intervals |
| Send back with notes | Reveals a note field; re-submitting logs the note and stamps the plan "Revision N" |
| Session gate (Approve write) | Resumes the stream past the blocked write and logs the human approval |
| Session gate (Deny) | Drops to "Idle — waiting for input" with an inline reply field |
| Resume | Sends the instruction and finishes the session (PR opened, migration skipped) |
| Collapse / Expand session | Swaps the stream for the one-line completion summary |
| Git op button | Advances the phase on the last button of a group and appends a compact log entry |
| [CLAUDE.md](http://CLAUDE.md) edit | Marks the file "unsaved changes"; Commit to main flips it back to "in sync" |
| Add skill | Two-field modal (name required); prepends the row as "just now" |
| Provider Connect / Manage | Credential modal; key required to connect, Bedrock/Vertex/Foundry sub-field for Anthropic |
| Execution provider select | Sets which provider the plan and session panels run against |
| Checklist row hover | Reveals Claude's reasoning for that pre-check |
| Sign off toggle | Toggles one human signature; "Sign off all" / "Clear all" toggles all four |
| Advance | Enabled only when the gate is cleared; moves the card one lane forward and closes the drawer |
| Send prompt | Appends the human entry now, a Claude reply after 900ms |
| Rebase with Claude | Rewrites the pill and appends two feed entries |
| I'll handle it locally | Reassigns to Devin, rewrites the pill, appends a note |
| Audit filter | All / Claude only / Humans only |
| Group switcher | Scopes Portal, Backlog, Board, Triage, Analytics, and every nav count |
| Backlog search / filters | Instant, combinable; result count and pagination recompute |
| Row checkbox / header checkbox | Selects a row / the visible page; reveals the bulk toolbar |
| Bulk actions | Really mutate the selected items and report what happened for \~2.6s |
| Backlog row click | Opens the shared detail drawer |
| "N more in Backlog →" | Board Backlog column → Backlog screen |
| Delivery card click | Opens Rollup grid or Gated pooled list |
| Delivery pre-flight | 2200ms, then cross-project verdicts + hover reasoning + gate |
| Create delivery / group | Validated multi-select modals; both really add to state |
| Permission / notification toggle | Per cell; Agent sign-off and release cells are locked, not merely off |
| "Depends on" chip click | Jumps the drawer to the linked item in another project |
| Settings gear | Opens the Project settings popover; nav clicks and the dismiss layer close it |
| Cadence switch | Flow ↔ Sprint: shows/hides the Sprints tab and swaps the whole Analytics view |
| Create sprint | Validates the name, archives the current sprint, makes the new one active |
| Close sprint | Choose carry-over or Backlog; Backlog actually resets those items' lane and pill |
| Range picker | Recomputes every Analytics metric from the raw 90-day series |
| Prepare retro | 1500ms read, then a grouped digest; the outlier group is derived live |
| Run pre-flight | 2100ms check, then per-branch verdicts, hover reasoning, and a release gate |
| Pre-flight row hover | Reveals Claude's reasoning for that verdict |
| Drag to Staged | Sets the pill to "Staged · held for release" (kind `hold`) and queues it for Staging |
| Invite member | Validates the email, prepends a pending invite |
| Resend / Revoke | Flips the button to "Sent ✓" / removes the pending row |
| Scrim or ✕ click | Closes the drawer or modal |

**Animations** (all defined as keyframes, all ease unless noted):

* `itr-spin` — 0.7s linear infinite, triage spinner
* `itr-pulse` — 1.6s (status dots) / 1.4s (CI "run") / 2.4s (header API dot), `ease-in-out infinite`,
  opacity 1 → 0.35 → 1
* `itr-in` — 0.3s (portal cards) / 0.2s (modal), opacity 0 + translateY(6px) → rest
* `itr-drawer` — 0.22s, translateX(28px) + opacity 0 → rest
* `itr-bump` — 0.42s, translateY(-5px) scale(1.14) at 40%, vote count

**Responsive**: designed for desktop. The header shrinks its status label then its nav (see above);
the board scrolls horizontally below 1500px; the portal grid reflows via `auto-fill minmax(340px,1fr)`;
the drawer and modal cap at `94vw`. No mobile layout exists yet.


---

## State Management

Prototype state, all in one component. Port to whatever the codebase uses (store, context, server state).

**Server-owned (should become API-backed):**

* `items[]` — the backlog. Per item: `id, title, cat, votes, voted, lane, assignee, branch, pill, pillKind, impact, effort, bucket, submitter, days, aiTags[], signed{index:bool}, desc`
* `auditEvents[]` — append-only log
* per-card activity feed entries

**Client-only UI state:**

* `theme` ('dark' | 'light', persisted) · `page` · `role`
* `sort`, `pfilter` (portal) · `afilter` (audit)
* `modal`, `fTitle`, `fDesc`, `fCat`, `fShot`, `fErr` (submit form)
* `triaging`, `triaged` (triage run) · `tip` (which score tooltip) · `hoverCheck` (which checklist row)
* `dragId`, `dragOver` (drag session) · `open` (card id), `tab` (drawer tab) · `prompt` (composer)
* `bump` (which vote is animating)

**Scope, groups, and deliveries (server-owned in production):**

* `scope` ('all' | groupId | projectId) · `groups[]` ({id, name, projects\[\]})
* `deliveries[]` ({id, name, mode, items\[\], note}) · `openDelivery`
* per-item `project` · `DEPENDS` (item → linked items in other projects)
* `perms` (role × permission matrix) · `notifs` (trigger × channel matrix)

**Backlog screen state (all client-only):**

* `bq` (search), `bProj{}`, `bTags{}`, `bStatus`, `bVotes`, `bDays`, `bSort`
* `bPage`, `bSel{}` (selected ids), `bulkMenu` (which dropdown is open), `bToast`
* Server-side this is one query — pass the filter set and page to the API rather than filtering
  client-side; the prototype filters in memory only because it holds the whole set.

**Cadence and planning (server-owned in production):**

* `cadence` ('flow' | '1' | '2' | '3' | '4')
* `sprintActive` ({name, range, days, elapsed, planned, goal}) · `sprintPast[]`
* per-item `owner` and `workers[]` (the prototype derives these from a `CREW` map keyed by item id)
* `invites[]` (pending) and the roster

**Additional client-only UI state:**

* `settingsOpen` · `arange` (7|14|30|90)
* `sprintModal`, `spName`, `spStart`, `spDur`, `spGoal`, `spErr` · `closeModal`, `closeChoice`
* `inviteModal`, `invEmail`, `invRole`, `invErr`, `resent{}`
* `pfState` ('idle'|'run'|'done'), `pfHover` · `retroState` ('idle'|'run'|'done')

**Derived, recomputed per render:** nav counts, portal list (sorted + filtered), triage columns,
board columns, composite scores, checklist state, gate eligibility, audit rows, pipeline contents.

**Data / endpoint surface** to build against ([nostack.ai](http://nostack.ai) REST; the same operations should exist as MCP
tools so Claude Code can drive the board):

```
GET    /v1/requests?sort=&status=            portal + board + triage feed
POST   /v1/requests                          submit (modal)
POST   /v1/requests/:id/vote                 upvote / remove vote
POST   /v1/triage/run                        Claude categorization pass → tags, impact, effort
PATCH  /v1/items/:id                         lane, bucket, assignee, pill
GET    /v1/items/:id/activity                Dev ↔ Claude feed
POST   /v1/items/:id/prompts                 send a prompt to the agent
GET    /v1/items/:id/checklist               agent pre-checks + reasoning
POST   /v1/items/:id/checklist/:n/signoff    human signature (must reject agent identities)
POST   /v1/items/:id/advance                 phase transition; 409 if the gate is not cleared
POST   /v1/items/:id/rebase                  agent rebase action
GET    /v1/audit?actor=                      audit log
GET    /v1/deployments                       pipeline + CI status
```

Added by this revision:

```
GET    /v1/groups · POST /v1/groups · PATCH /v1/groups/:id
GET    /v1/projects
GET    /v1/deliveries · POST /v1/deliveries
GET    /v1/deliveries/:id                    members, mode
PATCH  /v1/deliveries/:id/items              add/remove member items
POST   /v1/deliveries/:id/preflight          cross-project agent pass
GET    /v1/items?scope=&q=&project=&tag=&bucket=&minVotes=&since=&sort=&page=
POST   /v1/items/bulk                        {ids, action, value} — tag, bucket, project, delivery
GET    /v1/items/:id/dependencies · POST/DELETE the same
GET    /v1/permissions · PATCH /v1/permissions
GET    /v1/notification-preferences · PATCH the same
```

The backlog list endpoint must paginate server-side and return a total — the UI is designed around a
count it does not compute itself.

Previously added:

```
GET    /v1/project/settings                  cadence, roles
PATCH  /v1/project/settings                  set cadence
GET    /v1/sprints                           active + past
POST   /v1/sprints                           create
POST   /v1/sprints/:id/close                 body: {unfinished: "next" | "backlog"}
GET    /v1/metrics/flow?from=&to=            cumulative flow series
GET    /v1/metrics/cycle-time?from=&to=      histogram buckets
GET    /v1/metrics/throughput?from=&to=      per-week counts
GET    /v1/metrics/aging                     in-flight cards + days in column
GET    /v1/metrics/burndown?sprint=          target + actual series
GET    /v1/metrics/velocity                  per-sprint shipped
POST   /v1/retro/digest?from=&to=            agent pass over the audit log
POST   /v1/releases/preflight                agent pass over the staged set
GET    /v1/members                           roster
POST   /v1/invites                           create · DELETE /v1/invites/:id · POST …/resend
PATCH  /v1/items/:id/owner                   reassign owner (humans only — reject agent ids)
PATCH  /v1/items/:id/workers                 add or remove workers
```

Metrics endpoints must accept an arbitrary from/to — the range picker is not period-locked.

Long-running agent work (coding, triage, rebase) should stream — SSE or websocket — so status pills
and the activity feed update without polling.


---

## Design Tokens

Every color is an oklch CSS custom property with a dark (default, `:root`) and light (`.itr-light`)
value. Ported values below; keep the pairs together so the theme swap stays a one-line change.

| Token | Dark | Light | Use |
|----|----|----|----|
| `--s0` | `oklch(0.17 0.008 265)` | `oklch(0.972 0.003 265)` | page background |
| `--s1` | `oklch(0.165 0.008 265)` | `oklch(0.955 0.004 265)` | inputs, code blocks, sunken |
| `--s2` | `oklch(0.195 0.008 265)` | `oklch(0.988 0.002 265)` | header, columns, panels |
| `--s3` | `oklch(0.222 0.008 265)` | `oklch(1 0 0)` | cards, modal |
| `--s3h` | `oklch(0.245 0.01 265)` | `oklch(1 0 0)` | tooltip |
| `--s4` | `oklch(0.265 0.012 265)` | `oklch(0.935 0.005 265)` | active pill, hover, score pill |
| `--line` | `oklch(0.275 0.012 265)` | `oklch(0.905 0.006 265)` | default border, dividers |
| `--line2` | `oklch(0.31 0.012 265)` | `oklch(0.87 0.007 265)` | control borders |
| `--line3` | `oklch(0.36 0.014 265)` | `oklch(0.80 0.008 265)` | stronger borders, dashed |
| `--line4` | `oklch(0.42 0.02 265)` | `oklch(0.70 0.010 265)` | hover border |
| `--t1` | `oklch(0.94 0.005 265)` | `oklch(0.24 0.012 265)` | primary text |
| `--t2` | `oklch(0.80 0.008 265)` | `oklch(0.34 0.012 265)` | body text |
| `--t3` | `oklch(0.64 0.01 265)` | `oklch(0.45 0.012 265)` | secondary text |
| `--t4` | `oklch(0.55 0.01 265)` | `oklch(0.53 0.012 265)` | labels, captions |
| `--t5` | `oklch(0.47 0.01 265)` | `oklch(0.60 0.012 265)` | faint mono metadata |
| `--blue` | `oklch(0.70 0.13 250)` | `oklch(0.50 0.17 258)` | **human accent**, primary button |
| `--blue-h` | `oklch(0.76 0.13 250)` | `oklch(0.44 0.17 258)` | primary button hover |
| `--blue-t` | `oklch(0.85 0.10 250)` | `oklch(0.42 0.15 258)` | blue text on tint |
| `--blue-line` | `oklch(0.42 0.07 250)` | `oklch(0.76 0.08 258)` | active chip border |
| `--blue-line2` | `oklch(0.51 0.10 250)` | `oklch(0.62 0.13 258)` | drag / drop-target border |
| `--blue-soft` | `oklch(0.27 0.05 250)` | `oklch(0.955 0.025 258)` | active chip fill |
| `--blue-dim` | `oklch(0.63 0.06 250)` | `oklch(0.47 0.11 258)` | branch names |
| `--on-blue` | `oklch(0.17 0.02 265)` | `oklch(0.99 0.01 258)` | text on solid blue |
| `--ai` | `oklch(0.76 0.15 62)` | `oklch(0.58 0.15 52)` | **Claude accent** — fills, borders, mixes |
| `--ai-t` | `oklch(0.84 0.13 62)` | `oklch(0.47 0.13 50)` | Claude text |
| `--ai-dim` | `oklch(0.70 0.05 62)` | `oklch(0.52 0.07 55)` | Claude sub-text, reasoning body |
| `--on-ai` | `oklch(0.20 0.03 62)` | `oklch(0.99 0.01 55)` | text on solid amber |
| `--green` | `oklch(0.74 0.15 152)` | `oklch(0.52 0.13 152)` | shipped, passing, signed |
| `--green-t` | `oklch(0.86 0.10 152)` | `oklch(0.41 0.11 152)` | green text |
| `--green-line` | `oklch(0.48 0.10 152)` | `oklch(0.78 0.08 152)` | signed border |
| `--green-soft` | `oklch(0.28 0.06 152)` | `oklch(0.955 0.03 152)` | signed fill |
| `--on-green` | `oklch(0.19 0.03 152)` | `oklch(0.99 0.01 152)` | text on solid green |
| `--red` | `oklch(0.76 0.16 25)` | `oklch(0.53 0.19 25)` | escalation, conflict, failure |
| `--red-t` | `oklch(0.84 0.12 25)` | `oklch(0.45 0.17 25)` | escalation text |
| `--red-dim` | `oklch(0.80 0.03 25)` | `oklch(0.44 0.10 25)` | escalation body copy |
| `--warn` | `oklch(0.78 0.16 85)` | `oklch(0.58 0.14 68)` | gate locked, awaiting approval |
| `--warn-dim` | `oklch(0.70 0.10 85)` | `oklch(0.50 0.10 68)` | warning captions |
| `--purple` | `oklch(0.74 0.10 300)` | `oklch(0.49 0.15 300)` | "waiting for review" |
| `--purple-soft` | `oklch(0.30 0.02 300)` | `oklch(0.945 0.03 300)` | requester avatar fill |
| `--purple-t` | `oklch(0.80 0.05 300)` | `oklch(0.42 0.13 300)` | requester initial |
| `--teal` | `oklch(0.68 0.10 200)` | `oklch(0.51 0.11 210)` | integration env |
| `--shadow` | `oklch(0.10 0.01 265 / 0.6)` | `oklch(0.55 0.025 265 / 0.16)` | drawer, modal, tooltip |
| `--scrim` | `oklch(0.12 0.008 265 / 0.58)` | `oklch(0.62 0.02 265 / 0.30)` | overlay backdrop |

**Project chips.** Each project carries a hue (API Studio 250, Client Portal 300, JS SDK 190,
Billing 100) rendered as a 9px mono chip at `oklch(0.42 0.09 H)` in light / `oklch(0.78 0.09 H)` in
dark, on the same 13%/32% tint. Chips show the three-letter short code (STU, POR, SDK, BIL) on dense
surfaces and the full name where there is room. They appear only when the view spans more than one
project.

**Delivery chips.** A delivery chip is the same 12%/30% tint on `--warn` for Gated (🔒) and `--teal`
for Rollup (○) — deliberately the same two accents the release gate already uses, so "gated" reads as
"there is a gate here" everywhere it appears.

**Tinting convention.** Status pills, badges, tag chips, and legend chips never use a hand-picked
tint. They derive from their accent: text = the accent (or its `-t` variant), fill =
`color-mix(in oklch, ACCENT 11–16%, transparent)`, border =
`color-mix(in oklch, ACCENT 28–35%, transparent)`. Keep this — it is what makes both themes work
from one token set, and it means a new status kind needs one color, not three.

**Typography**

* UI: **Instrument Sans** (400/500/600/700), fallback Helvetica, sans-serif
* Mono: **JetBrains Mono** (400/500/600) — ids, branches, counts, timestamps, labels, code, diffs
* Scale: 25 / 21 / 17 / 15 / 14 / 13.5 / 13 (base) / 12.5 / 12 / 11.5 / 11 / 10.5 / 10 / 9.5 / 9 px
* Headings use negative tracking (`-0.02em` at 21–25px, `-0.015em` at 17px, `-0.005em` on card titles)
* Mono uppercase labels use `letter-spacing:0.07–0.09em`
* `-webkit-font-smoothing:antialiased`; `text-wrap:pretty` on prose

**Spacing** — 4px-based, in practice: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 30
**Radii** — 2 (lane dots) · 3 (count badges) · 4 (chips, mono badges) · 5 (segments, pills, CI strip) ·
6 (buttons, inputs) · 7 (cards, tooltips) · 8 (containers) · 9 (columns) · 10 (modal) · 50% (avatars)
**Shadows** — `0 12px 30px var(--shadow)` (tooltip) · `0 30px 70px var(--shadow)` (modal) ·
`-24px 0 60px var(--shadow)` (drawer)
**Control heights** — 24 (segment) · 26 (chip, sign-off, close) · 29 (nav pill, escalation button) ·
31 (gate button) · 32 (tab, triage button, modal footer button) · 34 (input, primary button)

**Density flag**: board card padding 11px comfortable / 9px compact. Nothing else changes.


---

## Assets

None. No images, no icon library. Glyphs are typographic characters used deliberately and should be
replaced with real icons in production:

* **✦** — the Claude / agent signature (avatars, badges, buttons, audit rail, checklist pre-checks)
* **▲** — vote and vote-count
* **✓ ✕ • – ! → ○ 🔒 ☀ ☾** — sign-off, close/fail, running, queued, escalation, pipeline flow,
  system actor, gate lock, theme toggle

Two Google Fonts are loaded: Instrument Sans and JetBrains Mono.

## Files

* `PairedDev.dc.html` — the complete prototype: all ten screens, shared navigation, both themes,
  seed data: 24 curated items across seven lanes plus 120 generated backlog items (so pagination,
  result counts, and bulk actions operate on real volume), 4 projects, 3 groups, 3 deliveries, 4 human
  team members, Claude as a recurring assigned agent, 24 audit events, an owner/worker crew per card,
  5 sprints, a 90-day metrics series, a roster with pending invites, permission and notification
  matrices, and both single-project and cross-project pre-flight findings. Open it directly in a browser.
* `Iterate.dc.html` — the previous revision, kept for reference only. Ignore it for implementation.
* `connectors/github.json` — [nostack.ai](http://nostack.ai) connector definition for GitHub (section 14).
* `support.js` — runtime needed to open the `.dc.html` files in a browser. Not part of the design.

Seed data worth preserving when you port: the two fully-written activity feeds (`ITR-118` Safari
OAuth, `ITR-241` webhook retry queue — the merge-conflict escalation example), the four checklist
reasoning strings, and the acceptance criteria for the five described items. They are the clearest
statement of the intended agent voice: specific, technical, and willing to say what it did not do
and why it stopped.


---

## 11. Work tab — plan-then-build (revises the previous git panel)

The drawer's Work tab replaces the earlier single "Prompt Preview" panel with **two panels that model
the actual sequence**: a plan a human approves, then a session a human watches. The old compact
activity log stays exactly as it was for human and git events (PR opened, review submitted, checks) —
what moved out of it is agent work, which now has its own running-process panel.

### Contextual git operation row

Top of the tab: a mono "GIT OPERATIONS" label with the current **execution provider** named on the
right as a quiet mono chip ("Anthropic", or "Anthropic · Bedrock" when routed). Below it, a wrapping
button row inside a 1px `--line` / radius-8 / `--s3` shell, in six phase groups separated by mono →:

`Start work` → `Check branch status · Commit · Open PR` → `Request review · Submit review` →
`Checks · Trigger workflow` → `Merge` → `Create linked issue`

Buttons in the **current** phase are 1px `--line3` on `--s4` at 600 weight (Start work is solid
`--ai` / `--on-ai` — it is the one that hands the card to an agent). **Past** phases go 1px `--line`
transparent `--t4`; **future** phases the same but `--t5` and `not-allowed`. Clicking the last button
of a group advances the phase. Every op appends one compact entry to the Activity feed — branch status
from the system actor, commits and PRs from the human, review approvals from the reviewer.

### Panel 1 — Plan Preview (a required gate)

Appears when Start work is clicked for an agent worker, **before anything is written**. Given the same
visual weight as the checklist sign-off gate: 1px `color-mix(--ai 48%)`, radius 9, fill
`color-mix(--ai 6%)`.

* **Header**: ✦ glyph, "Claude's plan" at 13.5px/600, and a mono uppercase "approval required" badge
  in the amber tint.
* **Intro** in `--ai-dim`: what it has read so far and an explicit statement that nothing is written.
* **Files it intends to touch** — a sunken `--s1` table, one row per file: an `edit`/`new` kind chip
  (blue / green, the standard 12%/30% tint), the path in 11px mono, and a right-aligned size estimate.
  Monospace paths are the point — this reads as a document, not a chat bubble.
* **Order of work** — a numbered list, zero-padded mono indices ("01"), 12px/1.55 body.
* **Risks it flagged** — one card per risk, 2px left border `--warn` on a 7% warn fill, a 11.5px/600
  `--warn-dim` label ("Protected path", "Response shape changes", "Unknown fixture") over the body.
  The first risk names the hook that will block it later, so the session's pause is pre-announced.
* **Footer**: a mono restatement ("Nothing is written until this is approved"), then
  **Send back with notes** (ghost) and **Approve plan** (solid `--ai`).
  Send back reveals a textarea; re-submitting requires a non-empty note ("Say what should change — an
  empty note is just a rejection."), logs it to the activity feed, and stamps the plan with a
  "Revision N · your note" block. Approve plan starts the session and writes a human-approval entry.

### Panel 2 — Live Session (a running process)

Replaces the static agent activity entries. 1px `--line2`, radius 9, bg `--s1`.

* **Header strip** (bg `--s3`): a **status pill** — Running (`--green-t`, pulsing dot) /
  "Paused — needs approval" (`--ai-t`) / "Idle — waiting for input" (`--warn`) / Idle (`--t3`) — then a
  mono step count and elapsed clock, then a **Collapse** button.
* **Stream** (max-height 300, scrolling): one row per step, a 17px icon tile in the action's accent
  (`read ▤ --t3` · `write ✎ --blue-t` · `bash ❯ --t2` · `test ✓ --green-t` · `git ⑂ --purple-t` ·
  `deny ⊘ --red-t`), the step text in 11px mono, and a right-aligned mono clock. Steps arrive \~780ms
  apart: reads, edits, `make test`, "3 tests passing, 0 failing", the migration, `make migrate-check`,
  then the PR.
* **Inline approval card** (mid-stream, when a hook blocks a write): 1px `color-mix(--ai 55%)` on a 9%
  amber fill, inset in the stream rather than lifted out of it. ⏸ "Paused — needs your approval", what
  it wants to write (path in mono), then a sunken `--s1` strip naming the hook that blocked it
  (`protected-paths`, PreToolUse / Write, action `ask`) and why, then **Approve write** (solid `--ai`)
  and **Deny** (ghost, red on hover). Resolution happens in the panel — no navigating away.
  Deny appends a `deny` step, drops the pill to "Idle — waiting for input", and shows an inline reply
  field ("Skip the migration and open the PR without it.") with a **✦ Resume** button.
* **On completion** the panel can collapse to a single line — "✓ Completed in 4m 22s — 3 files
  changed, PR #482 opened" with an "Expand" affordance — and the card's status pill becomes
  "PR #482 open · 3 files changed". A single summary entry lands in the Activity feed with the
  diffstat, so the compact log still records that a session happened.

**Idle state**: before Start work, a dashed-border panel — "Nothing running on this card" over one
sentence naming the provider it would run against.


---

## 12. Agent configuration (replaces the "Agent Playbook" concept)

Reached from Project settings → **Agent configuration**. Its own screen (`page:'agent'`), not in the
top nav — it is project setup, not daily work. `padding:24px 30px 60px`, `max-width:900px`,
eyebrow "PROJECT SETTINGS / AGENT CONFIGURATION", h1 "What Claude knows before it starts", and three
tabs in the Team-screen tab treatment: **[CLAUDE.md](http://CLAUDE.md) · Skills · Hooks**.

**[CLAUDE.md](http://CLAUDE.md) editor.** Framed as a repository file, not an app setting: a header strip (bg `--s3`)
with a `--purple-t` ⑂ git glyph, the path `claims-api/CLAUDE.md` in mono, a state chip
("in sync" green / "unsaved changes" warn), and a right-aligned mono "last synced 4d ago · main@4821".
The editor itself is a borderless full-width `--s1` textarea, 11.5px/1.7 JetBrains Mono,
`spellcheck="false"`, 22 rows, resizable. Footer: one line of prose ("Committed to the default branch
on save. Every session reads it as its first turn — this is the file, not a copy of it."), then
**Revert** and **Commit to main** (the primary greys out to "Saved" when clean).
The seeded content is the real value: commands (including `make seed` marked do-not-run),
architecture rules per layer, a **"Things you get wrong here"** section, and a migrations note that
matches the hook that pauses the Live Session.

**Skills.** A utility table — Skill (168px mono) · Triggers on (flex prose) · Updated (96px mono,
right). Five seeded skills, each a real procedure (`add-endpoint`, `status-enum-change`,
`flagged-rollout`, `perf-triage`, `incident-writeup`). **Add skill** opens a 520px two-field modal
(name, mono; body, mono textarea) with the footer hint `PUT .claude/skills/`; the name is required and
the new row prepends as "just now".

**Hooks.** The enforcement layer behind the Git Guardrail toggles in Project Settings — the toggles
stay; this is where the finer rules live. Table: Hook (name + the mono glob it matches) · Trigger
(132px, `PreToolUse / Write`, `PreToolUse / Bash`, `PostToolUse / Bash`) · Action (64px chip —
`block` red, `ask` amber, `allow` neutral) · Scope (118px, "Team" or "Org-managed").
Org-managed rows are **locked**: the name drops to `--t2` and carries a "🔒 Set by admin" badge in the
neutral `--s4` tint. A closing note states why they cannot be edited here (a project owner cannot
widen what the org narrowed) and where to change them.
The intro line ties the layer together: a hook set to `ask` is exactly what pauses a Live Session and
puts the approval card in front of you.


---

## 13. AI provider connectors (org level)

A fourth tab on the Team & access screen — **Roster · Permissions · Notifications · Providers** —
because these are org facts that sit beside people and permissions, not per-project settings.

**Provider cards** in an `auto-fill minmax(258px,1fr)` grid, each 1px `--line2` / radius 9 / `--s2`:
a 22px mark tile (Anthropic's is the amber ✦ signature; the others neutral), the name, a right-aligned
status chip (Connected green / Not connected neutral / Unavailable), one sentence of consequence, then
an action button and a mono meta line ("claude-sonnet-4-6 · connected 12 Aug").

* **Anthropic** — connected. Runs Plan Preview and Live Session directly.
* **Google** — not connected. Available for triage, scoring, and summaries; not certified for write
  sessions on protected paths.
* **OpenAI** — greyed to `opacity:0.6` with the action disabled and the label "Read the docs". Its
  `title` tooltip carries the distinction: OpenAI models cannot be brokered through [nostack.ai](http://nostack.ai), so you
  would run the execution environment yourself and point it at your own key — the board would see
  results, not the session.

**Credential modal** (480px, the GitHub-connector construction): a masked `type="password"` API key
input in mono with letter-spacing, a validation error when empty on connect ("A key is required to
connect. Nothing runs without one."), and a note that the key goes to the org secret store and is
masked from then on. For **Anthropic only**, a bordered sub-panel with a checkbox row —
"Route through a cloud gateway · AWS Bedrock, Google Vertex, or Microsoft Foundry. Inference stays
inside your cloud account and billing" — which when ticked reveals a segmented **Gateway**
(Bedrock / Vertex / Foundry) and an **Endpoint** input whose placeholder changes per gateway
(`bedrock-runtime.us-east-1.amazonaws.com`, `us-central1-aiplatform.googleapis.com`,
`nostack.services.ai.azure.com`). Footer hint: `POST /v1/org/providers/:key` (PATCH when managing).
Saving marks the provider connected and rewrites its meta line to name the routing.

**Execution provider** then appears in Project settings, directly under Cadence: a native select of
the three providers with non-connected ones disabled, and a sentence naming what it changes
("Plan Preview and Live Session on this project run against Anthropic via Bedrock."). Deliberately
quiet — it is a project default, not a feature.

### Endpoints added by this revision

```
POST   /v1/items/:id/plan                    request a plan (no writes)
POST   /v1/items/:id/plan/:n/approve         human approval → starts a session
POST   /v1/items/:id/plan/:n/revise          body: {notes}
GET    /v1/items/:id/session                 SSE / websocket step stream
POST   /v1/items/:id/session/gate/:n         body: {decision: "approve" | "deny", notes?}
POST   /v1/items/:id/session/resume          body: {instruction}
GET    /v1/projects/:id/claude-md · PUT the same   (commits to the default branch)
GET    /v1/projects/:id/skills · POST · PUT /:name · DELETE /:name
GET    /v1/projects/:id/hooks                team + inherited org hooks, with a locked flag
GET    /v1/org/providers
POST   /v1/org/providers/:key                {apiKey, gateway?, endpoint?} — key never returned
PATCH  /v1/org/providers/:key
PATCH  /v1/projects/:id/settings             {executionProvider}
```

The session stream is the one endpoint the design cannot fake: the Live Session panel is built around
steps arriving one at a time, and a poll-and-replace implementation will read wrong.

### State added by this revision

* `git{itemId: {phase, stage, steps[], idx, revision, lastNote, notesOpen, collapsed}}` —
  `stage` is `idle | plan | running | paused | waiting | done`
* `gitNotes`, `gitNotesErr`, `gitReply` (the two composer fields)
* `agentTab`, `claudeMd`, `mdSaved`, `skills[]`, `skillModal`, `skName`, `skBody`, `skErr`
* `providers{key: {connected, key, routed, gateway, endpoint, meta}}`, `provModal`, `pKey`,
  `pRouted`, `pGateway`, `pEndpoint`, `pErr`, `execProvider`

In production `git`, `claudeMd`, `skills`, `hooks`, `providers`, and `execProvider` are all
server-owned; only the modal and composer fields are client state.


---

## 14. GitHub connector ([nostack.ai](http://nostack.ai))

`connectors/github.json` follows the existing [nostack.ai](http://nostack.ai) connector schema (same shape as the PayPal sample: `auth_schema`, `webhook_events`, `allowed_domains`) and adds an `actions` array for outbound calls.

**Auth.** `auth_type: "dynamic"` with two modes:

* `fine_grained_pat` — works with the current runtime (Bearer token). Required permissions: Contents RW, Pull requests RW, Issues RW, Actions RW, Checks R, Metadata R. Optional committer name/email so agent commits are distinguishable.
* `github_app` — declared but **not yet supported**: needs a JWT-assertion auth type that mints and refreshes 1-hour installation tokens. Known gap; record it in `docs/architecture/07-connectors.md`.

**Actions → Work-tab buttons** (one action per button):

| Phase | Button | action_id | Endpoint |
|----|----|----|----|
| 1 | Start work | `create_branch` | POST /repos/{owner}/{repo}/git/refs |
| 2 | Check branch status | `compare_branch` | GET /compare/{base}...{head} |
| 2 | Commit | `commit_files` | PUT /contents/{path} |
| 2 | Open PR | `create_pull_request` | POST /pulls |
| 3 | Request review | `request_reviewers` | POST /pulls/{n}/requested_reviewers |
| 3 | Submit review | `submit_review` | POST /pulls/{n}/reviews |
| 4 | Checks | `list_check_runs` | GET /commits/{ref}/check-runs |
| 4 | Trigger workflow | `dispatch_workflow` | POST /actions/workflows/{id}/dispatches |
| 5 | Merge | `merge_pull_request` | PUT /pulls/{n}/merge |
| 6 | Create linked issue | `create_issue` | POST /issues |

**Webhooks** (HMAC-SHA256, `X-Hub-Signature-256`, event id from `X-GitHub-Delivery`, type from `X-GitHub-Event`): `pull_request.opened`, `pull_request.closed`, `pull_request_review.submitted`, `check_suite.completed`, `workflow_run.completed`, `push`. All update `work_item`. They drive the card status pill, the CI strip on Release/Delivery cards, the "N commits behind" escalation, and Activity entries.

**Platform rules the connector format cannot express — enforce in [nostack.ai](http://nostack.ai):**

* `merge_pull_request` is never callable by an agent unattended; requires a human approval event.
* `submit_review` from an agent identity is limited to `COMMENT`.
* `commit_files` is subject to project Hooks (`protected-paths`, no-force-push) before the call; an `ask` result pauses the Live Session.
* Merge sends the expected head SHA so a moved branch fails rather than lands.

**Open decisions for backend:**


1. *Correlation key* — currently `pull_request.head.ref` (agent branch name), since it exists before a PR and on push. Branch naming must therefore be unique per card (e.g. `fix/ITR-118-…`). Alternative: card id in PR body.
2. *Multi-file commits* — Contents API is one call per file. For atomic commits add Git Data API actions (create blob → tree → commit → update ref).
3. *Webhook secret* — `verify.secret_fields` references `webhook_secret`, which needs to be declared in `auth_schema` per the platform's convention for dynamic-auth connectors.
4. *Repo binding* — the prototype has no Repositories screen. Production needs per-project repo selection, default branch, branch-name pattern, and an unattended-action policy (branch only / open PR / never merge) under Project settings, plus webhook health visibility.

### Suggested build order


1. Data model + REST/MCP surface (items, lanes, owners/workers, audit).
2. Board, drawer (Detail / Activity / Review), checklist gate.
3. GitHub connector (PAT mode) + webhooks → Work tab git operations.
4. Plan Preview + Live Session over SSE; Hooks enforcement.
5. Providers, Agent configuration, Backlog, Deliveries, Analytics, Sprints.


