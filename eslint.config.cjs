module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'public/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: { reportUnusedDisableDirectives: true },
    linterOptions: { reportUnusedDisableDirectives: true },
    rules: {
      // Add project-specific rules here as needed
    },
  },
];
