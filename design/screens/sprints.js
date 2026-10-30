import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { createSprint, closeSprint } from '../api.js';
import { BURN } from '../data/seed.js';
import { Button, Modal, Field, Input, Textarea, Segmented, cx } from '../ui.js';

function CreateModal({ s, onClose }) {
  const [name, setName] = useState('Sprint ' + (parseInt(s.sprintActive.name.replace(/\D/g, ''), 10) + 1)); const [start, setStart] = useState('2026-09-08');
  const [dur, setDur] = useState(2); const [goal, setGoal] = useState(''); const [err, setErr] = useState('');
  const save = () => { if (name.trim().length < 3) return setErr('Name the sprint with at least 3 characters.'); createSprint({ name: name.trim(), start, days: dur, goal }); onClose(); };
  return html`<${Modal} title="Create sprint" width=${500} onClose=${onClose} footer=${html`<span class="mono caption hint hide-sm">POST /v1/sprints</span><${Button} onClick=${onClose}>Cancel<//><${Button} variant="primary" onClick=${save}>Create sprint<//>`}>
    <${Field} label="Name" id="sp-name" error=${err}><${Input} id="sp-name" value=${name} bad=${!!err} onInput=${e => { setName(e.target.value); setErr(''); }} /><//>
    <${Field} label="Start date" id="sp-start"><${Input} id="sp-start" mono value=${start} onInput=${e => setStart(e.target.value)} /><//>
    <${Field} label="Duration"><${Segmented} label="Duration" value=${dur} onChange=${setDur} options=${[[1, '1w'], [2, '2w'], [3, '3w'], [4, '4w']]} /><//>
    <${Field} label="Sprint goal" id="sp-goal"><${Textarea} id="sp-goal" rows="3" value=${goal} placeholder="What should be true when this sprint ends?" onInput=${e => setGoal(e.target.value)} /><//><//>`;
}

function CloseModal({ s, open, shipped, onClose }) {
  const [choice, setChoice] = useState('next');
  const opts = [['next', 'Move to the next sprint', 'Unfinished cards keep their column and carry over. Branches stay open.'], ['backlog', 'Send back to Backlog', 'Cards return to intake and lose their sprint assignment. Branches are left for cleanup.']];
  return html`<${Modal} title=${'Close ' + s.sprintActive.name} width=${480} onClose=${onClose}
    footer=${html`<${Button} onClick=${onClose}>Cancel<//><${Button} variant="warn" onClick=${() => { closeSprint(choice); onClose(); }}>Close sprint · ${choice === 'next' ? 'move' : 'send back'} ${open} items<//>`}>
    <p>${shipped} of ${s.sprintActive.planned} committed items shipped. ${open} are still open.</p>
    <div class="stack-sm">${opts.map(([v, l, t]) => html`<button type="button" key=${v} class=${cx('radio-card', choice === v && 'is-on')} onClick=${() => setChoice(v)}><b class="small">${l}</b><span class="caption">${t}</span></button>`)}</div><//>`;
}

export function Sprints() {
  const s = useStore(); const [modal, setModal] = useState(null);
  const a = s.sprintActive, shipped = BURN[Math.min(a.elapsed, BURN.length - 1)], planned = a.planned;
  const flight = Math.min(s.items.filter(i => ['assigned', 'inprogress', 'review', 'testing', 'staged'].includes(i.lane)).length, planned - shipped);
  const blocked = s.items.filter(i => i.pillKind === 'block').length, open = planned - shipped, left = a.days - a.elapsed;
  const rate = a.elapsed ? shipped / a.elapsed : 0, short = Math.max(0, Math.round(planned - (shipped + rate * left)));
  const pct = Math.round(shipped / planned * 100), flightPct = Math.min(100 - pct, Math.round(flight / planned * 100));
  const label = s.cadence === 'flow' ? '2-week' : s.cadence + '-week';
  return html`<main class="page page--narrow" style=${{ maxWidth: '1000px' }}>
    <header class="page-head"><div><span class="eyebrow">Sprints · ${label} cadence</span><h1 class="h1">Sprint planning</h1></div><${Button} variant="primary" size="lg" icon="plus" onClick=${() => setModal('create')}>Create sprint<//></header>
    <section class="panel sprint">
      <div class="row-wrap"><span class="api-dot" /><h2 class="h2">${a.name}</h2><span class="mono caption">${a.range}</span><span class="spacer" /><span class="mono caption">${left} of ${a.days} days left</span></div>
      <p class="small" style=${{ maxWidth: '640px' }}>${a.goal}</p>
      <div class="row"><div class="prog grow"><i style=${{ width: pct + '%', background: 'var(--green)' }} /><i style=${{ width: flightPct + '%', background: 'color-mix(in oklch, var(--primary) 45%, transparent)' }} /></div><span class="mono caption">${pct}%</span></div>
      <div class="row-wrap stats"><span><b class="mono" style=${{ color: 'var(--green-t)' }}>${shipped}</b> shipped</span><span><b class="mono" style=${{ color: 'var(--primary-t)' }}>${flight}</b> in flight</span><span><b class="mono">${planned}</b> committed</span><span><b class="mono" style=${{ color: 'var(--red-t)' }}>${blocked}</b> blocked</span></div>
      <div class="row-wrap sprint__foot"><span class="small muted grow">${open} items still open with ${left} days left. ${short ? `Projected finish: ${short} items short of the commitment.` : 'On pace to finish the commitment.'}</span>
        <${Button} variant="danger-ghost" onClick=${() => setModal('close')}>Close sprint<//></div></section>
    <h2 class="h3" style=${{ margin: 'var(--sp-7) 0 var(--sp-3)' }}>Past sprints</h2>
    <div class="panel">${s.sprintPast.map(p => { const met = p.shipped >= p.planned; return html`<div class="past" key=${p.name}><b class="small">${p.name}</b><span class="mono caption">${p.range}</span><span class="small muted grow">${p.shipped} of ${p.planned} shipped</span>
      <span class="vbar"><i style=${{ width: Math.round(p.shipped / p.planned * 100) + '%', background: met ? 'var(--green)' : 'var(--primary)' }} /></span><span class="mono caption">${p.shipped}</span></div>`; })}</div>
    ${modal === 'create' && html`<${CreateModal} s=${s} onClose=${() => setModal(null)} />`}
    ${modal === 'close' && html`<${CloseModal} s=${s} open=${open} shipped=${shipped} onClose=${() => setModal(null)} />`}</main>`;
}
