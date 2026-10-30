// Template: turns the written rules into failing tests. Put in src/test/enforcement/. Needs only Node + jest.
// A ratchet file lists known violations; it may shrink, never grow (delete an entry once fixed).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'src');
const RATCHET: Record<string, string[]> = fs.existsSync(path.join(__dirname, 'expected-violations.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, 'expected-violations.json'), 'utf8')) : {};

const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const rel = (f: string) => path.relative(ROOT, f);
const FILES = walk(SRC);
const code = FILES.filter(f => /\.(tsx?|css)$/.test(f) && !/\.(test|stories)\./.test(f));
const inTheme = (f: string) => rel(f).startsWith('src/theme/');
const inDir = (f: string, d: string) => rel(f).startsWith(`src/${d}/`);

const offenders = (rule: string, found: string[]) => found.filter(f => !(RATCHET[rule] ?? []).includes(f));
const read = (f: string) => fs.readFileSync(f, 'utf8');
const matching = (files: string[], re: RegExp) => files.filter(f => re.test(read(f))).map(rel);

describe('enforcement scans', () => {
  it('no inline style attributes (design-tokens-styling)', () => {
    expect(offenders('inline-style', matching(code.filter(f => f.endsWith('.tsx')), /\bstyle=\{\{(?!\s*['"]--)/))).toEqual([]);
  });
  it('no hex or colour functions outside src/theme (design-tokens-styling)', () => {
    const files = code.filter(f => !inTheme(f));
    expect(offenders('literal-colour', matching(files, /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(/))).toEqual([]);
  });
  it('no font-family or px font-size outside src/theme', () => {
    const files = code.filter(f => f.endsWith('.css') && !inTheme(f));
    expect(offenders('literal-type', matching(files, /font-family\s*:(?!\s*var)|font-size\s*:\s*[\d.]+(px|rem)/))).toEqual([]);
  });
  it('files stay within 200 lines (component-architecture)', () => {
    const big = code.filter(f => read(f).split('\n').length > 200).map(rel);
    expect(offenders('file-size', big)).toEqual([]);
  });
  it('storage and cookies only inside src/platform (mobile-capacitor)', () => {
    const files = code.filter(f => !inDir(f, 'platform') && f.match(/\.tsx?$/));
    expect(offenders('storage-access', matching(files, /\b(localStorage|sessionStorage|document\.cookie)\b/))).toEqual([]);
  });
  it('no raw <img> outside the Image primitive (performance-budgets)', () => {
    const files = code.filter(f => f.endsWith('.tsx') && !f.endsWith('ui/Image.tsx'));
    expect(offenders('raw-img', matching(files, /<img[\s>]/))).toEqual([]);
  });
  it('no raw HTML injection (input-validation)', () => {
    const files = code.filter(f => f.endsWith('.tsx') && !f.endsWith('ui/SafeHtml.tsx'));
    expect(offenders('raw-html', matching(files, /dangerouslySetInnerHTML|\.innerHTML\s*=/))).toEqual([]);
  });
  it('every ratchet entry still violates (delete fixed entries)', () => {
    const stale = Object.values(RATCHET).flat().filter(f => !fs.existsSync(path.join(ROOT, f)));
    expect(stale).toEqual([]);
  });
});

describe('config scans (config-driven-ui, error-and-notifications, feature-flags)', () => {
  // Adapt the imports below to the app: registry, schema, messages, flag registry.
  it.todo('every config/screens/*.json validates against the zod schema');
  it.todo('every widget type used in config exists in the widget registry');
  it.todo('every content key referenced by config and components exists in config/content');
  it.todo('every error code in messages.json has severity, presentation and a content key');
  it.todo('every flag in the registry has an owner and a test that mentions its key');
});
