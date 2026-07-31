module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/prefer-default-export': 'off',
    // Named imports only — `import * as x` hides what a module is actually used for.
    'import/no-namespace': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: ['**/*.test.ts', '**/jest.config.ts'] },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
  },
  overrides: [
    {
      files: ['**/*.test.ts'],
      env: { jest: true },
      parserOptions: { project: './tsconfig.eslint.json', tsconfigRootDir: __dirname },
    },
    {
      files: ['src/models/*.ts'],
      rules: { 'import/no-cycle': 'off' },
    },
    // ADR-007: a domain is reached through its index, and controllers compose domains, not models.
    {
      files: ['src/domains/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../*/_helpers'],
                message:
                  "_helpers is private to its domain. Promote the function to its own file and export it from the domain's index.",
              },
              {
                group: ['../*/*', '!../../**', '!../*/index', '!../*/_helpers'],
                message:
                  'Import another domain through its index only, never a function file directly.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/controllers/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/models/*'],
                message: 'Controllers never import models. Call the owning domain instead.',
              },
            ],
          },
        ],
      },
    },
  ],
};
