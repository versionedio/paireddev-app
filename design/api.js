// Mock API. Function names follow the /v1 endpoints in the handoff so each one
// becomes a fetch() in the real app. Every call can fail with { ok:false, status }.
import { getState, setState, persist } from './store.js';
import { CONFIG } from './config.js';
import { tagsFor } from './lib/score.js';
import { gateOf, nextLane, laneOf, hasClaude } from './lib/model.js';
import { SESSION, GIT_PHASES, GIT_LOG, PLAN } from './data/seed.js';

const wait = (ms = CONFIG.latencyMs) => new Promise(r => setTimeout(r, ms));
const ok = (data) => ({ ok: true, data });
const fail = (status, message) => { toast(message); return { ok: false, status, message }; };

let toastTimer;
export function toast(text) {
  setState({ toast: text });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setState({ toast: '' }), 2800);
}

const patchItem = (id, fn) => setState(s => ({ items: s.items.map(i => (i.id === id ? { ...i, ...fn(i) } : i)) }));
const feed = (id, who, text, pre = null) =>
  setState(s => ({ feeds: { ...s.feeds, [id]: (s.feeds[id] || []).concat([[who, text, 'just now', pre]]) } }));
const humanActor = () => (getState().role === 'agent' ? null : 'maya');

// ---- UI-level settings (PATCH /v1/project/settings and friends) -------------
export function setTheme(theme) { persist('pd-theme', theme); setState({ theme }); }
export function setCadence(cadence) {
  persist('pd-cadence', cadence);
  setState(s => ({ cadence, page: cadence === 'flow' && s.page === 'sprints' ? 'board' : s.page }));
}
export function setScope(scope) { persist('pd-scope', scope); setState({ scope }); }
export function setRole(role) { setState({ role }); }
export function setExecProvider(execProvider) { setState({ execProvider }); }
// 'help-board' opens the Help page on the board guide.
export function go(route) {
  const [page, topic] = route.startsWith('help-') ? ['help', route.slice(5)] : [route, null];
  location.hash = route; setState(s => ({ page, open: null, docs: page === 'help' ? topic || s.docs || 'overview' : s.docs }));
}
export function openItem(id, tab = 'detail') { setState({ open: { id, tab } }); }
export function setTab(tab) { setState(s => ({ open: s.open && { ...s.open, tab } })); }
export function closeItem() { setState({ open: null }); }

// ---- Portal -----------------------------------------------------------------
export async function vote(id) { // POST /v1/requests/:id/vote
  patchItem(id, i => ({ voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) }));
}
export async function submitRequest({ title, desc, cat }) { // POST /v1/requests
  const item = {
    id: 'ITR-2' + (60 + Math.floor(Math.random() * 39)), title, desc, cat, votes: 1, voted: true, lane: 'backlog',
    assignee: null, branch: null, pill: 'Unassigned', pillKind: 'idle', impact: 5, effort: 4, bucket: 'backlog',
    submitter: 'lena@northwind.io', days: 0, aiTags: null, signed: {}, project: 'portal',
  };
  setState(s => ({ items: [item].concat(s.items) }));
  return ok(item);
}

// ---- Triage -----------------------------------------------------------------
export async function runTriage() { // POST /v1/triage/run
  setState({ triaging: true });
  await wait(CONFIG.triageMs);
  setState(s => ({ triaging: false, items: s.items.map(i => (i.aiTags ? i : { ...i, aiTags: tagsFor(i) })) }));
}
export function setBucket(id, bucket) { patchItem(id, () => ({ bucket })); } // PATCH /v1/items/:id

// ---- Board ------------------------------------------------------------------
export function moveItem(id, lane) { // PATCH /v1/items/:id
  patchItem(id, i => ({
    lane,
    pill: lane === 'done' ? 'Deployed to staging' : lane === 'staged' ? 'Staged · held for release' : lane === 'backlog' ? 'Unassigned' : i.pill,
    pillKind: lane === 'done' ? 'ok' : lane === 'staged' ? 'hold' : lane === 'backlog' ? 'idle' : i.pillKind,
  }));
}

// ---- Review gate ------------------------------------------------------------
export async function signOff(id, n) { // POST /v1/items/:id/checklist/:n/signoff
  if (getState().role === 'agent') return fail(403, 'Agents cannot sign off on their own output.');
  patchItem(id, i => ({ signed: { ...i.signed, [n]: !i.signed[n] } }));
  return ok();
}
export async function signAll(id, on) {
  if (getState().role === 'agent') return fail(403, 'Agents cannot sign off on their own output.');
  patchItem(id, () => ({ signed: on ? { 0: true, 1: true, 2: true, 3: true } : {} }));
  return ok();
}
export async function advance(id) { // POST /v1/items/:id/advance
  const it = getState().items.find(i => i.id === id);
  if (getState().role === 'agent') return fail(403, 'Agents cannot advance a card past a human gate.');
  if (!gateOf(it).cleared) return fail(409, 'Every checklist item needs a human signature first.');
  const next = nextLane(it.lane);
  moveItem(id, next.id);
  closeItem();
  toast(`${id} moved to ${next.label}`);
  return ok(next);
}

// ---- Activity feed ----------------------------------------------------------
export async function sendPrompt(id, text) { // POST /v1/items/:id/prompts
  feed(id, 'maya', text);
  await wait(900);
  feed(id, 'claude', 'Got it. I will pick that up on the next pass and post what changed here.');
}
export function rebaseWithClaude(id) { // POST /v1/items/:id/rebase
  patchItem(id, () => ({ pill: 'Claude: rebasing onto main', pillKind: 'ai' }));
  feed(id, 'maya', 'Keep the exponential backoff from main. Drop the linear strategy and keep the dead-letter table.');
  setTimeout(() => feed(id, 'claude', 'Rebased onto origin/main and kept exponentialBackoff. Dead-letter table intact. Re-running the suite now.'), 900);
}
export function handleLocally(id) {
  patchItem(id, () => ({ assignee: 'devin', pill: 'Devin: resolving conflict locally', pillKind: 'idle' }));
  feed(id, 'devin', 'Taking this one. I will resolve queue/retry.ts on my machine and push when it builds.');
}

// ---- Work tab: git operations, plan, session ---------------------------------
const GIT0 = { phase: 0, stage: 'idle', steps: [], cursor: 0, revision: 0, lastNote: '', notesOpen: false, collapsed: false, gate: null, summary: '' };
export const gitOf = (state, id) => state.git[id] || GIT0;
const patchGit = (id, fn) => setState(s => ({ git: { ...s.git, [id]: fn(s.git[id] || GIT0) } }));
const timers = {};

export function gitOp(id, label) { // one action per button, see connectors/github.json
  const it = getState().items.find(i => i.id === id);
  const g = gitOf(getState(), id);
  const gi = GIT_PHASES.findIndex(grp => grp.includes(label));
  if (gi !== g.phase) return;
  if (label === 'Start work') {
    feed(id, 'system', `Created branch ${it.branch || 'work/' + id.toLowerCase()} from main.`);
    patchGit(id, x => ({ ...x, phase: 1, stage: hasClaude(it) ? 'plan' : x.stage }));
    return;
  }
  const [who, text] = GIT_LOG[label] || ['system', label];
  feed(id, who, text);
  if (GIT_PHASES[gi][GIT_PHASES[gi].length - 1] === label) patchGit(id, x => ({ ...x, phase: x.phase + 1 }));
}
export function approvePlan(id) { // POST /v1/items/:id/plan/:n/approve
  feed(id, 'maya', 'Approved Claude\'s plan. Go ahead.');
  patchGit(id, x => ({ ...x, stage: 'running', steps: [], cursor: 0, notesOpen: false }));
  patchItem(id, () => ({ pill: 'Claude: coding', pillKind: 'ai' }));
  tick(id);
}
export function revisePlan(id, notes) { // POST /v1/items/:id/plan/:n/revise
  if (!notes.trim()) return { ok: false, message: 'Say what should change. An empty note is just a rejection.' };
  feed(id, 'maya', 'Sent the plan back: ' + notes.trim());
  patchGit(id, x => ({ ...x, revision: x.revision + 1, lastNote: notes.trim(), notesOpen: false }));
  return ok();
}
export const toggleNotes = (id, v) => patchGit(id, x => ({ ...x, notesOpen: v }));
export const toggleCollapse = id => patchGit(id, x => ({ ...x, collapsed: !x.collapsed }));

function pushStep(id, kind, text) {
  patchGit(id, x => ({ ...x, steps: x.steps.concat([{ kind, text, t: x.steps.length * 21 }]) }));
}
function finish(id, skipped) {
  const text = skipped ? 'Opened PR #482 — status endpoint returns partial results (migration skipped)' : SESSION[SESSION.length - 1][1];
  pushStep(id, 'git', text);
  patchGit(id, x => ({ ...x, stage: 'done', summary: 'Completed in 4m 22s — ' + (skipped ? '2' : '3') + ' files changed, PR #482 opened' }));
  patchItem(id, () => ({ pill: 'PR #482 open · ' + (skipped ? '2' : '3') + ' files changed', pillKind: 'wait' }));
  feed(id, 'claude', 'Session finished. PR #482 is open.', skipped
    ? 'routes/status.py           +38 -4\ntests/test_status.py        +61 -0'
    : 'routes/status.py           +38 -4\ntests/test_status.py        +61 -0\nmigrations/0042_status_index.sql +3 -0');
}
function tick(id) {
  clearTimeout(timers[id]);
  timers[id] = setTimeout(() => {
    const g = gitOf(getState(), id);
    if (g.stage !== 'running') return;
    const s = SESSION[g.cursor];
    if (!s) return finish(id, false);
    if (s[0] === 'gate') return patchGit(id, x => ({ ...x, stage: 'paused', gate: s[1] }));
    pushStep(id, s[0], s[1]);
    patchGit(id, x => ({ ...x, cursor: x.cursor + 1 }));
    if (g.cursor + 1 >= SESSION.length) return finish(id, false);
    tick(id);
  }, CONFIG.stepMs);
}
export function decideGate(id, decision) { // POST /v1/items/:id/session/gate/:n
  const g = gitOf(getState(), id);
  if (decision === 'approve') {
    feed(id, 'maya', 'Approved the write to ' + g.gate + '.');
    patchGit(id, x => ({ ...x, stage: 'running', cursor: x.cursor + 1, gate: null }));
    return tick(id);
  }
  feed(id, 'maya', 'Denied the write to ' + g.gate + '.');
  pushStep(id, 'deny', 'Write to ' + g.gate + ' denied by a human');
  patchGit(id, x => ({ ...x, stage: 'waiting', gate: null }));
}
export function resumeSession(id, instruction) { // POST /v1/items/:id/session/resume
  feed(id, 'maya', instruction);
  finish(id, true);
}
export const PLAN_FOR = () => PLAN;
export const laneLabel = id => laneOf(id).label;

// ---- Page guide -------------------------------------------------------------
export const openDocs = page => go('help-' + page);

// ---- Backlog bulk actions: POST /v1/items/bulk {ids, action, value} -----------
const items = n => `${n} ${n === 1 ? 'item' : 'items'}`;
const forIds = (ids, fn) => setState(s => ({ items: s.items.map(i => (ids.includes(i.id) ? { ...i, ...fn(i) } : i)) }));
export function bulkTag(ids, tag) {
  forIds(ids, i => ({ aiTags: Array.from(new Set((i.aiTags || []).concat(tag))) }));
  toast(`${items(ids.length)} tagged '${tag}'`);
}
export function bulkMoveProject(ids, project, name) { forIds(ids, () => ({ project })); toast(`${items(ids.length)} moved to ${name}`); }
export function bulkTriage(ids) { forIds(ids, i => ({ aiTags: tagsFor(i) })); toast(`${items(ids.length)} sent to a triage pass`); }
export function bulkAddToDelivery(ids, deliveryId) {
  setState(s => ({ deliveries: s.deliveries.map(d => (d.id === deliveryId ? { ...d, items: Array.from(new Set(d.items.concat(ids))) } : d)) }));
  toast(`${items(ids.length)} added to ${getState().deliveries.find(d => d.id === deliveryId).name}`);
}

// ---- Deliveries ---------------------------------------------------------------
export function createDelivery({ name, mode, items }) { // POST /v1/deliveries
  const id = 'DLV-' + String(6 + getState().deliveries.length).padStart(2, '0');
  const note = mode === 'gated' ? 'One combined release gate. Everything ships together or nothing does.' : 'Visibility only. Each project ships on its own cadence.';
  setState(s => ({ deliveries: s.deliveries.concat([{ id, name, mode, items, note }]) }));
  return id;
}

// ---- Releases -------------------------------------------------------------------
export function promote(ids) { // after a cleared pre-flight
  forIds(ids, () => ({ lane: 'done', pill: 'Deployed to production', pillKind: 'ok' }));
  toast(`${items(ids.length)} promoted to production`);
}
export const wait2 = wait;

// ---- Sprints ----------------------------------------------------------------
export function createSprint({ name, start, days, goal }) { // POST /v1/sprints
  setState(s => ({
    sprintPast: [{ name: s.sprintActive.name, range: s.sprintActive.range, shipped: s.items.filter(i => i.lane === 'done').length, planned: s.sprintActive.planned }].concat(s.sprintPast),
    sprintActive: { name, range: start + ' · ' + days + ' weeks', days: days * 5, elapsed: 0, planned: 14, goal: goal || 'Not planned yet. Pull from Next in triage.' },
  }));
  toast(name + ' created');
}
export function closeSprint(choice) { // POST /v1/sprints/:id/close {unfinished}
  const open = getState().items.filter(i => !['backlog', 'done'].includes(i.lane));
  if (choice === 'backlog') setState(s => ({ items: s.items.map(i => (['backlog', 'done'].includes(i.lane) ? i : { ...i, lane: 'backlog', pill: 'Unassigned', pillKind: 'idle' })) }));
  setState(s => ({ sprintPast: [{ name: s.sprintActive.name, range: s.sprintActive.range, shipped: s.items.filter(i => i.lane === 'done').length, planned: s.sprintActive.planned }].concat(s.sprintPast),
    sprintActive: { name: 'Sprint ' + (parseInt(s.sprintActive.name.replace(/\D/g, ''), 10) + 1), range: 'Sep 8 – Sep 19', days: s.sprintActive.days, elapsed: 0, planned: 14, goal: 'Not planned yet. Pull from Next in triage.' } }));
  toast(choice === 'backlog' ? `${open.length} items sent back to Backlog` : `${open.length} items carried over`);
}

// ---- Team --------------------------------------------------------------------
export function sendInvite(email, role) { // POST /v1/invites
  setState(s => ({ invites: [{ email, role, sent: 'Invited just now' }].concat(s.invites) }));
}
export const resendInvite = email => setState(s => ({ resent: { ...s.resent, [email]: true } }));
export const revokeInvite = email => setState(s => ({ invites: s.invites.filter(i => i.email !== email) })); // DELETE /v1/invites/:id
export function togglePerm(r, c) { setState(s => ({ perms: s.perms.map((row, i) => (i === r ? row.map((v, j) => (j === c ? !v : v)) : row)) })); }
export function toggleNotif(r, c) { setState(s => ({ notifs: s.notifs.map((row, i) => (i === r ? row.map((v, j) => (j === c ? !v : v)) : row)) })); }

// ---- Agent configuration -------------------------------------------------------
export const editClaudeMd = text => setState({ claudeMd: text, mdSaved: false });
export function commitClaudeMd(seed) { setState({ mdSaved: true }); toast('Committed to main'); } // PUT /v1/projects/:id/claude-md
export const revertClaudeMd = seed => setState({ claudeMd: seed, mdSaved: true });
export const addSkill = (name, body) => setState(s => ({ skills: [[name, body.split('\n')[0] || 'New skill', 'just now']].concat(s.skills) })); // POST .../skills

// ---- Providers -----------------------------------------------------------------
export function saveProvider(key, { apiKey, routed, gateway, endpoint }) { // POST|PATCH /v1/org/providers/:key
  setState(s => ({ providers: { ...s.providers, [key]: { ...s.providers[key], connected: true, key: '••••' + apiKey.slice(-4), routed, gateway,
    endpoint, meta: (key === 'anthropic' ? 'claude-sonnet-4-6' : 'gemini-2.5-pro') + (routed ? ' · via ' + gateway : '') + ' · connected just now' } } }));
  toast(getState().providers[key].name + ' connected');
}
