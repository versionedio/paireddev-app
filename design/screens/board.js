import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { moveItem, openItem, go } from '../api.js';
import { LANES } from '../data/seed.js';
import { CONFIG } from '../config.js';
import { inScope, ownerOf, workersOf, gateOf, projectOf, scopeSpansMany } from '../lib/model.js';
import { scoreOf } from '../lib/score.js';
import { Icon, Button, Pill, Avatar, AvatarStack, ProjectChip, Menu, Badge, LaneDot, cx } from '../ui.js';

const BACKLOG_SHOWN = 9;

function MoveMenu({ it }) {
  const [open, setOpen] = useState(false);
  return html`<span style=${{ position: 'relative', display: 'inline-flex' }} onClick=${e => e.stopPropagation()}>
    <${Button} variant="bare" size="sm" iconOnly icon="more" aria-label=${'Move ' + it.id} onClick=${() => setOpen(true)} />
    ${open && html`<${Menu} style=${{ right: 0, top: '34px' }} onClose=${() => setOpen(false)}
      items=${[{ label: 'Move to…' }].concat(LANES.filter(l => l.id !== it.lane).map(l => ({ label: l.label, node: html`<${LaneDot} lane=${l.id} />${l.label}`, run: () => moveItem(it.id, l.id) })))} />`}</span>`;
}

function BoardCard({ it, many, dragging, onDragStart, onDragEnd }) {
  const owner = ownerOf(it); const workers = workersOf(it).map(w => w.who);
  const gate = gateOf(it); const sc = scoreOf(it); const blocked = it.pillKind === 'block';
  return html`<div class=${cx('bcard', blocked && 'is-blocked', dragging && 'is-drag')} draggable="true" role="button" tabindex="0"
    onDragStart=${() => onDragStart(it.id)} onDragEnd=${onDragEnd} onClick=${() => openItem(it.id)} onKeyDown=${e => e.key === 'Enter' && openItem(it.id)}>
    ${blocked && html`<div class="bcard__conflict"><${Icon} name="alert" size=${14} />Merge conflict · needs human</div>`}
    <div class="bcard__top"><div class="row-wrap">
      <span class="mono caption">${it.id}</span>
      ${it.assignee === 'claude' && html`<${Badge} tone="agent"><${Icon} name="spark" size=${10} />agent<//>`}
      ${many && html`<${ProjectChip} project=${projectOf(it)} />`}
      </div><div class="row">${CONFIG.showAiScore && html`<span class=${cx('mini-score', sc >= 70 && 'is-hot')}>${sc}</span>`}<${MoveMenu} it=${it} /></div></div>
    <div class="bcard__title">${it.title}</div>
    <div><${Pill} kind=${it.pillKind}>${it.pill}<//></div>
    <div class="bcard__foot"><${Avatar} who=${owner} size=${24} />
      ${workers.length > 0 && html`<${AvatarStack} people=${workers} size=${20} />`}
      <span class=${cx('branch truncate', !it.branch && 'faint')}>${it.branch || 'no branch'}</span>
      <span class="spacer" />
      ${gate.n > 0 && html`<span class="mono caption nowrap" style=${{ color: gate.signed === 4 ? 'var(--green-t)' : undefined }}>${gate.signed}/4 ✓</span>`}</div></div>`;
}

export function Board() {
  const s = useStore();
  const [dragId, setDragId] = useState(null); const [over, setOver] = useState(null);
  const scoped = s.items.filter(i => inScope(s.scope, i));
  const many = scopeSpansMany(s.scope);
  const inFlight = scoped.filter(i => i.lane !== 'done' && i.lane !== 'backlog').length;
  const cadenceLabel = s.cadence === 'flow' ? 'Flow' : 'Sprint 24';

  return html`<main style=${{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
    <div class="board-toolbar">
      <h1 class="h2">Iteration board</h1><span class="mono caption">${cadenceLabel} · ${inFlight} in flight</span><span class="spacer" />
      <div class="row-wrap hide-sm">
        <${Badge} tone="primary" soft>Human action<//><${Badge} tone="agent" soft>Claude action<//><${Badge} tone="red" soft>Needs escalation<//></div></div>
    <div class="board-scroll"><div class="board-track">${LANES.map(l => {
      const all = scoped.filter(i => i.lane === l.id).sort((a, b) => scoreOf(b) - scoreOf(a));
      const shown = l.id === 'backlog' ? all.slice(0, BACKLOG_SHOWN) : all;
      const wipHot = l.wip.includes('max') && all.length > 3;
      return html`<section key=${l.id} class=${cx('col board-col', over === l.id && 'is-over')} onDragOver=${e => { e.preventDefault(); setOver(l.id); }} onDragLeave=${() => setOver(null)}
        onDrop=${() => { if (dragId) moveItem(dragId, l.id); setDragId(null); setOver(null); }}>
        <div class="col__head"><${LaneDot} lane=${l.id} /><span class="text-lead grow">${l.label}</span>
          <span class="mono caption">${all.length}</span>${l.wip && html`<span class="mono caption" style=${{ color: wipHot ? 'var(--red-t)' : undefined }}>${l.wip}</span>`}</div>
        <div class="col__body">${shown.map(it => html`<${BoardCard} key=${it.id} it=${it} many=${many} dragging=${dragId === it.id} onDragStart=${setDragId} onDragEnd=${() => { setDragId(null); setOver(null); }} />`)}
          ${l.id === 'backlog' && all.length > BACKLOG_SHOWN && html`<button type="button" class="col__more" onClick=${() => go('backlog')}>${all.length - BACKLOG_SHOWN} more in Backlog →</button>`}
          ${!shown.length && html`<span class="caption" style=${{ textAlign: 'center', padding: '28px 0' }}>Nothing here</span>`}</div></section>`;
    })}</div></div></main>`;
}
