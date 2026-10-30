import { html, useState } from '../lib/react.js';
import { AUDIT, PEOPLE } from '../data/seed.js';
import { Chip, Avatar, cx } from '../ui.js';

const FILTERS = [['all', 'All actors'], ['claude', 'Claude only'], ['human', 'Humans only']];
const keep = { all: () => true, claude: a => a[0] === 'claude', human: a => a[0] !== 'claude' && a[0] !== 'system' };
const color = who => (who === 'claude' ? 'var(--agent-t)' : who === 'system' ? 'var(--t3)' : 'var(--primary-t)');

export function Activity() {
  const [f, setF] = useState('all');
  const rows = AUDIT.filter(keep[f]);
  return html`<main class="page page--narrow">
    <header class="page-head"><div><span class="eyebrow">Activity</span><h1 class="h1">Every action, human or agent</h1>
      <p class="lede">Append-only. Written by the nostackai audit endpoint on each state transition.</p></div></header>
    <div class="row-wrap" style=${{ marginBottom: 'var(--sp-4)' }}>${FILTERS.map(([v, l]) => html`<${Chip} key=${v} on=${f === v} onClick=${() => setF(v)}>${l}<//>`)}<span class="spacer" /><span class="mono caption">${rows.length} events</span></div>
    <div class="panel audit">${rows.map(([who, action, target, branch, detail, when], i) => html`<div key=${i} class=${cx('audit__row', who === 'claude' && 'is-agent')}>
      <${Avatar} who=${who} size=${28} />
      <div class="grow stack-sm" style=${{ gap: '4px' }}><div class="row-wrap" style=${{ alignItems: 'baseline', gap: '6px' }}><b class="small" style=${{ color: color(who) }}>${PEOPLE[who].name}</b><span class="small">${action}</span>${target && html`<span class="mono caption">${target}</span>`}<span class="spacer" /><span class="mono caption">${when}</span></div>
        ${(branch || detail) && html`<div class="row-wrap">${branch && html`<span class="pathchip mono">${branch}</span>`}${detail && html`<span class="mono caption">${detail}</span>`}</div>`}</div></div>`)}</div></main>`;
}
