// Shared chrome + Mermaid rendering for the architecture pack. Needs network for the two CDN loads.
const PAGES = [
  ['index.html', 'Overview'],
  ['hld.html', 'HLD'],
  ['data-model.html', 'Entities'],
  ['backend-assets.html', 'Logic blocks · Glyphs · Agents'],
  ['integrations.html', 'Connectors · AI · Access'],
  ['api-map.html', 'Requirement map'],
  ['gaps.html', 'Gaps'],
  ['build-plan.html', 'Build plan'],
];

const here = location.pathname.split('/').pop() || 'index.html';
const nav = document.createElement('header');
nav.className = 'top';
nav.innerHTML =
  '<a class="brand" href="index.html"><i>P</i>PairedDev backend</a>' +
  PAGES.map(([h, t]) => `<a class="nav" href="${h}"${h === here ? ' aria-current="page"' : ''}>${t}</a>`).join('') +
  '<span class="sp"></span><button id="theme" type="button" aria-label="Toggle light or dark theme"></button>';
document.body.prepend(nav);

const stored = (() => { try { return localStorage.getItem('pd-docs-theme'); } catch { return null; } })();
if (stored) document.documentElement.dataset.theme = stored;
const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

const themeBtn = () => document.getElementById('theme');
const paintBtn = () => { themeBtn().textContent = isDark() ? '☀ Light' : '☾ Dark'; themeBtn().title = 'Switch to ' + (isDark() ? 'light' : 'dark') + ' theme'; };
paintBtn();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!document.documentElement.dataset.theme) { paintBtn(); render(); } });

const sources = new Map();
function themeVars() {
  const d = isDark();
  return d
    ? { background: 'transparent', primaryColor: '#2a3140', primaryTextColor: '#e8eaf0', primaryBorderColor: '#5b6478', lineColor: '#8b93a7', secondaryColor: '#262b36', tertiaryColor: '#1d212a', fontFamily: 'Instrument Sans, Helvetica, sans-serif', fontSize: '15px', noteBkgColor: '#33301f', noteTextColor: '#f0e6c0', actorBkg: '#2a3140', actorBorder: '#5b6478', actorTextColor: '#e8eaf0', signalColor: '#aab1c3', signalTextColor: '#e8eaf0', labelBoxBkgColor: '#2a3140', labelTextColor: '#e8eaf0', loopTextColor: '#aab1c3', edgeLabelBackground: '#1d212a', attributeBackgroundColorOdd: '#232834', attributeBackgroundColorEven: '#1d212a' }
    : { background: 'transparent', primaryColor: '#eef1f8', primaryTextColor: '#1e2230', primaryBorderColor: '#9aa3b8', lineColor: '#6b7389', secondaryColor: '#f4f6fb', tertiaryColor: '#ffffff', fontFamily: 'Instrument Sans, Helvetica, sans-serif', fontSize: '15px', noteBkgColor: '#fff6d6', noteTextColor: '#4a3d10', actorBkg: '#eef1f8', actorBorder: '#9aa3b8', actorTextColor: '#1e2230', signalColor: '#4a5168', signalTextColor: '#1e2230', labelBoxBkgColor: '#eef1f8', labelTextColor: '#1e2230', edgeLabelBackground: '#ffffff', attributeBackgroundColorOdd: '#f4f6fb', attributeBackgroundColorEven: '#ffffff' };
}

async function render() {
  const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.esm.min.mjs');
  mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: themeVars(), securityLevel: 'strict', flowchart: { htmlLabels: true, curve: 'basis' }, er: { useMaxWidth: false } });
  let n = 0;
  for (const el of document.querySelectorAll('pre.mermaid, .mermaid-done')) {
    if (!sources.has(el)) {
      // The HTML parser turns <br/> in a <pre> into elements; innerHTML keeps them, a textarea decodes entities.
      const t = document.createElement('textarea');
      t.innerHTML = el.innerHTML;
      sources.set(el, t.value);
    }
    try {
      const { svg } = await mermaid.render('m' + n++ + Date.now(), sources.get(el));
      el.classList.add('mermaid-done');
      el.innerHTML = svg;
      // Fit the figure by default; an Expand button on the caption draws it at natural size and scrolls.
      const s = el.querySelector('svg');
      const vb = s && s.viewBox && s.viewBox.baseVal;
      const fig = el.closest('.fig');
      if (vb && vb.width && fig) {
        const natural = Math.round(vb.width);
        const expanded = fig.dataset.expanded === '1';
        s.style.maxWidth = expanded ? 'none' : '100%';
        if (expanded) s.setAttribute('width', String(natural));
        const cap = fig.querySelector('figcaption');
        if (cap && !cap.querySelector('button') && natural > el.parentElement.clientWidth + 40) {
          const b = document.createElement('button');
          b.type = 'button'; b.textContent = 'Expand'; b.className = 'expand';
          b.addEventListener('click', () => {
            fig.dataset.expanded = fig.dataset.expanded === '1' ? '0' : '1';
            b.textContent = fig.dataset.expanded === '1' ? 'Fit' : 'Expand';
            const t = el.querySelector('svg');
            t.style.maxWidth = fig.dataset.expanded === '1' ? 'none' : '100%';
            if (fig.dataset.expanded === '1') t.setAttribute('width', String(natural)); else t.setAttribute('width', '100%');
          });
          cap.appendChild(b);
        }
      }
    } catch (e) {
      el.innerHTML = `<div class="diagram-err">Diagram failed: ${String(e.message || e).slice(0, 300)}</div>`;
    }
  }
}

document.getElementById('theme').addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('pd-docs-theme', next); } catch { /* storage blocked */ }
  paintBtn();
  render();
});
render();
