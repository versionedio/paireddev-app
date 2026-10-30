import { html, useState } from '../lib/react.js';
import { useStore } from '../store.js';
import { sendInvite, resendInvite, revokeInvite, togglePerm, toggleNotif, saveProvider, go } from '../api.js';
import { TEAM_ROWS, PERM_COLS, PERMS, NOTIF_COLS, NOTIFS, PEOPLE } from '../data/seed.js';
import { Icon, Button, Badge, Avatar, Tabs, Modal, Field, Input, Segmented, Select, Checkbox, cx } from '../ui.js';

const STATUS = { active: 'green', away: 'warn', 'read-only': 'teal' };
const ROLE_NOTE = { Requester: 'Can submit and vote in the portal. No board access.', Dev: 'Can own cards, run agents, and sign off review items.', Owner: 'Full access including cadence, releases, and invites.' };
const GATEWAY_HOST = { Bedrock: 'bedrock-runtime.us-east-1.amazonaws.com', Vertex: 'us-central1-aiplatform.googleapis.com', Foundry: 'nostackai.services.ai.azure.com' };
const TABS = [{ id: 'roster', label: 'Roster' }, { id: 'perms', label: 'Permissions' }, { id: 'notifs', label: 'Notifications' }, { id: 'providers', label: 'Providers' }];

function InviteModal({ onClose }) {
  const [email, setEmail] = useState(''); const [role, setRole] = useState('Dev'); const [err, setErr] = useState('');
  const send = () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr('Enter a full address like name@company.com.'); sendInvite(email, role); onClose(); };
  return html`<${Modal} title="Invite member" width=${470} onClose=${onClose} footer=${html`<span class="mono caption hint hide-sm">POST /v1/invites</span><${Button} onClick=${onClose}>Cancel<//><${Button} variant="primary" onClick=${send}>Send invite<//>`}>
    <${Field} label="Email" id="inv-email" error=${err}><${Input} id="inv-email" mono type="email" value=${email} bad=${!!err} placeholder="name@company.com" onInput=${e => { setEmail(e.target.value); setErr(''); }} /><//>
    <${Field} label="Role" hint=${ROLE_NOTE[role]}><${Segmented} label="Role" value=${role} onChange=${setRole} options=${['Requester', 'Dev', 'Owner']} /><//><//>`;
}

function Roster({ s }) {
  const [modal, setModal] = useState(false);
  return html`<div class="stack"><div class="row-wrap"><span class="caption grow">Agents appear in the roster like anyone else, but cannot be granted sign-off rights.</span><${Button} variant="primary" icon="plus" onClick=${() => setModal(true)}>Invite member<//></div>
    <div class="panel tbl2">${TEAM_ROWS.map(([who, role, status, sub, action]) => { const ag = who === 'claude'; return html`<div key=${who} class=${cx('tbl2__row', ag && 'is-agent')}>
      <${Avatar} who=${who} size=${32} /><div class="grow stack-sm" style=${{ gap: 0 }}><div class="row-wrap" style=${{ gap: '6px' }}><b class="small" style=${{ color: ag ? 'var(--agent-t)' : 'var(--t1)' }}>${PEOPLE[who].name}</b>${ag && html`<${Badge} tone="agent"><${Icon} name="spark" size=${10} />agent<//>`}</div><span class="mono caption truncate">${sub}</span></div>
      <span class="small hide-sm" style=${{ width: '110px' }}>${role}</span><${Badge} tone=${STATUS[status]}>${status}<//><span class="mono caption hide-sm" style=${{ width: '52px', textAlign: 'right' }}>${action}</span></div>`; })}</div>
    ${s.invites.length > 0 && html`<h2 class="h3">Pending invites</h2><div class="panel tbl2">${s.invites.map(i => html`<div class="tbl2__row is-pending" key=${i.email}>
      <span class="avatar avatar--none" style=${{ '--sz': '32px' }}>${i.email[0].toUpperCase()}</span><div class="grow stack-sm" style=${{ gap: 0 }}><span class="mono small truncate">${i.email}</span><span class="caption">${i.sent} · ${i.role}</span></div>
      <${Button} size="sm" onClick=${() => resendInvite(i.email)}>${s.resent[i.email] ? 'Sent ✓' : 'Resend'}<//><${Button} size="sm" variant="danger-ghost" onClick=${() => revokeInvite(i.email)}>Revoke<//></div>`)}</div>`}
    ${modal && html`<${InviteModal} onClose=${() => setModal(false)} />`}</div>`;
}

const Matrix = ({ cols, rows, grid, onToggle, locked }) => html`<div class="panel matrix-wrap"><div class="matrix" style=${{ '--n': cols.length }}>
  <div class="matrix__row matrix__head"><span />${cols.map(c => html`<span class="label matrix__col" key=${c}>${c}</span>`)}</div>
  ${rows.map(([name, note], r) => html`<div class="matrix__row" key=${name}><div class="stack-sm" style=${{ gap: 0 }}><b class="small" style=${{ color: 'var(--t1)' }}>${name}</b><span class="caption">${note}</span></div>
    ${cols.map((c, j) => { const lock = locked(r, j), on = grid[r][j]; return html`<button type="button" key=${c} class=${cx('toggle', on && 'is-on', lock && 'is-locked')} disabled=${lock} aria-pressed=${on} aria-label=${`${name} ${c}`} title=${lock ? 'Locked for agents' : ''} onClick=${() => onToggle(r, j)}>${lock ? html`<${Icon} name="lock" size=${12} />` : on ? html`<${Icon} name="check" size=${13} />` : ''}</button>`; })}</div>`)}</div></div>`;

function ProviderModal({ pk, p, onClose }) {
  const [key, setKey] = useState(''); const [routed, setRouted] = useState(!!p.routed); const [gw, setGw] = useState(p.gateway || 'Bedrock'); const [ep, setEp] = useState(p.endpoint || ''); const [err, setErr] = useState('');
  const save = () => { if (!key.trim()) return setErr('A key is required to connect. Nothing runs without one.'); saveProvider(pk, { apiKey: key.trim(), routed, gateway: gw, endpoint: ep }); onClose(); };
  return html`<${Modal} title=${(p.connected ? 'Manage ' : 'Connect ') + p.name} width=${480} onClose=${onClose} footer=${html`<span class="mono caption hint hide-sm">${p.connected ? 'PATCH' : 'POST'} /v1/org/providers/${pk}</span><${Button} onClick=${onClose}>Cancel<//><${Button} variant="primary" onClick=${save}>${p.connected ? 'Save' : 'Connect'}<//>`}>
    <${Field} label="API key" id="prov-key" error=${err} hint="Goes to the org secret store and is masked from then on."><${Input} id="prov-key" mono type="password" value=${key} bad=${!!err} placeholder=${p.connected ? p.key : 'sk-…'} onInput=${e => { setKey(e.target.value); setErr(''); }} /><//>
    ${pk === 'anthropic' && html`<div class="well sub-panel stack-sm"><label class="row" style=${{ alignItems: 'flex-start', cursor: 'pointer' }}><${Checkbox} checked=${routed} onChange=${() => setRouted(!routed)} /><span class="small"><b style=${{ color: 'var(--t1)' }}>Route through a cloud gateway</b><br /><span class="muted">AWS Bedrock, Google Vertex, or Microsoft Foundry. Inference stays inside your cloud account and billing.</span></span></label>
      ${routed && html`<${Field} label="Gateway"><${Segmented} label="Gateway" value=${gw} onChange=${setGw} options=${['Bedrock', 'Vertex', 'Foundry']} /><//><${Field} label="Endpoint" id="prov-ep"><${Input} id="prov-ep" mono value=${ep} placeholder=${GATEWAY_HOST[gw]} onInput=${e => setEp(e.target.value)} /><//>`}</div>`}<//>`;
}

export function Providers({ s }) {
  const [modal, setModal] = useState(null);
  return html`<div class="prov-grid">${Object.entries(s.providers).map(([k, p]) => html`<article key=${k} class=${cx('card prov', p.locked && 'is-locked')} title=${p.locked ? 'OpenAI models cannot be brokered through nostackai. You would run the execution environment yourself and point it at your own key; the board would see results, not the session.' : ''}>
    <div class="row"><span class=${cx('prov__mark', k === 'anthropic' && 'is-agent')}>${k === 'anthropic' ? html`<${Icon} name="spark" size=${13} />` : p.mark}</span><b class="grow">${p.name}</b><${Badge} tone=${p.connected ? 'green' : p.locked ? 'faint' : 'neutral'}>${p.connected ? 'Connected' : p.locked ? 'Unavailable' : 'Not connected'}<//></div>
    <p class="small muted">${{ anthropic: 'Runs Plan Preview and Live Session directly.', google: 'Available for triage, scoring and summaries. Not certified for write sessions on protected paths.', openai: 'Run the execution environment yourself and point it at your own key.' }[k]}</p>
    <${Button} variant=${p.connected ? 'ghost' : 'primary'} off=${p.locked && false} onClick=${() => !p.locked && setModal(k)} full>${p.locked ? 'Read the docs' : p.connected ? 'Manage' : 'Connect'}<//><span class="mono caption">${p.meta}</span></article>`)}
    ${modal && html`<${ProviderModal} pk=${modal} p=${s.providers[modal]} onClose=${() => setModal(null)} />`}</div>`;
}

export function Team({ initial = 'roster' }) {
  const s = useStore(); const [tab, setTab] = useState(initial);
  return html`<main class="page page--narrow"><header class="page-head"><div><span class="eyebrow">Team & access</span><h1 class="h1">Who can touch the board</h1><p class="lede">Roles, notifications and the AI providers your org has connected.</p></div></header>
    <div style=${{ marginBottom: 'var(--sp-5)' }}><${Tabs} tabs=${TABS} value=${tab} onChange=${setTab} /></div>
    ${tab === 'roster' && html`<${Roster} s=${s} />`}
    ${tab === 'perms' && html`<${Matrix} cols=${PERM_COLS} rows=${PERMS} grid=${s.perms} onToggle=${togglePerm} locked=${(r, j) => PERMS[r][0] === 'Agent' && j >= 2} />`}
    ${tab === 'notifs' && html`<${Matrix} cols=${NOTIF_COLS} rows=${NOTIFS.map(n => [n[1], '', n[2]])} grid=${s.notifs} onToggle=${toggleNotif} locked=${() => false} />`}
    ${tab === 'providers' && html`<${Providers} s=${s} />`}</main>`;
}
export const TeamPage = () => html`<${Team} key="roster" initial="roster" />`;
export const ProvidersPage = () => html`<${Team} key="prov" initial="providers" />`;
