// ADR-007 rule 1: any domain may read any table, exactly one domain may write it. The reading
// half needs no rule — cross-domain joins are the reason this is a monolith. The writing half is
// enforced below.
//
// Known and accepted gap: only writes that name the model are caught. A row fetched into a
// variable and then written (`const c = await Client.findByPk(id); c.update(…)`) escapes, because
// ESLint has no type information for a local variable. Narrowed by returning data rather than live
// Sequelize instances from domain APIs; otherwise it rests on review. See backlog item 7.
const TABLE_OWNERS = {
  Client: 'client',
  Subscription: 'subscription',
  Plan: 'plan',
  Menu: 'menu',
  Appointment: 'evaluation',
  User: 'user',
  LoginEvent: 'login-event',
  ClientHistory: 'client-history',
  Payment: 'finance',
  Expense: 'finance',
  ExpenseCategory: 'finance',
};

const WRITE_METHODS = ['create', 'update', 'destroy', 'bulkCreate'];

// Copied from airbnb-base. A rule's options replace rather than merge, so setting
// no-restricted-syntax below would drop these four in domain files if they were not restated.
const AIRBNB_RESTRICTED_SYNTAX = [
  {
    selector: 'ForInStatement',
    message:
      'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
  },
  {
    selector: 'ForOfStatement',
    message:
      'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
  },
  {
    selector: 'LabeledStatement',
    message:
      'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
  },
  {
    selector: 'WithStatement',
    message:
      '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
  },
];

const foreignWriteBans = (ownedModels) =>
  Object.entries(TABLE_OWNERS)
    .filter(([model]) => !ownedModels.includes(model))
    .map(([model, owner]) => ({
      selector: `CallExpression[callee.object.name='${model}'][callee.property.name=/^(${WRITE_METHODS.join('|')})$/]`,
      message: `${model} is owned by the ${owner} domain — call its public function instead of writing the model here. Reading it is fine.`,
    }));

// A domain may own more than one table (finance owns three), so the models are grouped by owner
// first: one override per domain listing every model it owns, never one override per model.
const modelsByOwner = Object.entries(TABLE_OWNERS).reduce((acc, [model, owner]) => {
  acc[owner] = [...(acc[owner] ?? []), model];
  return acc;
}, {});

// One override per owning domain, each allowing only its own models. Overrides are last-match-wins
// for a given rule, so these must come after the catch-all and cannot be merged into it.
const ownershipOverrides = [
  { files: ['src/domains/**/*.ts'], owns: [] },
  ...Object.entries(modelsByOwner).map(([owner, models]) => ({
    files: [`src/domains/${owner}/**/*.ts`],
    owns: models,
  })),
].map(({ files, owns }) => ({
  files,
  excludedFiles: ['**/*.test.ts'],
  rules: {
    'no-restricted-syntax': ['error', ...AIRBNB_RESTRICTED_SYNTAX, ...foreignWriteBans(owns)],
  },
}));

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
    // ADR-007: utils is the shared kernel. Leaf modules only, so anything may import it.
    {
      files: ['src/utils/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/domains/*', '**/domains/**'],
                message:
                  'utils holds leaf modules only. Code that needs a domain belongs in that domain.',
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
    // Last, so the per-owner allowances win over the catch-all they follow.
    ...ownershipOverrides,
  ],
};
