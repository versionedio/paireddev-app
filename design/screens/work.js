import { html, useState, useRef, useEffect } from '../lib/react.js';
import { gitOp, gitOf, approvePlan, revisePlan, toggleNotes, toggleCollapse, decideGate, resumeSession } from '../api.js';
import { GIT_PHASES, PLAN } from '../data/seed.js';
import { Icon, Button, Badge, Textarea, Input, cx } from '../ui.js';

const STEP = { read: ['read', 'neutral'], write: ['edit', 'primary'], bash: ['terminal', 'neutral'], test: ['check', 'green'], git: ['branch', 'info'], deny: ['deny', 'red'], note: ['note', 'faint'] };
const clock = secs => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
const STATUS = {
  running: ['green', 'Running', true], paused: ['agent', 'Paused — needs approval'], waiting: ['warn', 'Idle — waiting for input'], done: ['neutral', 'Finished'],
};

function GitBar({ id, g, provider }) {
  return html`<div class="stack-sm">
    <div class="row"><span class="label grow">Git operations</span><${Badge} tone="neutral">${provider}<//></div>
    <div class="gitbar">${GIT_PHASES.map((grp, gi) => html`<span class="row-wrap" key=${gi} style=${{ gap: 'var(--sp-2)' }}>
      ${gi > 0 && html`<span class="gitbar__arrow">→</span>`}
      ${grp.map(label => html`<button type="button" key=${label} disabled=${gi !== g.phase}
        class=${cx('gitbtn', gi === g.phase && 'is-now', gi === g.phase && label === 'Start work' && 'is-start')} onClick=${() => gitOp(id, label)}>${label}</button>`)}</span>`)}</div></div>`;
}

function PlanPanel({ id, g }) {
  const [notes, setNotes] = useState(''); const [err, setErr] = useState('');
  const resend = () => { const r = revisePlan(id, notes); if (r.ok) setNotes(''); else setErr(r.message); };
  return html`<section class="plan">
    <div class="row"><span style=${{ color: 'var(--agent-t)' }}><${Icon} name="spark" size=${18} /></span><h3 class="h3 grow">Claude's plan</h3><${Badge} tone="agent">approval required<//></div>
    <p class="small" style=${{ color: 'var(--agent-dim)' }}>${PLAN.intro}</p>
    ${g.revision > 0 && html`<div class="callout tone-primary"><span class="label" style=${{ color: 'inherit' }}>Revision ${g.revision} · your note</span><div>${g.lastNote}</div></div>`}
    <div class="stack-sm"><span class="label">Files it intends to touch</span><div class="file-table">${PLAN.files.map(([kind, path, size]) => html`
      <div class="file-row" key=${path}><${Badge} tone=${kind === 'new' ? 'green' : 'primary'}>${kind}<//><span class="mono grow truncate" style=${{ color: 'var(--t1)' }}>${path}</span><span class="mono caption">${size}</span></div>`)}</div></div>
    <div class="stack-sm"><span class="label">Order of work</span>${PLAN.steps.map((t, i) => html`<div class="step" key=${i}><span class="step__n">${String(i + 1).padStart(2, '0')}</span><span class="small">${t}</span></div>`)}</div>
    <div class="stack-sm"><span class="label">Risks it flagged</span>${PLAN.risks.map(([l, b]) => html`<div class="risk" key=${l}><b>${l}</b><span>${b}</span></div>`)}</div>
    ${g.notesOpen && html`<div class="stack-sm"><${Textarea} id="plan-notes" rows="3" value=${notes} bad=${!!err} placeholder="What should change in the plan?" onInput=${e => { setNotes(e.target.value); setErr(''); }} />
      ${err && html`<span class="field__err">${err}</span>`}<div class="row-wrap"><${Button} variant="ghost" onClick=${() => toggleNotes(id, false)}>Cancel<//><${Button} variant="primary" onClick=${resend}>Send back<//></div></div>`}
    <div class="row-wrap"><span class="mono caption grow">Nothing is written until this is approved</span>
      ${!g.notesOpen && html`<${Button} variant="ghost" onClick=${() => toggleNotes(id, true)}>Send back with notes<//>`}
      <${Button} variant="agent-solid" onClick=${() => approvePlan(id)}>Approve plan<//></div></section>`;
}

function SessionPanel({ id, g }) {
  const [reply, setReply] = useState('Skip the migration and open the PR without it.');
  const stream = useRef(null);
  useEffect(() => { if (stream.current) stream.current.scrollTop = stream.current.scrollHeight; }, [g.steps.length, g.stage]);
  const [tone, label, pulse] = STATUS[g.stage];
  if (g.stage === 'done' && g.collapsed) return html`<div class="session"><div class="session__head"><span style=${{ color: 'var(--green-t)' }}><${Icon} name="check" /></span>
    <span class="small grow">${g.summary}</span><${Button} variant="bare" size="sm" onClick=${() => toggleCollapse(id)}>Expand<//></div></div>`;
  return html`<section class="session">
    <div class="session__head"><span class=${cx('pill tint', `tone-${tone}`, pulse && 'pulse')}><span class="pill__dot" />${label}</span>
      <span class="mono caption grow">${g.steps.length} steps · ${clock(g.steps.length * 21)}</span>
      ${g.stage === 'done' && html`<${Button} variant="bare" size="sm" onClick=${() => toggleCollapse(id)}>Collapse<//>`}</div>
    <div class="session__stream" ref=${stream}>${g.steps.map((st, i) => {
      const [ic, t] = STEP[st.kind] || STEP.note;
      return html`<div class="sstep" key=${i}><span class=${cx('sstep__ic tint', `tone-${t}`)}><${Icon} name=${ic} size=${13} /></span><span class="grow truncate" title=${st.text}>${st.text}</span><span class="caption">${clock(st.t)}</span></div>`;
    })}
      ${g.stage === 'paused' && html`<div class="approval"><div class="row small" style=${{ color: 'var(--agent-t)', fontWeight: 600 }}><${Icon} name="pause" size=${16} />Paused — needs your approval</div>
        <p class="small">Claude wants to write <span class="mono" style=${{ color: 'var(--t1)' }}>${g.gate}</span></p>
        <div class="well mono caption" style=${{ padding: 'var(--sp-2) var(--sp-3)' }}>hook: protected-paths · PreToolUse / Write · action: ask<br />Writes under infra/migrations/ are handed to a human.</div>
        <div class="row-wrap"><${Button} variant="agent-solid" onClick=${() => decideGate(id, 'approve')}>Approve write<//><${Button} variant="danger-ghost" onClick=${() => decideGate(id, 'deny')}>Deny<//></div></div>`}
      ${g.stage === 'waiting' && html`<div class="stack-sm"><${Input} id="resume-input" value=${reply} onInput=${e => setReply(e.target.value)} />
        <div><${Button} variant="agent" icon="spark" onClick=${() => resumeSession(id, reply)}>Resume<//></div></div>`}
      ${g.stage === 'done' && html`<div class="small" style=${{ color: 'var(--green-t)' }}>✓ ${g.summary}</div>`}</div></section>`;
}

export function WorkTab({ it, s }) {
  const g = gitOf(s, it.id);
  const prov = s.providers[s.execProvider];
  const provider = prov.name + (prov.routed ? ' · ' + prov.gateway : '');
  return html`<${GitBar} id=${it.id} g=${g} provider=${provider} />
    ${g.stage === 'plan' && html`<${PlanPanel} id=${it.id} g=${g} />`}
    ${['running', 'paused', 'waiting', 'done'].includes(g.stage) && html`<${SessionPanel} id=${it.id} g=${g} />`}
    ${g.stage === 'idle' && html`<div class="idle-panel"><b class="h3">Nothing running on this card</b><span class="small">Start work to have Claude draft a plan. It runs against ${provider} and writes nothing until you approve.</span></div>`}`;
}
