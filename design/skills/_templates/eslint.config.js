// Template: enforces component-architecture, design-tokens-styling, input-validation, frontend-security, mobile-capacitor.
// Needs: eslint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const noInlineStyle = { selector: "JSXAttribute[name.name='style']", message: 'No inline styles. Use a CSS Module class or a variant prop (design-tokens-styling).' };
const noRawHtml = { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: 'Use the SafeHtml primitive (input-validation).' };
const noRawImg = { selector: "JSXOpeningElement[name.name='img']", message: 'Use the Image primitive (performance-budgets).' };
const noEval = { selector: "CallExpression[callee.name='eval'], NewExpression[callee.name='Function']", message: 'eval and new Function are banned (input-validation).' };

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      complexity: ['error', 8],
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': ['error', noInlineStyle, noRawHtml, noRawImg, noEval],
      'no-restricted-globals': ['error', 'localStorage', 'sessionStorage', 'Capacitor'],
      'no-restricted-properties': ['error',
        { object: 'document', property: 'cookie', message: 'Cookies go through src/platform.' },
        { object: 'window', property: 'localStorage', message: 'Storage goes through src/platform.' },
        { property: 'innerHTML', message: 'Render text, or use SafeHtml (input-validation).' }],
      'no-restricted-imports': ['error', { patterns: [
        { group: ['@capacitor/*'], message: 'Capacitor plugins only inside src/platform/ (mobile-capacitor).' },
        { group: ['**/flags/store'], message: 'Read flags through useFlag or <Feature> (feature-flags).' }] }],
    },
  },
  { // the sanctioned homes for the things banned above
    files: ['src/platform/**', 'src/flags/**', 'src/components/ui/Image.tsx', 'src/components/ui/SafeHtml.tsx', 'src/**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-globals': 'off', 'no-restricted-properties': 'off', 'no-restricted-imports': 'off', 'no-restricted-syntax': 'off', 'max-lines-per-function': 'off' },
  },
);
