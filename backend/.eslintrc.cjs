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
  ],
};
