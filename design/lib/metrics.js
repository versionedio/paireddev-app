// Analytics series, computed from the raw 90-day data on every range change.
import { CFD90, BURN, LANES, SPRINT_PAST, AUDIT } from '../data/seed.js';

export function agingDays(it) {
  let h = 0; for (let i = 0; i < it.id.length; i++) h += it.id.charCodeAt(i) * (i + 1);
  return 1 + ((h * 31) % 14);
}
export const agingTone = d => (d > 8 ? 'red' : d > 4 ? 'warn' : 'green');

// Stacked bands, Done at the baseline. Returns paths in a 620x300 box.
export function cumulativeFlow(range, W = 600, H = 252, X0 = 34, Y0 = 16) {
  const data = CFD90.slice(-range), n = data.length;
  const totals = data.map(d => d.reduce((a, b) => a + b, 0));
  const max = Math.max(10, Math.ceil(Math.max(...totals) / 10) * 10);
  const px = i => X0 + (n < 2 ? 0 : i / (n - 1)) * (W - X0), py = v => Y0 + (1 - v / max) * (H - Y0);
  let below = data.map(() => 0); const bands = [];
  for (let li = 6; li >= 0; li--) {
    const top = data.map((d, i) => below[i] + d[li]);
    const pts = data.map((_, i) => `${px(i).toFixed(1)},${py(top[i]).toFixed(1)}`).concat(data.map((_, i) => n - 1 - i).map(i => `${px(i).toFixed(1)},${py(below[i]).toFixed(1)}`));
    bands.push({ lane: LANES[li], points: pts.join(' ') }); below = top;
  }
  const ticks = [0, 1, 2, 3, 4].map(k => max * k / 4);
  return { bands, W, H, X0,
    grid: ticks.map(v => ({ y: py(v), label: Math.round(v) })),
    xLabels: [0, 1, 2, 3].map(k => { const i = Math.round(k / 3 * (n - 1)); return { x: px(i), label: n - 1 - i === 0 ? 'today' : '-' + (n - 1 - i) + 'd' }; }) };
}

export function throughput(range, W = 380, H = 118, X0 = 26) {
  const weeks = Math.max(3, Math.floor(range / 7)), series = [];
  for (let w = weeks; w > 0; w--) {
    const a = CFD90[CFD90.length - 1 - w * 7] || CFD90[0], b = CFD90[CFD90.length - 1 - (w - 1) * 7] || CFD90[CFD90.length - 1];
    series.push(Math.max(0, b[6] - a[6]));
  }
  const max = Math.max(1, ...series), px = i => X0 + (series.length < 2 ? 0 : i / (series.length - 1)) * (W - X0), py = v => 8 + (1 - v / max) * (H - 8);
  const last = series[series.length - 1], first = series[0];
  return { W, H, X0, series, points: series.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' '),
    dots: series.map((v, i) => ({ x: px(i), y: py(v) })), grid: [0, .5, 1].map(k => ({ y: py(max * k), label: Math.round(max * k) })),
    xLabels: series.map((_, i) => ({ x: px(i), label: i === series.length - 1 ? 'now' : 'w' + (series.length - i - 1) })).filter((_, i) => i % Math.ceil(series.length / 5) === 0 || i === series.length - 1),
    trend: last >= first ? `Trending up, ${last} last week.` : `Trending down, ${last} last week.` };
}

export function burndown(sprint, W = 600, H = 196, X0 = 34, Y0 = 14) {
  const D = sprint.days, planned = sprint.planned, el = Math.min(sprint.elapsed, D);
  const px = i => X0 + i / D * (W - X0), py = v => Y0 + (1 - v / planned) * (H - Y0);
  const act = Array.from({ length: el + 1 }, (_, i) => planned - (BURN[i] || 0));
  const ticks = [0, 1, 2, 3].map(k => planned * k / 3);
  return { W, H, X0, done: planned - act[act.length - 1], el, D, planned,
    target: [0, D].map(i => `${px(i).toFixed(1)},${py(planned * (1 - i / D)).toFixed(1)}`).join(' '),
    actual: act.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' '),
    area: act.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).concat([`${px(el).toFixed(1)},${py(0).toFixed(1)}`, `${px(0).toFixed(1)},${py(0).toFixed(1)}`]).join(' '),
    dots: act.map((v, i) => ({ x: px(i), y: py(v) })), grid: ticks.map(v => ({ y: py(v), label: Math.round(v) })),
    xLabels: [0, 2, 4, 6, 8, 10].filter(i => i <= D).map(i => ({ x: px(i), label: 'd' + i })) };
}

export function velocity(past, active, doneNow) {
  const list = past.slice(0, 4).reverse().concat([{ name: active.name, shipped: doneNow, live: true }]);
  const max = Math.max(1, ...list.map(v => v.shipped));
  const avg = Math.round(past.reduce((x, p) => x + p.shipped, 0) / past.length * 10) / 10;
  return { bars: list.map(v => ({ ...v, label: v.name.replace('Sprint ', 'S'), pct: Math.round(v.shipped / max * 100) })), note: `Rolling average ${avg} per sprint.` };
}

// Retro digest: seeded groups plus an outlier group derived live from aging.
export function retroGroups(flight) {
  const g = [
    ['Merge-conflict escalations', '2 this sprint · both on queue/retry.ts', 'red', [['claude', 'stopped and asked which backoff strategy wins', 'ITR-241', '2h ago'], ['claude', 'flagged a stale branch before opening a PR', 'ITR-145', '3d ago']]],
    ['Human overrides of agent pre-checks', '3 this sprint', 'agent', [['maya', 'unchecked "tests pass" — the fixture was edited, not the behaviour', 'ITR-118', '5h ago'], ['devin', 'unchecked "docs updated" — the API reference did need a change', 'ITR-104', '1d ago'], ['sana', 're-ran the suite before signing "tests pass"', 'ITR-095', '9h ago']]],
    ['Rejected sign-offs', '1 this sprint', 'warn', [['maya', 'declined sign-off on "no secrets committed" pending a key rotation', 'ITR-160', '11h ago']]],
    ['Cycle-time outliers', 'cards over 8 days in one column', 'info', flight.filter(x => x.days > 8).map(x => ['system', `has sat in ${LANES.find(l => l.id === x.it.lane).label} for ${x.days} days`, x.it.id, 'now'])],
  ];
  return g.filter(x => x[3].length).map(([label, note, tone, rows]) => ({ label, note, tone, rows }));
}
export { SPRINT_PAST, AUDIT };
