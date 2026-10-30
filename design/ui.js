// Component kit. Screens compose these and never carry their own colours or sizes.
// Variants map to classes in theme.css; to restyle, edit theme.css.
import { html, useState, useEffect } from './lib/react.js';
import { PEOPLE, PROJECTS } from './data/seed.js';
import { PILL_TONE, laneOf } from './lib/model.js';

const cx = (...a) => a.filter(Boolean).join(' ');

/* ------------------------------- icons ---------------------------------- */
const P = {
  spark: ['M12 2.5c.6 4.8 2.7 6.9 7.5 7.5-4.8.6-6.9 2.7-7.5 7.5-.6-4.8-2.7-6.9-7.5-7.5 4.8-.6 6.9-2.7 7.5-7.5z', 'fill'],
  up: 'M6 15l6-7 6 7', down: 'M6 9l6 6 6-6', check: 'M5 12.5l4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6L6 18',
  alert: 'M12 7v6M12 17h.01', arrow: 'M5 12h14M13 6l6 6-6 6', plus: 'M12 5v14M5 12h14', more: 'M5 12h.01M12 12h.01M19 12h.01',
  lock: 'M7 11V8a5 5 0 0110 0v3M6 11h12a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-7a1 1 0 011-1z',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  search: 'M11 5a6 6 0 100 12 6 6 0 000-12zM20 20l-4.2-4.2',
  branch: 'M7 4v12M7 20a2 2 0 100-4 2 2 0 000 4zM17 10a2 2 0 100-4 2 2 0 000 4zM17 10c0 5-10 3-10 6',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5', read: 'M5 4h14v16H5zM8.5 9h7M8.5 13h7', edit: 'M4 20l1-4L16 5l3 3L8 19z',
  terminal: 'M5 7l5 5-5 5M12 18h7', test: 'M5 12.5l4.5 4.5L19 7.5', deny: 'M12 4a8 8 0 100 16 8 8 0 000-16zM6.5 6.5l11 11',
  pause: 'M9 5v14M15 5v14', circle: 'M12 6a6 6 0 100 12 6 6 0 000-12z', note: 'M12 12h.01',
  inbox: 'M4 13l2-8h12l2 8v6H4zM4 13h5l1 2h4l1-2h5', list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  filter: 'M4 5h16l-6 7v6l-4 2v-8z', columns: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z',
  timer: 'M12 6a7 7 0 100 14 7 7 0 000-14zM12 10v4l2 2M9 2h6', box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9',
  chart: 'M4 20V10M10 20V4M16 20v-7M2 20h20', pulse: 'M3 12h4l3-8 4 16 3-8h4', upload: 'M12 16V4M6 10l6-6 6 6M5 20h14',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c0-3.3 2.8-5.5 6.500-5.500S15.500 16.700 15.500 20M17 5a3 3 0 010 6M18 14.800c2 .6 3.500 2.300 3.500 5.200',
  book: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11', info: 'M12 11v6M12 7.5h.01M12 3a9 9 0 100 18 9 9 0 000-18z',
  tune: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
};
export function Icon({ name, size = 16 }) {
  const d = P[name]; const fill = Array.isArray(d);
  return html`<svg class="icon" width=${size} height=${size} viewBox="0 0 24 24" aria-hidden="true"
    fill=${fill ? 'currentColor' : 'none'} stroke=${fill ? 'none' : 'currentColor'} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d=${fill ? d[0] : d} /></svg>`;
}

/* ------------------------------ controls -------------------------------- */
// variant: default | primary | agent | agent-solid | success | warn | ghost | danger-ghost | bare
export function Button({ variant = 'ghost', size, icon, iconOnly, full, off, running, children, ...rest }) {
  const cls = cx('btn', variant !== 'default' && `btn--${variant}`, size && `btn--${size}`, full && 'btn--full', iconOnly && 'btn--icon', off && 'btn--off', running && 'is-running');
  return html`<button class=${cls} type="button" disabled=${off || running || rest.disabled} ...${rest}>
    ${running ? html`<span class="spinner" />` : icon && html`<${Icon} name=${icon} size=${15} />`}${children}</button>`;
}
export const Chip = ({ on, children, ...rest }) => html`<button type="button" class=${cx('chip', on && 'is-on')} aria-pressed=${!!on} ...${rest}>${children}</button>`;

export function Segmented({ options, value, onChange, block, label }) {
  return html`<div class=${cx('seg', block && 'seg--block')} role="group" aria-label=${label}>
    ${options.map(o => {
      const [v, text] = Array.isArray(o) ? o : [o, o];
      return html`<button type="button" key=${v} class=${cx('seg__opt', value === v && 'is-on')} aria-pressed=${value === v} onClick=${() => onChange(v)}>${text}</button>`;
    })}</div>`;
}
export function Field({ label, error, hint, id, children }) {
  return html`<div class="field">${label && html`<label class="label" for=${id}>${label}</label>`}${children}
    ${error ? html`<div class="field__err" role="alert">${error}</div>` : hint && html`<div class="field__hint">${hint}</div>`}</div>`;
}
export const Input = ({ mono, bad, ...rest }) => html`<input class=${cx('input', mono && 'input--mono', bad && 'is-bad')} ...${rest} />`;
export const Textarea = ({ mono, bad, ...rest }) => html`<textarea class=${cx('textarea', mono && 'textarea--mono', bad && 'is-bad')} ...${rest} />`;
export const Select = ({ options, ...rest }) => html`<select class="select" ...${rest}>${options.map(o => html`<option value=${o.value} disabled=${o.disabled}>${o.label}</option>`)}</select>`;
export const Checkbox = props => html`<input type="checkbox" class="check" ...${props} />`;
export function SearchInput(props) {
  return html`<div class="search"><${Icon} name="search" size=${15} /><input class="input input--search" type="search" ...${props} /></div>`;
}

/* ------------------------------- tints ---------------------------------- */
// tone: neutral | faint | primary | agent | green | red | warn | info | teal
export const Badge = ({ tone = 'neutral', soft, children, ...rest }) => html`<span class=${cx('badge tint', `tone-${tone}`, soft && 'badge--soft')} ...${rest}>${children}</span>`;
export const Tag = ({ tone = 'neutral', children }) => html`<${Badge} tone=${tone}>${children}<//>`;
export function Pill({ kind = 'idle', children }) {
  const tone = PILL_TONE[kind] || 'neutral';
  return html`<span class=${cx('pill tint', `tone-${tone}`, (kind === 'ai' || kind === 'block') && 'pulse')}><span class="pill__dot" />${children}</span>`;
}
export function ProjectChip({ project, full }) {
  const p = typeof project === 'string' ? PROJECTS.find(x => x.id === project) : project;
  return html`<span class="proj" style=${{ '--h': p.hue }}>${full ? p.name : p.short}</span>`;
}
export function LaneBadge({ lane }) {
  const l = laneOf(lane);
  return html`<span class="lane-badge" style=${{ '--lh': l.hue, '--lc': l.chroma + 0.02 }}>${l.label}</span>`;
}
export function LaneDot({ lane }) {
  const l = laneOf(lane);
  return html`<span class="lane-dot" style=${{ '--lh': l.hue, '--lc': l.chroma }} />`;
}
export function Avatar({ who, size = 28, title }) {
  if (!who) return html`<span class="avatar avatar--none" style=${{ '--sz': size + 'px' }} title="Unassigned">—</span>`;
  const p = PEOPLE[who] || {};
  if (p.ai) return html`<span class="avatar avatar--agent" style=${{ '--sz': size + 'px' }} title=${title || p.name}><${Icon} name="spark" size=${Math.round(size * .5)} /></span>`;
  if (p.sys) return html`<span class="avatar avatar--system" style=${{ '--sz': size + 'px' }} title=${title || p.name}>○</span>`;
  return html`<span class="avatar" style=${{ '--sz': size + 'px', '--h': p.hue }} title=${title || p.name}>${p.initials}</span>`;
}
export const AvatarStack = ({ people, size = 22 }) => html`<span class="avatars">${people.slice(0, 3).map((w, i) => html`<${Avatar} key=${i} who=${w} size=${size} />`)}</span>`;
export const Spinner = () => html`<span class="spinner" />`;

/* ------------------------------ surfaces -------------------------------- */
export function Modal({ title, onClose, width = 540, footer, children }) {
  useEffect(() => { const f = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, []);
  return html`<div class="scrim" onClick=${onClose} />
    <div class="modal" style=${{ '--w': width + 'px' }} role="dialog" aria-modal="true" aria-label=${title}>
      <div class="modal__head"><h2 class="h3">${title}</h2><${Button} variant="bare" size="sm" iconOnly icon="x" onClick=${onClose} aria-label="Close" /></div>
      <div class="modal__body">${children}</div>
      ${footer && html`<div class="modal__foot">${footer}</div>`}</div>`;
}
export function Drawer({ onClose, children }) {
  useEffect(() => { const f = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, []);
  return html`<div class="scrim scrim--drawer" onClick=${onClose} /><aside class="drawer" role="dialog" aria-modal="true">${children}</aside>`;
}
export function Popover({ side = 'left', onClose, children }) {
  return html`<div class="popover-dismiss" onClick=${onClose} /><div class=${cx('popover', `popover--${side}`)}>${children}</div>`;
}
// Small dropdown anchored to its parent (parent needs position: relative).
export function Menu({ items, onClose, style }) {
  return html`<div class="popover-dismiss" style=${{ zIndex: 29 }} onClick=${e => { e.stopPropagation(); onClose(); }} />
    <div class="menu" style=${style} onClick=${e => e.stopPropagation()}>
      ${items.map(it => it.label && !it.run
        ? html`<div class="label menu__label">${it.label}</div>`
        : html`<button type="button" class=${cx('menu__item', it.on && 'is-on')} onClick=${() => { it.run(); onClose(); }}>${it.node || it.label}</button>`)}</div>`;
}
export const Tabs = ({ tabs, value, onChange }) => html`<div class="tabs" role="tablist">${tabs.map(t => html`
  <button type="button" role="tab" key=${t.id} class=${cx('tab', value === t.id && 'is-on')} aria-selected=${value === t.id} onClick=${() => onChange(t.id)}>
    ${t.label}${t.badge != null && t.badge !== '' && html`<span class="tab__count">${t.badge}</span>`}</button>`)}</div>`;
export const Toast = ({ text }) => text ? html`<div class="toast" role="status">${text}</div>` : null;
export const Empty = ({ icon = 'inbox', title, children }) => html`<div class="empty"><${Icon} name=${icon} size=${26} /><div class="h3">${title}</div><div class="small">${children}</div></div>`;
export const Callout = ({ tone = 'agent', title, children }) => html`<div class=${cx('callout', `tone-${tone}`)}>${title && html`<div class="label" style=${{ color: 'inherit' }}>${title}</div>`}${children}</div>`;

// Run-button used by triage, pre-flight and retro: same look everywhere.
export const RunButton = ({ running, idleLabel, runLabel, onClick, size }) =>
  html`<${Button} variant="agent" size=${size} icon=${running ? null : 'spark'} running=${running} onClick=${onClick}>${running ? runLabel : idleLabel}<//>`;

// Hover on desktop, tap on touch.
export function useHoverTap() {
  const [on, set] = useState(false);
  return [on, { onMouseEnter: () => set(true), onMouseLeave: () => set(false), onClick: e => { e.stopPropagation(); if (window.matchMedia('(hover: none)').matches) set(v => !v); } }];
}
export { cx };
