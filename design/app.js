import { html, render, useEffect } from './lib/react.js';
import { useStore } from './store.js';
import { go, openDocs, setTheme, setCadence, setScope, setRole, setExecProvider } from './api.js';
import { CONFIG } from './config.js';
import { GROUPS, PROJECTS, PEOPLE } from './data/seed.js';
import { scopeName } from './lib/model.js';
import { Icon, Button, Segmented, Select, Popover, Avatar, Toast, Empty, cx } from './ui.js';
import { useState } from './lib/react.js';
import { Portal } from './screens/portal.js';
import { Triage } from './screens/triage.js';
import { Board } from './screens/board.js';
import { ItemDrawer } from './screens/drawer.js';
import { Backlog } from './screens/backlog.js';
import { Deliveries } from './screens/deliveries.js';
import { Releases } from './screens/releases.js';
import { Activity } from './screens/activity.js';
import { Help } from './screens/help.js';
import { Sprints } from './screens/sprints.js';
import { Analytics } from './screens/analytics.js';
import { TeamPage, ProvidersPage } from './screens/team.js';
import { AgentConfig } from './screens/agent.js';

// Nav is data: adding a screen is one entry here plus one entry in PAGES.
const NAV = [
  { id: 'portal', label: 'Portal', icon: 'inbox' },
  { id: 'backlog', label: 'Backlog', icon: 'list', count: s => s.items.filter(i => i.lane === 'backlog' && inScopeOf(s, i)).length },
  { id: 'triage', label: 'Triage', icon: 'filter' },
  { id: 'board', label: 'Board', icon: 'columns', count: s => s.items.filter(i => !['backlog', 'done'].includes(i.lane) && inScopeOf(s, i)).length },
  { id: 'sprints', label: 'Sprints', icon: 'timer', when: s => s.cadence !== 'flow' },
  { id: 'deliveries', label: 'Deliveries', icon: 'box', count: s => s.deliveries.length },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'activity', label: 'Activity', icon: 'pulse' },
  { id: 'releases', label: 'Releases', icon: 'upload', count: s => s.items.filter(i => i.lane === 'staged' && inScopeOf(s, i)).length },
];
import { inScope } from './lib/model.js';
const inScopeOf = (s, i) => inScope(s.scope, i);

const PAGES = { help: Help, portal: Portal, triage: Triage, board: Board, backlog: Backlog, deliveries: Deliveries, releases: Releases, activity: Activity, sprints: Sprints, analytics: Analytics, team: TeamPage, providers: ProvidersPage, agent: AgentConfig };
const PHASE = { backlog: 2, deliveries: 2, releases: 2, activity: 2, sprints: 3, analytics: 3, team: 3, agent: 3, providers: 3 };
const TITLES = { backlog: 'Backlog', deliveries: 'Deliveries', releases: 'Releases', activity: 'Activity', sprints: 'Sprints', analytics: 'Analytics', team: 'Team & permissions', agent: 'Agent configuration', providers: 'AI providers' };

function Placeholder({ page }) {
  return html`<main class="page page--narrow"><${Empty} icon="timer" title=${(TITLES[page] || 'This screen') + ' arrives in phase ' + (PHASE[page] || 2)}>
    This screen is planned for phase 3. Its help page (book icon, top right) is already available.<//></main>`;
}

const ROLE_WHO = { requester: 'lena', owner: 'maya', agent: 'claude' };
PEOPLE.lena = PEOPLE.lena || { name: 'Lena Kovač', initials: 'LK', hue: 300 };

function ScopePopover({ s, onClose }) {
  const row = (id, label, sub, sq) => html`<button type="button" key=${id} class=${cx('menu__item', s.scope === id && 'is-on')} style=${{ position: 'static' }}
    onClick=${() => { setScope(id); onClose(); }}>${sq ? html`<span class="scope__sq" />` : null}<span class="grow">${label}</span><span class="caption">${sub}</span></button>`;
  return html`<${Popover} side="left" onClose=${onClose}>
    <div class="stack-sm"><span class="label">Scope</span>${row('all', 'All projects', 'no filter')}</div>
    <div class="stack-sm"><span class="label">Groups</span>${s.groups.map(g => row(g.id, g.name, g.projects.length + ' projects', true))}</div>
    <div class="stack-sm"><span class="label">Projects</span>${PROJECTS.map(p => row(p.id, p.name, p.short))}</div><//>`;
}

function SettingsPopover({ s, onClose }) {
  const cad = s.cadence;
  const opts = Object.entries(s.providers).map(([k, p]) => ({ value: k, label: p.name + (p.connected ? '' : p.locked ? ' (not supported)' : ' (not connected)'), disabled: !p.connected }));
  const route = id => { onClose(); go(id); };
  return html`<${Popover} side="right" onClose=${onClose}>
    <div class="stack-sm"><span class="label">Cadence</span>
      <${Segmented} label="Cadence" value=${cad} onChange=${setCadence} options=${[['flow', 'Flow'], ['1', '1w'], ['2', '2w'], ['3', '3w'], ['4', '4w']]} />
      <p class="caption">${cad === 'flow' ? 'Continuous. Analytics shows cumulative flow, cycle time, throughput and aging.' : `${cad}-week sprints. Adds a Sprints screen and burndown and velocity in Analytics.`}</p></div>
    <div class="stack-sm"><span class="label">Viewing as</span>
      <${Segmented} label="Viewing as" value=${s.role} onChange=${setRole} options=${[['requester', 'Requester'], ['owner', 'Owner'], ['agent', 'Agent']]} /></div>
    <div class="stack-sm"><span class="label">Execution provider</span>
      <${Select} id="exec-provider" value=${s.execProvider} onChange=${e => setExecProvider(e.target.value)} options=${opts} />
      <p class="caption">Plan Preview and Live Session on this project run against ${s.providers[s.execProvider].name}.</p></div>
    <div class="stack-sm">
      ${[['agent', 'Agent configuration'], ['team', 'Team, permissions & notifications'], ['providers', 'AI providers (org)']].map(([id, label]) => html`
        <${Button} variant="bare" key=${id} full onClick=${() => route(id)}><span class="grow" style=${{ textAlign: 'left' }}>${label}</span><${Icon} name="arrow" size=${14} /><//>`)}
    </div><//>`;
}

function useEffectiveDark(theme) {
  return theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function Shell() {
  const s = useStore();
  const [pop, setPop] = useState(null);
  useEffect(() => {
    const el = document.documentElement;
    s.theme === 'system' ? el.removeAttribute('data-theme') : el.setAttribute('data-theme', s.theme);
    el.setAttribute('data-density', CONFIG.density);
  }, [s.theme]);
  useEffect(() => {
    const f = () => go((location.hash || '#board').slice(1));
    window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f);
  }, []);

  const nav = NAV.filter(n => !n.when || n.when(s));
  const Page = PAGES[s.page];
  const dark = useEffectiveDark(s.theme);
  const closePop = () => setPop(null);
  const navClick = id => { closePop(); go(id); };

  return html`
    <header class="header">
      <button class="brand" type="button" onClick=${() => navClick('board')}><span class="brand__mark">P</span><span class="hide-sm">PairedDev</span></button>
      <nav class="nav" aria-label="Screens">${nav.map(n => html`
        <button type="button" key=${n.id} class=${cx('nav__item', s.page === n.id && 'is-on')} onClick=${() => navClick(n.id)}>${n.label}
          ${n.count && html`<span class="nav__count">${n.count(s)}</span>`}</button>`)}</nav>
      <span class="spacer" />
      <button type="button" class="scope" aria-haspopup="true" onClick=${() => setPop(pop === 'scope' ? null : 'scope')}>
        <span class="scope__sq" /><span class="scope__name">${scopeName(s.scope)}</span><${Icon} name="down" size=${13} /></button>
      <span class="api-dot hide-sm" title=${CONFIG.apiHost} />
      <${Button} variant="ghost" size="sm" iconOnly icon="book" aria-label="Help for this page" title="Help for this page" onClick=${() => { closePop(); openDocs(s.page === 'help' ? s.docs || 'overview' : s.page); }} />
      <${Button} variant="ghost" size="sm" iconOnly icon=${dark ? 'sun' : 'moon'} aria-label="Toggle theme" onClick=${() => setTheme(dark ? 'light' : 'dark')} />
      <${Button} variant="ghost" size="sm" iconOnly icon="settings" aria-label="Project settings" onClick=${() => setPop(pop === 'settings' ? null : 'settings')} />
      <span class="identity hide-sm"><${Avatar} who=${ROLE_WHO[s.role]} size=${28} /></span>
    </header>
    ${pop === 'scope' && html`<${ScopePopover} s=${s} onClose=${closePop} />`}
    ${pop === 'settings' && html`<${SettingsPopover} s=${s} onClose=${closePop} />`}
    <div id="main" style=${{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>${Page ? html`<${Page} />` : html`<${Placeholder} page=${s.page} />`}</div>
    <nav class="bottom-nav" aria-label="Screens">${nav.map(n => html`
      <button type="button" key=${n.id} class=${cx('bottom-nav__item', s.page === n.id && 'is-on')} onClick=${() => navClick(n.id)}>
        <${Icon} name=${n.icon} size=${20} />${n.label}${n.count && html`<span class="bottom-nav__badge">${n.count(s)}</span>`}</button>`)}</nav>
    ${s.open && html`<${ItemDrawer} />`}
    <${Toast} text=${s.toast} />`;
}

render(html`<${Shell} />`, document.getElementById('app'));
