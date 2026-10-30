import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { runTriage, setBucket, openItem } from '../api.js';
import { inScope } from '../lib/model.js';
import { scoreParts, TAG_TONE } from '../lib/score.js';
import { go } from '../api.js';
import { RunButton, Tag, Icon, useHoverTap, cx } from '../ui.js';

const COLS = [['backlog', 'Backlog', 'later maybe'], ['next', 'Next', 'this sprint'], ['later', 'Later', 'parked']];
const SHOWN = 6;

function Breakdown({ it }) {
  const p = scoreParts(it);
  const rows = [[`Votes (${it.votes})`, p.votes, 45, 'var(--primary)'], [`AI impact (${it.impact}/10)`, p.impact, 32, 'var(--agent)'], [`AI review effort (${it.effort}/10)`, p.effort, 16, 'var(--green)']];
  return html`<div class="tooltip" onClick=${e => e.stopPropagation()}>
    <span class="label" style=${{ color: 'var(--agent-t)' }}>Score breakdown</span>
    ${rows.map(([l, v, max, c]) => html`<div class="stack-sm" style=${{ gap: '5px' }} key=${l}>
      <div class="row small"><span class="muted grow">${l}</span><b class="mono" style=${{ color: 'var(--t1)' }}>+${v}</b></div>
      <div class="bar" style=${{ '--c': c }}><i style=${{ width: (v / max * 100) + '%' }} /></div></div>`)}
    <hr class="hr" /><div class="row small"><span class="muted grow">Composite</span><b class="mono" style=${{ color: 'var(--t1)' }}>${p.total} / 100</b></div>
    <div class="callout callout--agent">Review effort is my estimate of the human verification burden once the work is done: diff size, blast radius, and how much of it a person has to read to sign off. It is not how long I take to build it.</div></div>`;
}

function TriageCard({ it, dragging, onDragStart, onDragEnd }) {
  const [tip, bind] = useHoverTap();
  const total = scoreParts(it).total;
  return html`<div class=${cx('tcard', dragging && 'is-drag')} draggable="true" onDragStart=${() => onDragStart(it.id)} onDragEnd=${onDragEnd} onClick=${() => openItem(it.id)}>
    <div class="row" style=${{ alignItems: 'flex-start' }}>
      <div class="grow stack-sm" style=${{ gap: '3px' }}><span class="mono caption">${it.id}</span><span class="small" style=${{ color: 'var(--t1)', fontWeight: 500 }}>${it.title}</span></div>
      <div style=${{ position: 'relative' }}>
        <div class=${cx('score', total >= 70 && 'is-hot')} role="button" tabindex="0" aria-label=${'Score ' + total + ', show breakdown'} ...${bind}><b>${total}</b><span>AI</span></div>
        ${tip && html`<${Breakdown} it=${it} />`}</div></div>
    <div class="row-wrap"><span class="mono caption">▲ ${it.votes}</span>${(it.aiTags || []).map(t => html`<${Tag} key=${t} tone=${TAG_TONE[t] || 'neutral'}>${t}<//>`)}</div></div>`;
}

export function Triage() {
  const s = useStore();
  const [dragId, setDragId] = useState(null); const [over, setOver] = useState(null);
  const pool = s.items.filter(i => i.lane === 'backlog' && inScope(s.scope, i));
  const unlabelled = pool.filter(i => !i.aiTags).length;
  const col = b => pool.filter(i => i.bucket === b).sort((a, c) => scoreParts(c).total - scoreParts(a).total);
  const note = s.triaging ? 'POST /v1/triage/run' : unlabelled ? `${unlabelled} items have no AI labels` : 'All items labelled';

  return html`<main class="page">
    <header class="page-head">
      <div><span class="eyebrow">Triage</span><h1 class="h1">Score, label and slot the queue</h1>
        <p class="lede">Claude estimates impact and review effort. You decide what goes next. Drag a card to move it, or tap it to open.</p></div>
      <div class="row-wrap"><span class="mono caption" style=${{ color: unlabelled && !s.triaging ? 'var(--warn-dim)' : undefined }}>${note}</span>
        <${RunButton} running=${s.triaging} idleLabel=${unlabelled ? 'Ask Claude to triage' : 'Re-run triage'} runLabel="Claude is triaging…" onClick=${runTriage} /></div>
    </header>
    <div class="tri-grid">${COLS.map(([id, label, hint]) => {
      const items = col(id);
      return html`<section key=${id} class=${cx('col', over === id && 'is-over')} onDragOver=${e => { e.preventDefault(); setOver(id); }} onDragLeave=${() => setOver(null)}
        onDrop=${() => { if (dragId) setBucket(dragId, id); setDragId(null); setOver(null); }}>
        <div class="col__head"><span class="h3 grow">${label}</span><span class="mono caption">${items.length}</span><span class="caption hide-sm">${hint}</span></div>
        <div class="col__body">${items.slice(0, SHOWN).map(it => html`<${TriageCard} key=${it.id} it=${it} dragging=${dragId === it.id} onDragStart=${setDragId} onDragEnd=${() => { setDragId(null); setOver(null); }} />`)}
          ${items.length > SHOWN && html`<button type="button" class="col__more" onClick=${() => go('backlog')}>${items.length - SHOWN} more in Backlog →</button>`}
          ${!items.length && html`<span class="caption" style=${{ textAlign: 'center', padding: '24px 0' }}>Drop a card here</span>`}</div></section>`;
    })}</div></main>`;
}
