import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { createDelivery, openItem, wait2, promote } from '../api.js';
import { PROJECTS } from '../data/seed.js';
import { CROSS } from '../data/phase2.js';
import { projectOf, ownerOf } from '../lib/model.js';
import { Icon, Button, Badge, Pill, Avatar, LaneBadge, ProjectChip, Modal, Field, Input, Checkbox, RunButton, cx } from '../ui.js';
import { PreflightRows, PreflightGate } from './preflight.js';

const MODES = [['gated', 'Gated', 'ships together, one combined release gate'], ['rollup', 'Rollup', 'ships independently, this is a visibility view only']];
const itemsOf = (s, d) => d.items.map(id => s.items.find(i => i.id === id)).filter(Boolean);

function DeliveryCard({ s, d, onOpen }) {
  const its = itemsOf(s, d), projs = [...new Set(its.map(i => i.project))], blocked = its.some(i => i.pillKind === 'block'), gated = d.mode === 'gated';
  return html`<button type="button" class=${cx('card card--hover dcard', gated && 'is-gated')} onClick=${onOpen}>
    <div class="row"><span class="mono caption grow">${d.id}</span><${Badge} tone=${gated ? 'warn' : 'teal'}><${Icon} name=${gated ? 'lock' : 'circle'} size=${11} />${d.mode}<//></div>
    <h3 class="h3" style=${{ textAlign: 'left' }}>${d.name}</h3><p class="small muted" style=${{ textAlign: 'left' }}>${d.note}</p>
    <div class="row-wrap dcard__foot">${projs.map(p => html`<${ProjectChip} key=${p} project=${p} />`)}${blocked && html`<${Badge} tone="red">blocked<//>`}<span class="spacer" /><span class="mono caption">${its.length} items</span></div></button>`;
}

function Rollup({ s, d }) {
  const its = itemsOf(s, d), projs = [...new Set(its.map(i => i.project))];
  return html`<div class="stack"><div class="roll-grid">${projs.map(pid => { const mine = its.filter(i => i.project === pid); return html`<section class="col" key=${pid}>
    <div class="col__head"><${ProjectChip} project=${pid} /><b class="small grow" style=${{ color: 'var(--t1)' }}>${PROJECTS.find(p => p.id === pid).name}</b><span class="mono caption">${mine.length}</span></div>
    <div class="col__body">${mine.map(i => html`<button type="button" class="bcard" key=${i.id} onClick=${() => openItem(i.id)}><div class="row"><span class="mono caption grow">${i.id}</span><${LaneBadge} lane=${i.lane} /><${Avatar} who=${ownerOf(i)} size=${22} /></div>
      <span class="bcard__title">${i.title}</span><div><${Pill} kind=${i.pillKind}>${i.pill}<//></div></button>`)}</div></section>`; })}</div>
    <${Empty2} /></div>`;
}
const Empty2 = () => html`<div class="callout tone-teal">Rollup has no combined gate. Each project releases on its own cadence; this view exists so one person can see the whole set without opening several boards.</div>`;

function Gated({ s, d }) {
  const [pf, setPf] = useState('idle');
  const its = itemsOf(s, d);
  const rows = its.map(i => { const c = CROSS[i.id] || ['clean', 'No shared paths with the rest of the delivery.', [projectOf(i).short.toLowerCase() + ': ' + (i.branch || 'branch')], 'Nothing in the combined change-set touches the same files. Order does not matter for this one.']; return { id: i.id, title: i.title, verdict: c[0] === 'conflict' ? 'overlap' : 'clean', verdictLabel: c[0] === 'conflict' ? 'cross-project overlap' : 'clean', assess: c[1], paths: c[2], reasoning: c[3] }; });
  const conflicts = rows.filter(r => r.verdict !== 'clean').length;
  const run = async () => { setPf('run'); await wait2(2200); setPf('done'); };
  return html`<div class="stack">
    <div class="row-wrap"><span class="mono caption grow">${pf === 'done' && conflicts ? `${conflicts} conflicts found across projects` : 'Pooled change-set: evaluated as one release'}</span>
      <${RunButton} running=${pf === 'run'} idleLabel=${pf === 'done' ? 'Re-run pre-flight' : 'Run pre-flight check'} runLabel="Claude is checking…" onClick=${run} /></div>
    <div class="panel pool">${its.map(i => html`<button type="button" class="pool__row" key=${i.id} onClick=${() => openItem(i.id)}><${ProjectChip} project=${projectOf(i)} /><span class="mono caption">${i.id}</span><span class="small grow truncate" style=${{ color: 'var(--t1)' }}>${i.title}</span>
      <span class="hide-sm"><${LaneBadge} lane=${i.lane} /></span><span class="hide-md"><${Pill} kind=${i.pillKind}>${i.pill}<//></span><${Avatar} who=${ownerOf(i)} size=${24} /></button>`)}</div>
    ${pf === 'done' && html`<section class="panel preflight stack"><div class="row-wrap"><h2 class="h3 grow">Cross-project pre-flight</h2><span class="mono caption">POST /v1/deliveries/${d.id}/preflight</span></div>
      <${PreflightRows} rows=${rows} /><${PreflightGate} conflicts=${conflicts} count=${its.length} clearedTitle="Cleared to release" promoteLabel=${n => `Release ${n} items`}
        onPromote=${() => { promote(its.map(i => i.id)); setPf('idle'); }} onDismiss=${() => setPf('idle')} /></section>`}</div>`;
}

function CreateModal({ s, onClose, onMade }) {
  const [name, setName] = useState(''); const [mode, setMode] = useState('gated'); const [pick, setPick] = useState({}); const [err, setErr] = useState('');
  const cands = s.items.filter(i => i.lane !== 'backlog' && i.lane !== 'done'); const picks = Object.keys(pick).filter(k => pick[k]);
  const save = () => { if (name.trim().length < 3) return setErr('Give the delivery a name of at least 3 characters.'); if (!picks.length) return setErr('Pick at least one item.'); onMade(createDelivery({ name: name.trim(), mode, items: picks })); };
  return html`<${Modal} title="Create delivery" width=${560} onClose=${onClose} footer=${html`<span class="mono caption hint hide-sm">POST /v1/deliveries</span><${Button} onClick=${onClose}>Cancel<//><${Button} variant="primary" onClick=${save}>Create delivery<//>`}>
    <${Field} label="Name" id="dlv-name" error=${err}><${Input} id="dlv-name" value=${name} bad=${!!err} placeholder="Q4 billing changes" onInput=${e => { setName(e.target.value); setErr(''); }} /><//>
    <${Field} label="Mode"><div class="mode-cards">${MODES.map(([v, l, t]) => html`<button type="button" key=${v} class=${cx('radio-card', mode === v && 'is-on')} onClick=${() => setMode(v)}><b class="small">${l}</b><span class="caption">${t}</span></button>`)}</div><//>
    <${Field} label=${`Items · ${picks.length} selected`}><div class="pick-list">${cands.map(i => html`<label class="pick" key=${i.id}><${Checkbox} checked=${!!pick[i.id]} onChange=${() => setPick({ ...pick, [i.id]: !pick[i.id] })} /><${ProjectChip} project=${projectOf(i)} /><span class="mono caption">${i.id}</span><span class="small truncate">${i.title}</span></label>`)}</div><//><//>`;
}

export function Deliveries() {
  const s = useStore();
  const [open, setOpen] = useState(null); const [modal, setModal] = useState(false);
  const d = open && s.deliveries.find(x => x.id === open);
  if (d) return html`<main class="page"><div class="stack">
    <div><${Button} variant="bare" size="sm" onClick=${() => setOpen(null)}>← All deliveries<//></div>
    <header class="page-head"><div><span class="eyebrow">${d.id} · ${d.mode}</span><h1 class="h1">${d.name}</h1><p class="lede">${d.note}</p></div></header>
    ${d.mode === 'gated' ? html`<${Gated} s=${s} d=${d} key=${d.id} />` : html`<${Rollup} s=${s} d=${d} />`}</div></main>`;
  return html`<main class="page page--narrow" style=${{ maxWidth: '1000px' }}>
    <header class="page-head"><div><span class="eyebrow">Deliveries</span><h1 class="h1">Release-scoped change-sets</h1>
      <p class="lede">A group is a standing set of projects. A delivery is a changing set of items, from any project, that ships together or is watched together.</p></div>
      <${Button} variant="primary" size="lg" icon="plus" onClick=${() => setModal(true)}>Create delivery<//></header>
    <div class="dlv-grid">${s.deliveries.map(x => html`<${DeliveryCard} key=${x.id} s=${s} d=${x} onOpen=${() => setOpen(x.id)} />`)}</div>
    ${modal && html`<${CreateModal} s=${s} onClose=${() => setModal(false)} onMade=${id => { setModal(false); setOpen(id); }} />`}</main>`;
}
