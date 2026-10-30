import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { openDocs, closeItem, setTab, openItem, signOff, signAll, advance, sendPrompt, rebaseWithClaude, handleLocally, gitOf } from '../api.js';
import { PEOPLE, CHECKS, ACCEPT, DESCS, DEPENDS } from '../data/seed.js';
import { ownerOf, workersOf, gateOf, laneOf, nextLane, projectOf, feedFor, PILL_TONE } from '../lib/model.js';
import { scoreOf } from '../lib/score.js';
import { Drawer, Tabs, Icon, Button, Badge, Avatar, LaneBadge, ProjectChip, Input, Pill, cx } from '../ui.js';
import { WorkTab } from './work.js';

const WORK_GLYPH = { idle: '', plan: '1', running: '●', paused: '!', waiting: '!', done: '✓' };
const actorTone = who => (who === 'claude' ? 'var(--agent-t)' : who === 'system' ? 'var(--t3)' : 'var(--primary-t)');

function Section({ label, aside, children }) {
  return html`<section class="stack-sm"><div class="row"><span class="label grow">${label}</span>${aside}</div>${children}</section>`;
}

function Workers({ it }) {
  const ws = workersOf(it);
  if (!ws.length) return null;
  return html`<div class="stack-sm"><span class="label">Workers</span><div class="row-wrap">${ws.map(w => html`
    <${Badge} soft key=${w.who} tone=${w.who === 'claude' ? 'agent' : 'primary'}><${Avatar} who=${w.who} size=${18} />${PEOPLE[w.who].name}${w.role && ' · ' + w.role}<//>`)}</div></div>`;
}

function DetailTab({ it, s }) {
  const accept = ACCEPT[it.id] || ['Behaviour matches the description', 'Covered by an automated test', 'Documented where users will look'];
  const deps = DEPENDS[it.id] || [];
  const delivery = s.deliveries.find(d => d.items.includes(it.id));
  return html`
    <${Section} label="Description"><p>${it.desc || DESCS[it.id] || 'No description yet. Triage will draft one from the request.'}</p><//>
    <${Section} label="Acceptance criteria"><div class="stack-sm">${accept.map((c, i) => html`
      <div class="crit" key=${i}><span class="mono caption">${String(i + 1).padStart(2, '0')}</span><span>${c}</span></div>`)}</div><//>
    ${deps.length > 0 && html`<${Section} label="Depends on"><div class="stack-sm">${deps.map(([id, title]) => {
      const d = s.items.find(x => x.id === id);
      return html`<button type="button" class="dep" key=${id} onClick=${() => openItem(id)}>${d && html`<${ProjectChip} project=${projectOf(d)} />`}
        <span class="mono caption">${id}</span><span class="grow small" style=${{ color: 'var(--t1)' }}>${title}</span>${d && html`<${LaneBadge} lane=${d.lane} />`}</button>`;
    })}<p class="caption">A dependency inside the same gated delivery is satisfied by the gate. One outside it is a release-order problem.</p></div><//>`}
    <${Section} label="Origin"><div class="row card" style=${{ padding: 'var(--sp-3) var(--sp-4)' }}>
      <span class="avatar" style=${{ '--sz': '32px', '--h': 300 }}>${it.submitter[0].toUpperCase()}</span>
      <div class="grow stack-sm" style=${{ gap: 0 }}><span class="small truncate" style=${{ color: 'var(--t1)' }}>${it.submitter}</span>
        <span class="caption">Submitted via public portal · ${it.days} days ago</span></div><span class="mono caption">▲ ${it.votes}</span></div><//>
    ${delivery && html`<p class="caption">In delivery <b>${delivery.name}</b> (${delivery.mode}).</p>`}`;
}

function ActivityTab({ it, s }) {
  const [text, setText] = useState('');
  const entries = feedFor(it, s.feeds[it.id]);
  const send = () => { if (!text.trim()) return; sendPrompt(it.id, text.trim()); setText(''); };
  return html`
    ${it.pillKind === 'block' && html`<div class="escalation">
      <div class="row small" style=${{ color: 'var(--red-t)', fontWeight: 600 }}><${Icon} name="alert" size=${16} />Claude escalated this to a human</div>
      <p class="small" style=${{ color: 'var(--red-dim)' }}>My changes to <span class="code">queue/retry.ts</span> overlap a backoff refactor merged to <span class="code">main</span> today. Exponential and linear backoff are incompatible and picking one is a product decision, so I stopped before opening the PR.</p>
      <div class="row-wrap"><${Button} variant="agent-solid" icon="spark" onClick=${() => rebaseWithClaude(it.id)}>Rebase with Claude<//>
        <${Button} variant="ghost" onClick=${() => handleLocally(it.id)}>I'll handle it locally<//></div></div>`}
    <div class="feed">${entries.map(([who, body, time, pre], i) => {
      const p = PEOPLE[who] || PEOPLE.system;
      return html`<div class="feed__row" key=${i}><div class="feed__rail"><${Avatar} who=${who} size=${26} /><span class="feed__line" /></div>
        <div class="feed__main"><div class="row"><b class="small" style=${{ color: actorTone(who) }}>${p.name}</b><span class="mono caption">${time}</span></div>
          <p class="small">${body}</p>${pre && html`<pre class="pre">${pre}</pre>`}</div></div>`;
    })}</div>
    <div class="composer"><${Input} id="prompt-input" value=${text} placeholder="Send a prompt to Claude on this card…" onInput=${e => setText(e.target.value)} onKeyDown=${e => e.key === 'Enter' && send()} />
      <${Button} variant="agent" icon="spark" onClick=${send}>Send<//></div>`;
}

function ReviewTab({ it, s }) {
  const [reason, setReason] = useState(null);
  const gate = gateOf(it); const lane = laneOf(it.lane); const next = nextLane(it.lane);
  const agentRole = s.role === 'agent';
  return html`
    <${Section} label="Review checklist" aside=${html`<span class="mono caption" style=${{ color: 'var(--agent-t)' }}>${gate.n ? `Claude pre-checked ${gate.n} of 4` : 'No agent pre-check yet'}</span>`}>
      <div class="stack-sm">${CHECKS.map(([label, why], i) => {
        const pre = i < gate.n; const signed = !!it.signed[i];
        return html`<div class=${cx('check-row', signed && 'is-signed')} key=${i} onClick=${() => pre && setReason(reason === i ? null : i)} onMouseEnter=${() => pre && setReason(i)} onMouseLeave=${() => setReason(null)}>
          <div class="row"><span class=${cx('ai-box', pre && 'is-on')}><${Icon} name="spark" size=${12} /></span>
            <div class="grow stack-sm" style=${{ gap: 0 }}><span class="small" style=${{ color: 'var(--t1)', fontWeight: 500 }}>${label}</span>
              <span class="caption" style=${{ color: pre ? 'var(--agent-dim)' : undefined }}>${pre ? 'Pre-checked by Claude · tap for reasoning' : 'Not yet checked by the agent'}</span></div>
            <${Button} variant="ghost" size="sm" class=${cx('signbtn', signed && 'is-on')} off=${agentRole} title=${agentRole ? 'Agents cannot sign off' : ''}
              icon=${signed ? 'check' : null} onClick=${e => { e.stopPropagation(); signOff(it.id, i); }}>${signed ? 'Signed' : 'Sign off'}<//></div>
          ${pre && reason === i && html`<div class="callout callout--agent tone-agent"><span class="label" style=${{ color: 'var(--agent-t)' }}>Claude's reasoning</span><div style=${{ marginTop: '4px' }}>${why}</div></div>`}</div>`;
      })}</div><//>
    ${gate.n > 0 && html`<div class=${cx('gate', gate.cleared && 'is-clear')}>
      <div class="row"><${Icon} name=${gate.cleared ? 'check' : 'lock'} size=${18} /><b class="h3">${gate.cleared ? 'Cleared to advance' : 'Human sign-off required'}</b></div>
      <p class="small">${gate.cleared ? 'All checklist items carry a human signature. Moving this card writes a transition event to the audit log.'
        : `Claude has pre-checked its work, but a person on the team has to sign each item before this card can leave ${lane.label}. Agents cannot sign off on their own output.`}</p>
      <div class="row-wrap"><${Button} variant="success" off=${!gate.cleared} onClick=${() => advance(it.id)}>Advance to ${next.label}<//>
        <${Button} variant="ghost" onClick=${() => signAll(it.id, gate.signed < 4)}>${gate.signed === 4 ? 'Clear all signatures' : 'Sign off all 4'}<//></div></div>`}
    ${gate.n === 0 && html`<p class="caption">This card has not been worked on yet, so there is nothing to sign off.</p>`}`;
}

export function ItemDrawer() {
  const s = useStore();
  const { id, tab } = s.open;
  const it = s.items.find(i => i.id === id);
  if (!it) return null;
  const owner = ownerOf(it); const gate = gateOf(it);
  const delivery = s.deliveries.find(d => d.items.includes(it.id));
  const feedCount = feedFor(it, s.feeds[it.id]).length;
  const tabs = [
    { id: 'detail', label: 'Detail' },
    { id: 'work', label: 'Work', badge: WORK_GLYPH[gitOf(s, it.id).stage] },
    { id: 'activity', label: 'Activity', badge: feedCount },
    { id: 'review', label: 'Review', badge: gate.n ? `${gate.signed}/4` : '' },
  ];
  return html`<${Drawer} onClose=${closeItem}>
    <div class="drawer__head">
      <div class="row-wrap"><span class="mono caption">${it.id}</span><${LaneBadge} lane=${it.lane} /><${ProjectChip} project=${projectOf(it)} full />
        ${delivery && html`<${Badge} tone=${delivery.mode === 'gated' ? 'warn' : 'teal'}><${Icon} name=${delivery.mode === 'gated' ? 'lock' : 'circle'} size=${11} />${delivery.mode}<//>`}
        <span class="spacer" /><${Button} variant="bare" size="sm" iconOnly icon="book" aria-label="About this drawer" title="About this drawer" onClick=${() => openDocs('drawer')} /><${Button} variant="bare" size="sm" iconOnly icon="x" aria-label="Close" onClick=${closeItem} /></div>
      <h2 class="h2">${it.title}</h2>
      <div class="meta-grid">
        <div><span class="label">Owner</span><span class="row small"><${Avatar} who=${owner} size=${24} /><span class="truncate">${owner ? PEOPLE[owner].name : 'Unassigned'}</span></span></div>
        <div><span class="label">Branch</span><span class=${cx('mono caption truncate', it.branch && 'branch')} style=${{ maxWidth: 'none' }}>${it.branch || 'none yet'}</span></div>
        <div><span class="label">Priority</span><span><b class="mono h3">${scoreOf(it)}</b> <span class="mono caption">/ 100 · ▲${it.votes}</span></span></div></div>
      <${Workers} it=${it} />
      <div><${Pill} kind=${it.pillKind}>${it.pill}<//></div>
    </div>
    <div class="drawer__tabs"><${Tabs} tabs=${tabs} value=${tab} onChange=${setTab} /></div>
    <div class="drawer__body">
      ${tab === 'detail' && html`<${DetailTab} it=${it} s=${s} />`}
      ${tab === 'work' && html`<${WorkTab} it=${it} s=${s} />`}
      ${tab === 'activity' && html`<${ActivityTab} it=${it} s=${s} />`}
      ${tab === 'review' && html`<${ReviewTab} it=${it} s=${s} />`}
    </div><//>`;
}
