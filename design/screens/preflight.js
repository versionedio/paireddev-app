// Shared by Releases and Deliveries: run button, per-branch verdicts, gate.
import { html, useState } from '../lib/react.js';
import { Icon, Button, Badge, ProjectChip, cx } from '../ui.js';

export function PreflightRows({ rows }) {
  const [hov, setHov] = useState(null);
  return html`<div class="stack-sm">${rows.map(r => { const bad = r.verdict !== 'clean'; return html`<div key=${r.id} class=${cx('pf-row', bad && 'is-bad')}
    onMouseEnter=${() => setHov(r.id)} onMouseLeave=${() => setHov(null)} onClick=${() => setHov(hov === r.id ? null : r.id)}>
    <div class="row" style=${{ alignItems: 'flex-start' }}><span class=${cx('verdict tint', bad ? 'tone-warn' : 'tone-green')}><${Icon} name=${bad ? 'alert' : 'check'} size=${13} /></span>
      <div class="grow stack-sm" style=${{ gap: '3px' }}><div class="row-wrap"><span class="mono caption">${r.id}</span><span class="small" style=${{ color: 'var(--t1)', fontWeight: 500 }}>${r.title}</span></div>
        <span class="small muted">${r.assess}</span></div>
      <${Badge} tone=${bad ? 'warn' : 'green'}>${r.verdictLabel || (bad ? 'overlap' : 'clean')}<//></div>
    <div class="row-wrap">${r.paths.map(p => html`<span class="pathchip mono" key=${p}>${p}</span>`)}</div>
    ${hov === r.id && html`<div class="callout callout--agent tone-agent"><span class="label" style=${{ color: 'var(--agent-t)' }}>Claude's reasoning</span><div style=${{ marginTop: '4px' }}>${r.reasoning}</div></div>`}</div>`; })}</div>`;
}

export function PreflightGate({ conflicts, count, clearedTitle = 'Cleared to release', promoteLabel, onPromote, onDismiss }) {
  const ok = conflicts === 0;
  return html`<div class=${cx('gate', ok && 'is-clear')}><div class="row"><${Icon} name=${ok ? 'check' : 'lock'} size=${18} /><b class="h3">${ok ? clearedTitle : `${conflicts} conflict${conflicts > 1 ? 's' : ''} to resolve`}</b></div>
    <p class="small">${ok ? 'Nothing overlaps. Promoting writes a release event to the audit log.' : 'Claude has named the overlap and proposed an order, but sequencing a release is a product call. A human resolves it, then re-runs the check.'}</p>
    <div class="row-wrap"><${Button} variant="success" off=${!ok} onClick=${onPromote}>${promoteLabel(count)}<//><${Button} variant="ghost" onClick=${onDismiss}>Dismiss<//></div></div>`;
}
export { ProjectChip };
