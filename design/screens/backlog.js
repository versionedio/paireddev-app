import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { openItem, bulkTag, bulkMoveProject, bulkTriage, bulkAddToDelivery } from '../api.js';
import { PROJECTS } from '../data/seed.js';
import { inScope, portalStatus, projectOf, scopeName } from '../lib/model.js';
import { scoreOf, TAG_TONE } from '../lib/score.js';
import { Icon, Button, Chip, Badge, Tag, Segmented, SearchInput, Checkbox, ProjectChip, Menu, cx } from '../ui.js';

const PAGE = 50;
const TAGS = ['bug', 'feature', 'performance', 'docs', 'high-impact', 'quick-win', 'regression-risk'];
const SORTS = [['votes', 'Votes'], ['score', 'AI score'], ['new', 'Newest'], ['az', 'A–Z']];
const VOTES = { any: 0, '25+': 25, '50+': 50, '100+': 100 };
const DAYS = { any: 1e9, '7d': 7, '30d': 30, '90d': 90 };
const SORTERS = { votes: (a, b) => b.votes - a.votes, score: (a, b) => scoreOf(b) - scoreOf(a), new: (a, b) => a.days - b.days, az: (a, b) => a.title.localeCompare(b.title) };
const FRESH = { q: '', proj: {}, tags: {}, bucket: 'All', votes: 'any', days: 'any', sort: 'votes' };
const on = o => Object.keys(o).filter(k => o[k]);

function applyFilters(items, f) {
  const q = f.q.trim().toLowerCase(), projs = on(f.proj), tags = on(f.tags);
  return items.filter(i => (!q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
    && (!projs.length || projs.includes(i.project)) && (f.bucket === 'All' || i.bucket === f.bucket.toLowerCase())
    && (!tags.length || tags.some(t => (i.aiTags || []).includes(t) || i.cat.toLowerCase() === t))
    && i.votes >= VOTES[f.votes] && i.days <= DAYS[f.days]).sort(SORTERS[f.sort]);
}
const filtered = f => JSON.stringify({ ...f, sort: 0 }) !== JSON.stringify({ ...FRESH, sort: 0 });

function Pager({ page, pages, total, onPage }) {
  const start = Math.max(0, Math.min(page - 2, pages - 5)), nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
  return html`<div class="row-wrap pager"><span class="mono caption grow">${total} items</span><span class="mono caption">page ${page + 1} of ${pages}</span>
    <${Button} size="sm" off=${page === 0} onClick=${() => onPage(page - 1)}>Prev<//>
    ${nums.map(n => html`<${Chip} key=${n} on=${n === page} onClick=${() => onPage(n)}>${n + 1}<//>`)}
    <${Button} size="sm" off=${page >= pages - 1} onClick=${() => onPage(page + 1)}>Next<//></div>`;
}

function BulkBar({ ids, s, clear }) {
  const [menu, setMenu] = useState(null);
  const m = (key, label, items) => html`<span style=${{ position: 'relative' }}><${Button} size="sm" onClick=${() => setMenu(menu === key ? null : key)}>${label}<${Icon} name="down" size=${12} /><//>
    ${menu === key && html`<${Menu} style=${{ top: '36px', left: 0 }} onClose=${() => setMenu(null)} items=${items} />`}</span>`;
  return html`<div class="bulkbar"><b class="small">${ids.length} selected</b><span class="divider" />
    ${m('tag', 'Add tag', TAGS.map(t => ({ label: t, run: () => bulkTag(ids, t) })))}
    <${Button} size="sm" onClick=${() => bulkTriage(ids)}>Send to triage pass<//>
    ${m('proj', 'Move to project', PROJECTS.map(p => ({ label: p.name, run: () => bulkMoveProject(ids, p.id, p.name) })))}
    ${m('dlv', 'Add to delivery', s.deliveries.map(d => ({ label: d.name, run: () => bulkAddToDelivery(ids, d.id) })))}
    <span class="spacer" /><${Button} variant="bare" size="sm" onClick=${clear}>Clear selection<//></div>`;
}

export function Backlog() {
  const s = useStore();
  const [f, setF] = useState(FRESH); const [page, setPage] = useState(0); const [sel, setSel] = useState({});
  const upd = patch => { setF(x => ({ ...x, ...patch })); setPage(0); };
  const toggle = (k, id) => upd({ [k]: { ...f[k], [id]: !f[k][id] } });

  const rows = applyFilters(s.items.filter(i => i.lane === 'backlog' && inScope(s.scope, i)), f);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)), cur = Math.min(page, pages - 1);
  const view = rows.slice(cur * PAGE, cur * PAGE + PAGE);
  const ids = on(sel), allOn = view.length > 0 && view.every(i => sel[i.id]);
  const range = rows.length ? `${cur * PAGE + 1} – ${cur * PAGE + view.length} of ${rows.length} items` : '0 items';

  return html`<main class="page">
    <header class="page-head"><div><span class="eyebrow">Backlog · ${scopeName(s.scope)}</span><h1 class="h1">Everything not yet committed</h1></div><span class="mono caption">${range}</span></header>
    <div class="filter-bar" style=${{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div class="row-wrap"><${SearchInput} id="backlog-search" placeholder="Search titles and ids" value=${f.q} onInput=${e => upd({ q: e.target.value })} />
        <div class="group"><span class="label">Project</span>${PROJECTS.map(p => html`<${Chip} key=${p.id} on=${!!f.proj[p.id]} onClick=${() => toggle('proj', p.id)}>${p.short}<//>`)}</div>
        <div class="group"><span class="label">Bucket</span><${Segmented} label="Bucket" value=${f.bucket} onChange=${v => upd({ bucket: v })} options=${['All', 'Backlog', 'Next', 'Later']} /></div></div>
      <div class="row-wrap"><div class="group"><span class="label">Tags</span>${TAGS.map(t => html`<${Chip} key=${t} on=${!!f.tags[t]} onClick=${() => toggle('tags', t)}>${t}<//>`)}</div></div>
      <div class="row-wrap"><div class="group"><span class="label">Votes</span><${Segmented} label="Votes" value=${f.votes} onChange=${v => upd({ votes: v })} options=${[['any', 'Any'], '25+', '50+', '100+']} /></div>
        <div class="group"><span class="label">Submitted</span><${Segmented} label="Submitted" value=${f.days} onChange=${v => upd({ days: v })} options=${[['any', 'Any'], '7d', '30d', '90d']} /></div>
        <span class="spacer" />${filtered(f) && html`<${Button} variant="bare" size="sm" onClick=${() => { setF({ ...FRESH, sort: f.sort }); setPage(0); }}>Clear filters<//>`}
        <div class="group"><span class="label">Sort</span><${Segmented} label="Sort" value=${f.sort} onChange=${v => upd({ sort: v })} options=${SORTS} /></div></div></div>
    ${ids.length > 0 && html`<${BulkBar} ids=${ids} s=${s} clear=${() => setSel({})} />`}
    <div class="tbl-wrap"><div class="tbl" role="table">
      <div class="tbl__row tbl__head" role="row"><span><${Checkbox} aria-label="Select page" checked=${allOn} onChange=${() => setSel(allOn ? {} : Object.fromEntries(view.map(i => [i.id, true])))} /></span>
        <span class="r">Votes</span><span class="hide-sm">Id</span><span>Title</span><span class="hide-sm">Proj</span><span class="hide-md">Tags</span><span class="r">Score</span><span class="hide-md">Status</span><span class="r hide-md">Age</span></div>
      ${view.map(i => { const st = portalStatus(i), sc = scoreOf(i); return html`<div class=${cx('tbl__row', sel[i.id] && 'is-sel')} key=${i.id} role="row" onClick=${() => openItem(i.id)}>
        <span onClick=${e => e.stopPropagation()}><${Checkbox} aria-label=${'Select ' + i.id} checked=${!!sel[i.id]} onChange=${() => setSel(x => ({ ...x, [i.id]: !x[i.id] }))} /></span>
        <span class="mono r tnum">${i.votes}</span><span class="mono caption hide-sm">${i.id}</span>
        <span class="tbl__title"><span class="truncate">${i.title}</span><span class="mono caption show-sm">${i.id}</span></span>
        <span class="hide-sm"><${ProjectChip} project=${projectOf(i)} /></span>
        <span class="row-wrap hide-md" style=${{ flexWrap: 'nowrap', overflow: 'hidden' }}>${(i.aiTags || []).slice(0, 2).map(t => html`<${Tag} key=${t} tone=${TAG_TONE[t] || 'neutral'}>${t}<//>`)}</span>
        <span class=${cx('mono r tnum', sc >= 70 && 'hot')}>${sc}</span><span class="hide-md"><${Badge} tone=${st.tone}>${st.label}<//></span><span class="mono caption r hide-md">${i.days}d</span></div>`; })}
      ${!view.length && html`<div class="tbl__empty">No items match these filters.</div>`}</div></div>
    <${Pager} page=${cur} pages=${pages} total=${rows.length} onPage=${setPage} />
  </main>`;
}
