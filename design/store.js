// One observable store. Components call useStore() and re-render on change.
// In the React port this becomes server state (queries) plus a small UI store.
import { useState, useEffect } from './lib/react.js';
import { RAW, BACKLOG, ITEM_PROJECT, DELIVERIES, GROUPS, PROVIDERS_SEED, SPRINT_ACTIVE, SPRINT_PAST, INVITES, PERMS, NOTIFS, CLAUDE_MD_SEED, SKILLS_SEED } from './data/seed.js';
import { tagsFor } from './lib/score.js';

const read = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
export const persist = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };

const raw = RAW.map(r => ({
  id: r[0], title: r[1], cat: r[2], votes: r[3], lane: r[4], assignee: r[5], branch: r[6],
  pill: r[7], pillKind: r[8], impact: r[9], effort: r[10], bucket: r[11], submitter: r[12], days: r[13],
  voted: false, signed: {}, project: ITEM_PROJECT[r[0]] || 'studio',
  aiTags: r[4] === 'backlog' ? null : tagsFor({ cat: r[2], impact: r[9], effort: r[10], assignee: r[5] }),
}));
const synthetic = BACKLOG.map(b => ({
  ...b, aiTags: tagsFor(b),
}));

let state = {
  theme: read('pd-theme', 'system'),
  page: (location.hash || '#board').slice(1).startsWith('help') ? 'help' : (location.hash || '#board').slice(1),
  role: 'owner',                       // requester | owner | agent
  cadence: read('pd-cadence', 'flow'), // flow | 1 | 2 | 3 | 4
  scope: read('pd-scope', 'all'),
  execProvider: 'anthropic',
  providers: JSON.parse(JSON.stringify(PROVIDERS_SEED)),
  groups: GROUPS,
  deliveries: DELIVERIES,
  items: raw.concat(synthetic),
  feeds: {},          // extra feed entries per item, appended after the seed feed
  git: {},            // per-item Work tab state
  open: null,         // { id, tab }
  toast: '',
  sprintActive: SPRINT_ACTIVE, sprintPast: SPRINT_PAST, invites: INVITES, resent: {},
  perms: PERMS.map(p => p[2].slice()), notifs: NOTIFS.map(n => n[2].slice()),
  claudeMd: CLAUDE_MD_SEED, mdSaved: true, skills: SKILLS_SEED.slice(),
  docs: location.hash.startsWith('#help-') ? location.hash.slice(6) : null, // topic shown on the Help page
  triaging: false,
};

const subs = new Set();
export const getState = () => state;
export function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  subs.forEach(f => f());
}
export function useStore() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force(n => n + 1); subs.add(f); return () => subs.delete(f); }, []);
  return state;
}
