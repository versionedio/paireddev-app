// Help page: objective, use-case diagram, process flow, rules and API surface for every screen.
import { html } from '../lib/react.js';
import { PAGE_DOCS } from '../data/docs.js';
import { OVERVIEW, DOC_EXTRA } from '../data/docs-extra.js';
import { useStore } from '../store.js';
import { go, openDocs } from '../api.js';
import { Button, Badge, Icon, cx } from '../ui.js';

const TONE = { human: 'primary', agent: 'agent', system: 'faint' };
const ORDER = ['overview', 'portal', 'backlog', 'triage', 'board', 'drawer', 'sprints', 'deliveries', 'analytics', 'activity', 'releases', 'team', 'agent', 'providers'];
const NO_PAGE = ['overview', 'drawer'];
const docOf = id => id === 'overview' ? OVERVIEW : { ...PAGE_DOCS[id], ...DOC_EXTRA[id] };
const wrap = (text, max) => {
  const out = []; let line = '';
  text.split(' ').forEach(w => { if ((line + ' ' + w).trim().length > max) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); });
  return out.concat(line);
};

function UseCaseDiagram({ actors, cases }) {
  const rowH = 52, top = 26, W = 700, uX = 230, uW = 450, uH = 40;
  const H = Math.max(cases.length * rowH, actors.length * 92) + top * 2;
  const ay = i => top + (H - top * 2) * (i + .5) / actors.length;
  const cy = i => top + (H - top * 2) * (i + .5) / cases.length;
  return html`<div class="diagram-scroll"><svg class="diagram" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Use case diagram">
    <rect class="uc-boundary" x=${uX - 20} y="6" width=${uW + 40} height=${H - 12} rx="14" />
    ${cases.flatMap((c, ci) => c.by.map(ai => html`<line class=${cx('uc-line', 'uc-line--' + actors[ai].kind)} key=${ci + '-' + ai} x1="84" y1=${ay(ai)} x2=${uX} y2=${cy(ci)} />`))}
    ${cases.map((c, i) => { const lines = wrap(c.text, 62); return html`<g key=${i}>
      <rect class="uc-node" x=${uX} y=${cy(i) - uH / 2} width=${uW} height=${uH} rx=${uH / 2} />
      <text class="uc-text" x=${uX + uW / 2} y=${cy(i) - (lines.length - 1) * 7 + 4} text-anchor="middle">${lines.map((l, k) => html`<tspan key=${k} x=${uX + uW / 2} dy=${k ? 14 : 0}>${l}</tspan>`)}</text></g>`; })}
    ${actors.map((a, i) => html`<g key=${a.name} class=${'uc-actor uc-actor--' + a.kind}>
      <circle cx="56" cy=${ay(i) - 22} r="9" /><path d=${`M56 ${ay(i) - 13}v22M42 ${ay(i) - 5}h28M56 ${ay(i) + 9}l-12 14M56 ${ay(i) + 9}l12 14`} />
      <text x="56" y=${ay(i) + 40} text-anchor="middle">${a.name}</text></g>`)}
  </svg></div>`;
}

function Flow({ steps }) {
  return html`<ol class="flow">${steps.map((s, i) => html`<li key=${i} class=${cx('flow__node', 'flow__node--' + s.kind)}>
    ${s.kind === 'decision' ? html`<div class="flow__box"><span class="flow__q"><${Icon} name="alert" size=${14} />${s.text}</span>
        <div class="flow__branches"><span class="flow__yes">Yes · ${s.yes}</span><span class="flow__no">No · ${s.no}</span></div></div>`
      : html`<div class="flow__box">${s.who && html`<span class="label">${s.who}</span>`}<span>${s.text}</span></div>`}</li>`)}</ol>`;
}

const Section = ({ label, children }) => html`<section class="help__section stack-sm"><h2 class="label">${label}</h2>${children}</section>`;

function Topic({ id }) {
  const d = docOf(id);
  const title = (id === 'overview' ? '' : PAGE_DOCS[id].title);
  return html`<article class="help__body">
    <header class="stack-sm"><span class="eyebrow">${id === 'overview' ? 'Start here' : 'Help'}</span><h1 class="h1">${d.title || title}</h1>
      <div class="row-wrap">${d.actors.map(a => html`<${Badge} key=${a.name} soft tone=${TONE[a.kind]}>${a.name}<//>`)}</div></header>
    <${Section} label="Objective"><p>${d.objective}</p>${d.when && html`<p class="muted"><strong>When to use it. </strong>${d.when}</p>`}<//>
    <${Section} label="Use cases"><${UseCaseDiagram} actors=${d.actors} cases=${d.cases} /><//>
    <${Section} label="Process flow"><${Flow} steps=${d.flow} /><//>
    ${d.rules && html`<${Section} label="Rules this page enforces"><ul class="help__rules">${d.rules.map(r => html`<li key=${r}>${r}</li>`)}</ul><//>`}
    ${d.endpoints.length > 0 && html`<${Section} label="API surface"><div class="well" style=${{ padding: 'var(--sp-3) var(--sp-4)' }}>${d.endpoints.map(e => html`<div class="mono caption" key=${e} style=${{ padding: '2px 0', color: 'var(--t2)' }}>${e}</div>`)}</div><//>`}
    <footer class="row-wrap">
      ${!NO_PAGE.includes(id) && html`<${Button} variant="primary" icon="arrow" onClick=${() => go(id)}>Open ${d.title}<//>`}
      ${id === 'drawer' && html`<${Button} variant="primary" icon="arrow" onClick=${() => go('board')}>Open the Board<//>`}
      ${(d.related || []).map(r => html`<${Button} key=${r} variant="ghost" onClick=${() => openDocs(r)}>Next: ${PAGE_DOCS[r].title}<//>`)}
    </footer>
  </article>`;
}

export function Help() {
  const s = useStore();
  const id = ORDER.includes(s.docs) ? s.docs : 'overview';
  return html`<main class="page help">
    <nav class="help__nav" aria-label="Help topics">${ORDER.map(t => html`
      <button type="button" key=${t} class=${cx('help__link', t === id && 'is-on')} onClick=${() => openDocs(t)}>${t === 'overview' ? 'How it works' : PAGE_DOCS[t].title}</button>`)}</nav>
    <${Topic} id=${id} key=${id} />
  </main>`;
}
