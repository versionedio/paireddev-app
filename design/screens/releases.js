import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { promote, wait2, openItem } from '../api.js';
import { PREFLIGHT } from '../data/seed.js';
import { CI } from '../data/phase2.js';
import { inScope, ownerOf, scopeName } from '../lib/model.js';
import { Icon, Button, Badge, Avatar, RunButton, cx } from '../ui.js';
import { PreflightRows, PreflightGate } from './preflight.js';

const GLYPH = { pass: '✓', run: '•', fail: '✕', queued: '–' };
const TONE = { pass: 'green', run: 'agent', fail: 'red', queued: 'faint' };
const ENVS = [['int', 'Integration', 'int.nostackai.app', 'teal', 'auto-promote', 'neutral', '12m ago'], ['stage', 'Staging', 'staging.nostackai.app', 'warn', 'awaiting Maya', 'warn', null], ['prod', 'Production', 'api.nostackai.com', 'green', 'live', 'green', '2d ago']];

function Ci({ states }) {
  return html`<div class="ci">${['build', 'test', 'deploy'].map((l, i) => html`<span key=${l} class=${cx('ci__seg tint', 'tone-' + TONE[states[i]], states[i] === 'run' && 'pulse')}><span class="label" style=${{ color: 'inherit' }}>${l}</span>${GLYPH[states[i]]}</span>`)}</div>`;
}
function ReleaseCard({ it, env }) {
  const [, , , , gate, gtone, when] = ENVS.find(e => e[0] === env);
  return html`<button type="button" class="card card--hover relcard" onClick=${() => openItem(it.id)}>
    <div class="row"><span class="mono caption grow">${it.id}</span><${Avatar} who=${ownerOf(it)} size=${22} /></div>
    <span class="small" style=${{ color: 'var(--t1)', fontWeight: 500, textAlign: 'left' }}>${it.title}</span>
    <span class="branch truncate">${it.branch}</span><${Ci} states=${CI[env]} />
    <div class="row"><${Badge} tone=${gtone}>${gate}<//><span class="spacer" /><span class="mono caption">${when || '9h ago'}</span></div></button>`;
}

export function Releases() {
  const s = useStore();
  const [pf, setPf] = useState('idle');
  const here = s.items.filter(i => inScope(s.scope, i));
  const by = { int: here.filter(i => i.lane === 'testing'), stage: here.filter(i => i.lane === 'staged'), prod: here.filter(i => i.lane === 'done' && i.branch) };
  const rows = by.stage.map(i => { const p = PREFLIGHT.find(x => x[0] === i.id); return p ? { id: p[0], title: p[1], verdict: p[2], assess: p[3], paths: p[4], reasoning: p[5] } : { id: i.id, title: i.title, verdict: 'clean', assess: 'No shared paths with the rest of the staged set.', paths: [i.branch], reasoning: 'Nothing else in the staged set touches these files. Safe to release in any order.' }; });
  const conflicts = rows.filter(r => r.verdict !== 'clean').length;
  const run = async () => { setPf('run'); await wait2(2100); setPf('done'); };

  return html`<main class="page">
    <header class="page-head"><div><span class="eyebrow">Releases · ${scopeName(s.scope)}</span><h1 class="h1">Pipeline</h1>
      <p class="lede">What is queued at each gate and whether CI is green.</p></div>
      <div class="row-wrap"><span class="mono caption" style=${{ color: pf === 'done' && conflicts ? 'var(--warn-dim)' : undefined }}>${pf === 'done' ? (conflicts ? `${conflicts} conflicts found` : 'No conflicts found') : `${by.stage.length} staged items`}</span>
        <${RunButton} running=${pf === 'run'} idleLabel=${pf === 'done' ? 'Re-run pre-flight' : 'Run pre-flight check'} runLabel="Claude is checking…" onClick=${run} /></div></header>
    ${pf === 'done' && html`<section class="panel preflight stack"><div class="row-wrap"><h2 class="h3 grow">Release pre-flight · ${rows.length} staged items</h2><span class="mono caption">ran just now · POST /v1/releases/preflight</span></div>
      <${PreflightRows} rows=${rows} /><${PreflightGate} conflicts=${conflicts} count=${rows.length} promoteLabel=${n => `Promote ${n} items to production`} onPromote=${() => { promote(rows.map(r => r.id)); setPf('idle'); }} onDismiss=${() => setPf('idle')} /></section>`}
    <div class="pipe">${ENVS.map(([id, name, host, tone, , , ], k) => html`
      ${k > 0 && html`<div class="pipe__gate" key=${'g' + k}><span>→</span><span class="label">${k === 1 ? 'tests green' : 'human approval'}</span></div>`}
      <section class="col" key=${id}><div class="col__head" style=${{ background: 'var(--card)', flexWrap: 'wrap' }}><span class=${'dot tone-' + tone}></span><b class="small grow" style=${{ color: 'var(--t1)' }}>${name}</b><span class="mono caption">${by[id].length} queued</span>
        <span class="mono caption" style=${{ flexBasis: '100%' }}>${host}</span></div>
        <div class="col__body">${by[id].map(it => html`<${ReleaseCard} key=${it.id} it=${it} env=${id} />`)}${!by[id].length && html`<span class="caption" style=${{ textAlign: 'center', padding: '24px 0' }}>Nothing queued</span>`}</div></section>`)}</div>
  </main>`;
}
