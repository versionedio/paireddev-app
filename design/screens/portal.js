import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { vote, submitRequest } from '../api.js';
import { inScope, portalStatus, projectOf, scopeSpansMany, scopeName } from '../lib/model.js';
import { TAG_TONE } from '../lib/score.js';
import { DESCS } from '../data/seed.js';
import { Icon, Button, Chip, Badge, Tag, Modal, Field, Input, Textarea, Segmented, ProjectChip, cx } from '../ui.js';

const SORTS = [['votes', 'Most voted'], ['new', 'Newest'], ['mine', 'My submissions']];
const STATUSES = ['All', 'Under review', 'Planned', 'In progress', 'Shipped'];
const ME = 'lena@northwind.io';

function RequestCard({ it, many, bumped, onVote }) {
  const st = portalStatus(it);
  return html`<article class="card card--hover req">
    <button type="button" class=${cx('vote', it.voted && 'is-on')} aria-pressed=${it.voted} aria-label=${'Vote for ' + it.title} onClick=${() => onVote(it.id)}>
      <${Icon} name="up" size=${14} /><span class=${cx('vote__n tnum', bumped && 'bump')}>${it.votes}</span></button>
    <div class="req__body">
      <div class="row-wrap"><${Badge} tone=${st.tone}>${st.label}<//><span class="mono caption">${it.id}</span>${many && html`<${ProjectChip} project=${projectOf(it)} />`}</div>
      <h3 class="req__title">${it.title}</h3>
      <p class="req__desc">${it.desc || DESCS[it.id] || 'Requested through the public portal. Triage will estimate impact and effort.'}</p>
      <div class="req__foot">${(it.aiTags || []).map(t => html`<${Tag} key=${t} tone=${TAG_TONE[t] || 'neutral'}>${t}<//>`)}
        <span class="spacer" /><span class="mono caption truncate hide-sm" style=${{ maxWidth: '170px' }}>${it.submitter}</span></div>
    </div></article>`;
}

function SubmitModal({ onClose, onSent }) {
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('Feature'); const [shot, setShot] = useState(false); const [err, setErr] = useState('');
  const send = async () => {
    if (title.replace(/\s/g, '').length < 6) return setErr('Give it at least a few words so we can route it.');
    await submitRequest({ title: title.trim(), desc: desc.trim(), cat });
    onSent();
  };
  return html`<${Modal} title="Submit a request" onClose=${onClose}
    footer=${html`<span class="mono caption hint hide-sm">POST /v1/requests</span><${Button} onClick=${onClose}>Cancel<//><${Button} variant="primary" onClick=${send}>Submit request<//>`}>
    <${Field} label="Title" id="req-title" error=${err}>
      <${Input} id="req-title" value=${title} bad=${!!err} placeholder="What should we build or fix?" onInput=${e => { setTitle(e.target.value); setErr(''); }} /><//>
    <${Field} label="Description" id="req-desc"><${Textarea} id="req-desc" rows="4" value=${desc} placeholder="What happens today, and what did you expect?" onInput=${e => setDesc(e.target.value)} /><//>
    <${Field} label="Category"><${Segmented} label="Category" value=${cat} onChange=${setCat} options=${['Bug', 'Feature', 'Performance', 'Docs']} /><//>
    <${Field} label="Screenshot"><button type="button" class=${cx('dropzone', shot && 'is-on')} onClick=${() => setShot(!shot)}>
      ${shot ? '✓ safari-oauth-blank.png · 284 KB' : 'Attach a screenshot'}</button><//><//>`;
}

export function Portal() {
  const s = useStore();
  const [sort, setSort] = useState('votes'); const [status, setStatus] = useState('All');
  const [modal, setModal] = useState(false); const [bump, setBump] = useState(null);

  const pool = s.items.filter(i => !i.synthetic && inScope(s.scope, i));
  let list = pool.filter(i => (status === 'All' || portalStatus(i).label === status) && (sort !== 'mine' || i.submitter === ME));
  list = list.slice().sort((a, b) => (sort === 'new' ? a.days - b.days : b.votes - a.votes));

  const onVote = id => { vote(id); setBump(id); setTimeout(() => setBump(null), 420); };
  return html`<main class="page">
    <header class="page-head">
      <div><span class="eyebrow">Public feedback portal · ${scopeName(s.scope)}</span>
        <h1 class="h1">What should we build next?</h1>
        <p class="lede">Vote on what matters to you. Status updates here as work moves from review to shipped.</p></div>
      <${Button} variant="primary" size="lg" icon="plus" onClick=${() => setModal(true)}>Submit new request<//>
    </header>
    <div class="filter-bar">
      <div class="group"><span class="label">Sort</span>${SORTS.map(([v, l]) => html`<${Chip} key=${v} on=${sort === v} onClick=${() => setSort(v)}>${l}<//>`)}</div>
      <span class="divider hide-sm" />
      <div class="group"><span class="label">Status</span>${STATUSES.map(v => html`<${Chip} key=${v} on=${status === v} onClick=${() => setStatus(v)}>${v}<//>`)}</div>
      <span class="spacer" /><span class="mono caption">${list.length} of ${pool.length} requests</span>
    </div>
    <div class="req-grid">${list.map(it => html`<${RequestCard} key=${it.id} it=${it} many=${scopeSpansMany(s.scope)} bumped=${bump === it.id} onVote=${onVote} />`)}</div>
    ${modal && html`<${SubmitModal} onClose=${() => setModal(false)} onSent=${() => { setModal(false); setSort('new'); setStatus('All'); }} />`}
  </main>`;
}
