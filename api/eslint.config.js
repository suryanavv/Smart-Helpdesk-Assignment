import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off', // Allow console in backend
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '**/*.test.ts', '**/*.spec.ts', '**/*.ts'],
  },
];
