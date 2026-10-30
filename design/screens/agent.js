import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { editClaudeMd, commitClaudeMd, revertClaudeMd, addSkill } from '../api.js';
import { CLAUDE_MD_SEED, HOOKS_SEED } from '../data/seed.js';
import { Icon, Button, Badge, Tabs, Modal, Field, Input, Textarea } from '../ui.js';

const ACTION = { block: 'red', ask: 'agent', allow: 'neutral' };

function Editor({ s }) {
  return html`<div class="panel"><div class="row-wrap md-head"><span style=${{ color: 'var(--info-t)' }}><${Icon} name="branch" size=${15} /></span><span class="mono small">claims-api/CLAUDE.md</span><${Badge} tone=${s.mdSaved ? 'green' : 'warn'}>${s.mdSaved ? 'in sync' : 'unsaved changes'}<//><span class="spacer" /><span class="mono caption hide-sm">last synced 4d ago · main@4821</span></div>
    <textarea id="claude-md" class="md-editor" rows="22" spellcheck="false" value=${s.claudeMd} onInput=${e => editClaudeMd(e.target.value)} />
    <div class="row-wrap md-foot"><span class="small muted grow">Committed to the default branch on save. Every session reads it as its first turn. This is the file, not a copy of it.</span>
      <${Button} off=${s.mdSaved} onClick=${() => revertClaudeMd(CLAUDE_MD_SEED)}>Revert<//><${Button} variant="primary" off=${s.mdSaved} onClick=${commitClaudeMd}>${s.mdSaved ? 'Saved' : 'Commit to main'}<//></div></div>`;
}

function SkillModal({ onClose }) {
  const [name, setName] = useState(''); const [body, setBody] = useState(''); const [err, setErr] = useState('');
  const save = () => { if (!name.trim()) return setErr('Give the skill a name.'); addSkill(name.trim().toLowerCase().replace(/\s+/g, '-'), body); onClose(); };
  return html`<${Modal} title="Add skill" width=${520} onClose=${onClose} footer=${html`<span class="mono caption hint hide-sm">PUT .claude/skills/</span><${Button} onClick=${onClose}>Cancel<//><${Button} variant="primary" onClick=${save}>Add skill<//>`}>
    <${Field} label="Name" id="sk-name" error=${err}><${Input} id="sk-name" mono value=${name} bad=${!!err} placeholder="add-endpoint" onInput=${e => { setName(e.target.value); setErr(''); }} /><//>
    <${Field} label="What it does" id="sk-body"><${Textarea} id="sk-body" mono rows="6" value=${body} placeholder="When X happens, do Y, then Z." onInput=${e => setBody(e.target.value)} /><//><//>`;
}

function Skills({ s }) {
  const [m, setM] = useState(false);
  return html`<div class="stack"><div class="row-wrap"><span class="caption grow">Reusable procedures Claude loads when a request matches.</span><${Button} variant="primary" icon="plus" onClick=${() => setM(true)}>Add skill<//></div>
    <div class="panel tbl2">${s.skills.map(([n, t, u]) => html`<div class="tbl2__row" key=${n}><span class="mono small" style=${{ width: '168px', color: 'var(--t1)' }}>${n}</span><span class="small muted grow">${t}</span><span class="mono caption hide-sm">${u}</span></div>`)}</div>${m && html`<${SkillModal} onClose=${() => setM(false)} />`}</div>`;
}

function Hooks() {
  return html`<div class="stack"><p class="small muted">A hook set to <b>ask</b> is exactly what pauses a Live Session and puts the approval card in front of you.</p>
    <div class="panel tbl2">${HOOKS_SEED.map(([n, glob, trig, act, scope, locked]) => html`<div class="tbl2__row" key=${n}><div class="grow stack-sm" style=${{ gap: '2px' }}><div class="row-wrap" style=${{ gap: '6px' }}><b class="small" style=${{ color: locked ? 'var(--t2)' : 'var(--t1)' }}>${n}</b>${locked && html`<${Badge} tone="neutral"><${Icon} name="lock" size=${10} />Set by admin<//>`}</div><span class="mono caption truncate">${glob}</span></div>
      <span class="mono caption hide-sm" style=${{ width: '132px' }}>${trig}</span><${Badge} tone=${ACTION[act]}>${act}<//><span class="caption hide-sm" style=${{ width: '90px', textAlign: 'right' }}>${scope}</span></div>`)}</div>
    <p class="caption">Org-managed hooks are locked here. A project owner cannot widen what the org narrowed; ask an org admin to change them.</p></div>`;
}

export function AgentConfig() {
  const s = useStore(); const [tab, setTab] = useState('md');
  return html`<main class="page page--narrow"><header class="page-head"><div><span class="eyebrow">Project settings / Agent configuration</span><h1 class="h1">What Claude knows before it starts</h1></div></header>
    <div style=${{ marginBottom: 'var(--sp-5)' }}><${Tabs} tabs=${[{ id: 'md', label: 'CLAUDE.md' }, { id: 'skills', label: 'Skills', badge: s.skills.length }, { id: 'hooks', label: 'Hooks', badge: HOOKS_SEED.length }]} value=${tab} onChange=${setTab} /></div>
    ${tab === 'md' && html`<${Editor} s=${s} />`}${tab === 'skills' && html`<${Skills} s=${s} />`}${tab === 'hooks' && html`<${Hooks} />`}</main>`;
}
