// Pure derivations over items. No state, no DOM.
import { CREW, LANES, PROJECTS, GROUPS, ACTS } from '../data/seed.js';
import { CONFIG } from '../config.js';

export const laneOf = id => LANES.find(l => l.id === id) || LANES[0];
export const projectOf = it => PROJECTS.find(p => p.id === it.project) || PROJECTS[0];

export function ownerOf(it) {
  if (CREW[it.id]) return CREW[it.id][0];
  return it.assignee && it.assignee !== 'claude' ? it.assignee : (it.assignee === 'claude' ? 'maya' : null);
}
export function workersOf(it) {
  if (CREW[it.id]) return CREW[it.id][1].map(([who, role]) => ({ who, role }));
  return it.assignee ? [{ who: it.assignee, role: '' }] : [];
}
export const hasClaude = it => workersOf(it).some(w => w.who === 'claude') || it.assignee === 'claude';

// How many checklist rows Claude has pre-checked depends on how far along the card is.
export function checkedCount(it) {
  if (it.lane === 'backlog' || it.lane === 'assigned') return 0;
  return it.lane === 'inprogress' ? 2 : 4;
}
export function gateOf(it) {
  const n = checkedCount(it);
  const signed = [0, 1, 2, 3].filter(i => it.signed[i]).length;
  const gated = CONFIG.requireHumanSignoff && n > 0;
  return { n, signed, gated, cleared: !gated || signed === 4 };
}
export const nextLane = id => LANES[Math.min(LANES.findIndex(l => l.id === id) + 1, LANES.length - 1)];

export function scopeProjectIds(scope) {
  if (scope === 'all') return PROJECTS.map(p => p.id);
  const g = GROUPS.find(x => x.id === scope);
  return g ? g.projects : [scope];
}
export const inScope = (scope, it) => scopeProjectIds(scope).includes(it.project);
export const scopeSpansMany = scope => scopeProjectIds(scope).length > 1;
export function scopeName(scope) {
  if (scope === 'all') return 'All projects';
  return (GROUPS.find(g => g.id === scope) || PROJECTS.find(p => p.id === scope) || {}).name || 'All projects';
}

// Portal status is derived from the lane.
export function portalStatus(it) {
  if (it.lane === 'done') return { label: 'Shipped', tone: 'green' };
  if (it.lane === 'backlog') return { label: 'Under review', tone: 'neutral' };
  if (it.lane === 'assigned') return { label: 'Planned', tone: 'primary' };
  return { label: 'In progress', tone: 'agent' };
}

export const PILL_TONE = { ai: 'agent', block: 'red', wait: 'info', ok: 'green', hold: 'teal', idle: 'neutral' };

export function feedFor(it, extra) {
  const base = ACTS[it.id] || [
    ['maya', 'Moved to ' + laneOf(it.lane).label + '.', '2d ago', null],
    [it.assignee === 'claude' ? 'claude' : (it.assignee || 'system'), it.assignee ? 'Picked this up. Branch ' + (it.branch || 'not created yet') + '.' : 'Waiting in the queue.', '1d ago', null],
  ];
  return base.concat(extra || []);
}
