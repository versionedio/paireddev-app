// Fails when the look can drift: a font size, colour or per-element token outside the shared roles.
// Run: node design/check-theme.mjs   (exit 1 on any finding)
import fs from 'node:fs';
import path from 'node:path';

const ROLES = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
const SVG_EXEMPT = /\.(axis|uc-|chart|gridline)|--sz|\.92em/;   // chart text is in viewBox units; avatar scales with its box
const css = fs.readFileSync('theme.css', 'utf8').split('\n');
const found = [];

let depth = 0, inRoot = false;
css.forEach((line, i) => {
  if (/^:root\s*\{/.test(line)) inRoot = true;
  const n = i + 1;
  if (!inRoot) {
    const size = line.match(/font-size:\s*([^;]*)/);
    if (size && !size[1].startsWith('var(--fs-') && !SVG_EXEMPT.test(line)) found.push(`theme.css:${n} font-size outside the text roles`);
    if (/#[0-9a-fA-F]{3,8}\b|\b(oklch|rgba?|hsla?)\(/.test(line) && !/color-mix|light-dark/.test(line)) found.push(`theme.css:${n} literal colour outside the token block`);
  }
  const tok = line.match(/^\s*--fs-([a-z0-9-]+):/);
  if (tok && !ROLES.includes(tok[1])) found.push(`theme.css:${n} --fs-${tok[1]} is a per-element size; use a text role`);
  if (inRoot && /^\}/.test(line)) inRoot = false;
});

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? (e.name === 'skills' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
walk('.').filter(f => f.endsWith('.js')).forEach(f => fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
  if (/font-?[sS]ize|#[0-9a-fA-F]{6}\b|oklch\(/.test(line) && !/^\s*\/\//.test(line)) found.push(`${f}:${i + 1} size/colour literal in JS`);
}));

console.log(found.length ? found.join('\n') + `\n${found.length} drift risk(s)` : 'no drift risks');
process.exit(found.length ? 1 : 0);
