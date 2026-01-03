module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    // Project-specific rules can be added here
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'public/'],
};
