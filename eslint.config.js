import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // Site scripts: classic browser globals plus the libraries loaded from
    // the page (jQuery, ScrollReveal).
    files: ['_scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.jquery,
        ScrollReveal: 'readonly',
        sr: 'writable',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
    },
  },
  {
    // Build tooling runs on Node as ES modules.
    files: ['gulpfile.js', 'build/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },
];
