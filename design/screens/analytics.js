import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { wait2 } from '../api.js';
import { LANES, PEOPLE } from '../data/seed.js';
import { inScope } from '../lib/model.js';
import { cumulativeFlow, throughput, burndown, velocity, retroGroups, agingDays, agingTone } from '../lib/metrics.js';
import { Segmented, RunButton, Icon, Avatar, LaneBadge, Badge, cx } from '../ui.js';

const Card = ({ title, sub, children, wide }) => html`<section class=${cx('panel chart', wide && 'chart--wide')}><div class="stack-sm" style=${{ gap: '2px' }}><h2 class="h3">${title}</h2><span class="caption">${sub}</span></div>${children}</section>`;

function Cfd({ range }) {
  const c = cumulativeFlow(range);
  return html`<svg class="chart__svg" viewBox=${`0 0 ${c.W + 20} ${c.H + 28}`} role="img" aria-label="Cumulative flow">
    ${c.grid.map(g => html`<g key=${g.y}><line class="gridline" x1=${c.X0} x2=${c.W} y1=${g.y} y2=${g.y} /><text class="axis" x="0" y=${g.y + 3.5}>${g.label}</text></g>`)}
    ${c.bands.map(b => html`<polygon key=${b.lane.id} class="cfd-band" style=${{ '--lh': b.lane.hue, '--bc': Math.min(.052, b.lane.chroma * 1.05 + .007) }} points=${b.points} />`)}
    ${c.xLabels.map(x => html`<text key=${x.label} class="axis" x=${x.x} y=${c.H + 18} text-anchor="middle">${x.label}</text>`)}</svg>
    <div class="row-wrap legend">${LANES.map(l => html`<span class="row small muted nowrap" key=${l.id} style=${{ gap: '6px' }}><i class="cfd-band swatch" style=${{ '--lh': l.hue, '--bc': Math.min(.052, l.chroma * 1.05 + .007) }} />${l.label}</span>`)}</div>`;
}
function Throughput({ range }) {
  const t = throughput(range);
  return html`<${Card} title="Throughput" sub=${t.trend}><svg class="chart__svg" viewBox=${`0 0 ${t.W + 14} ${t.H + 30}`} role="img" aria-label="Throughput per week">
    ${t.grid.map(g => html`<g key=${g.y}><line class="gridline" x1=${t.X0} x2=${t.W} y1=${g.y} y2=${g.y} /><text class="axis" x="0" y=${g.y + 3.5}>${g.label}</text></g>`)}
    <polyline class="line" points=${t.points} />${t.dots.map((d, i) => html`<circle key=${i} class="dot-pt" cx=${d.x} cy=${d.y} r="3" />`)}
    ${t.xLabels.map(x => html`<text key=${x.label + x.x} class="axis" x=${x.x} y=${t.H + 22} text-anchor="middle">${x.label}</text>`)}</svg><//>`;
}
function Cycle() {
  const B = [['<1d', 3], ['1–2d', 7], ['2–3d', 9], ['3–5d', 6], ['5–8d', 3], ['8d+', 2]], max = 9;
  return html`<${Card} title="Cycle time" sub="Median 2.6 days"><div class="hist">${B.map(([l, n]) => html`<div key=${l} class="hist__col"><span class="mono caption">${n}</span><i style=${{ height: Math.round(n / max * 100) + '%', background: `color-mix(in oklch, var(--primary) ${45 + Math.round(n / max * 40)}%, var(--panel))` }} /><span class="mono caption">${l}</span></div>`)}</div><//>`;
}
function Aging({ flight }) {
  const max = Math.max(10, ...flight.map(x => x.days)), over = flight.filter(x => x.days > 8).length;
  return html`<${Card} wide title="Aging work in progress" sub=${`${over} cards past the 8-day threshold.`}><div class="stack-sm">${flight.map(({ it, days }) => html`<div class="aging" key=${it.id}>
    <span class="mono caption">${it.id}</span><span class="small truncate">${it.title}</span><span class="hide-sm"><${LaneBadge} lane=${it.lane} /></span>
    <span class="aging__bar"><i class=${'tone-' + agingTone(days)} style=${{ width: Math.round(days / max * 100) + '%' }} /></span><span class=${'mono caption tone-' + agingTone(days)} style=${{ color: 'var(--tone-t)', textAlign: 'right' }}>${days}d</span></div>`)}</div><//>`;
}
function Burn({ sprint }) {
  const b = burndown(sprint);
  return html`<${Card} wide title=${'Burndown · ' + sprint.name} sub=${`${b.done} of ${b.planned} done, day ${b.el} of ${b.D}.`}><svg class="chart__svg" viewBox=${`0 0 ${b.W + 14} ${b.H + 28}`} role="img" aria-label="Burndown">
    ${b.grid.map(g => html`<g key=${g.y}><line class="gridline" x1=${b.X0} x2=${b.W} y1=${g.y} y2=${g.y} /><text class="axis" x="0" y=${g.y + 3.5}>${g.label}</text></g>`)}
    <polygon class="area" points=${b.area} /><polyline class="target" points=${b.target} /><polyline class="line line--thick" points=${b.actual} />
    ${b.dots.map((d, i) => html`<circle key=${i} class="dot-pt" cx=${d.x} cy=${d.y} r="3.5" />`)}${b.xLabels.map(x => html`<text key=${x.label} class="axis" x=${x.x} y=${b.H + 18} text-anchor="middle">${x.label}</text>`)}</svg>
    <div class="row-wrap legend small muted"><span class="row"><i class="key key--solid" />Actual remaining</span><span class="row"><i class="key key--dash" />Target</span></div><//>`;
}
function Velocity({ s }) {
  const v = velocity(s.sprintPast, s.sprintActive, s.items.filter(i => i.lane === 'done').length);
  return html`<${Card} title="Velocity" sub=${v.note}><div class="hist">${v.bars.map(x => html`<div class="hist__col" key=${x.name}><span class="mono caption" style=${{ color: x.live ? 'var(--primary-t)' : undefined }}>${x.shipped}</span>
    <i class=${cx(x.live && 'is-live')} style=${{ height: x.pct + '%', background: x.live ? 'color-mix(in oklch, var(--primary) 55%, var(--panel))' : 'color-mix(in oklch, var(--green) 45%, var(--panel))' }} /><span class="mono caption">${x.label}</span></div>`)}</div><//>`;
}

function Retro({ flight }) {
  const [st, setSt] = useState('idle');
  const run = async () => { setSt('run'); await wait2(1500); setSt('done'); };
  const groups = retroGroups(flight);
  return html`<section class="panel chart chart--wide"><div class="row-wrap"><span style=${{ color: 'var(--agent-t)' }}><${Icon} name="spark" size=${18} /></span><div class="grow stack-sm" style=${{ gap: '2px' }}><h2 class="h3">Retro digest</h2>
    <span class="caption">${st === 'done' ? 'pulled from the audit log' : 'reads the audit log for the current period'}</span></div>
    <${RunButton} size="sm" running=${st === 'run'} idleLabel=${st === 'done' ? 'Refresh digest' : 'Prepare retro'} runLabel="Reading the log…" onClick=${run} /></div>
    ${st === 'done' && html`<div class="stack">${groups.map(g => html`<div class="stack-sm" key=${g.label}><div class="row-wrap"><${Badge} tone=${g.tone}>${g.rows.length}<//><b class="small">${g.label}</b><span class="caption">${g.note}</span></div>
      <div class="panel audit">${g.rows.map(([who, text, target, when], i) => html`<div class=${cx('audit__row', who === 'claude' && 'is-agent')} key=${i}><${Avatar} who=${who} size=${24} /><span class="small grow"><b style=${{ color: who === 'claude' ? 'var(--agent-t)' : who === 'system' ? 'var(--t3)' : 'var(--primary-t)' }}>${PEOPLE[who].name}</b> ${text} <span class="mono caption">${target}</span></span><span class="mono caption">${when}</span></div>`)}</div></div>`)}</div>`}</section>`;
}

export function Analytics() {
  const s = useStore(); const [range, setRange] = useState(30);
  const sprint = s.cadence !== 'flow';
  const flight = s.items.filter(i => ['assigned', 'inprogress', 'review', 'testing', 'staged'].includes(i.lane) && inScope(s.scope, i)).map(it => ({ it, days: agingDays(it) })).sort((a, b) => b.days - a.days).slice(0, 7);
  return html`<main class="page"><header class="page-head"><div><span class="eyebrow">Analytics · ${sprint ? s.cadence + '-week sprints' : 'flow'}</span><h1 class="h1">${sprint ? 'Sprint health' : 'Flow health'}</h1></div>
    <div class="row-wrap"><${Segmented} label="Range" value=${range} onChange=${setRange} options=${[[7, '7d'], [14, '14d'], [30, '30d'], [90, '90d']]} /><span class="mono caption hide-sm">last ${range} days · computed on demand</span></div></header>
    <div class="charts"><${Retro} flight=${flight} />
      ${sprint ? html`<${Burn} sprint=${s.sprintActive} /><${Velocity} s=${s} />`
        : html`<${Card} wide title="Cumulative flow" sub="Done sits on the floor, so a growing floor is throughput and widening upper bands are queues."><${Cfd} range=${range} /><//><${Cycle} /><${Throughput} range=${range} /><${Aging} flight=${flight} />`}</div></main>`;
}
