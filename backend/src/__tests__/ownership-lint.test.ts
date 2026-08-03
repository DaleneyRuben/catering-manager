import path from 'path';
import { ESLint } from 'eslint';

// ADR-007 rule 1: any domain may read any table, exactly one domain may write it. Item 7 makes
// that enforceable instead of remembered. These tests lint invented source text against the real
// .eslintrc.cjs, so the config itself is what is under test.

const backendRoot = path.resolve(__dirname, '../..');
const eslint = new ESLint({ cwd: backendRoot });

const OWNERSHIP: ReadonlyArray<readonly [model: string, owner: string]> = [
  ['Client', 'client'],
  ['Subscription', 'subscription'],
  ['Plan', 'plan'],
  ['Menu', 'menu'],
  ['Appointment', 'evaluation'],
  ['User', 'user'],
  ['LoginEvent', 'login-event'],
  ['ClientHistory', 'client-history'],
];

// Every domain has an index.ts by construction, so these paths survive files being renamed.
const fileIn = (domain: string) => `src/domains/${domain}/index.ts`;

const ownershipErrorsIn = async (domain: string, code: string) => {
  const [result] = await eslint.lintText(code, { filePath: fileIn(domain) });
  return result.messages.filter((m) => m.ruleId === 'no-restricted-syntax');
};

const writeCall = (model: string, method: string) =>
  `import ${model} from '../../models/${model}';\n\n` +
  `export const run = async () => {\n  await ${model}.${method}({} as never);\n};\n`;

describe('ownership lint', () => {
  describe('the owning domain may write its own table', () => {
    it.each(OWNERSHIP)('%s may be written from %s', async (model, owner) => {
      const errors = await ownershipErrorsIn(owner, writeCall(model, 'create'));

      expect(errors).toHaveLength(0);
    });
  });

  describe('every other domain may not', () => {
    it.each(OWNERSHIP)('%s may not be written from report', async (model, owner) => {
      const errors = await ownershipErrorsIn('report', writeCall(model, 'create'));

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain(owner);
    });
  });

  it.each(['create', 'update', 'destroy', 'bulkCreate'])(
    'rejects %s, not just create',
    async (method) => {
      const errors = await ownershipErrorsIn('report', writeCall('Client', method));

      expect(errors).toHaveLength(1);
    },
  );

  // The point of the monolith: joins across other domains' tables are allowed and common.
  it('leaves reads from any domain alone', async () => {
    const code =
      "import Client from '../../models/Client';\n\n" +
      'export const run = async () => {\n' +
      '  const rows = await Client.findAll();\n' +
      '  return Client.findByPk(1) ?? rows;\n};\n';

    expect(await ownershipErrorsIn('report', code)).toHaveLength(0);
  });

  // Known and accepted gap, recorded so a future change to it is deliberate: ESLint has no type
  // information for a local variable, so a row fetched into a variable and then written escapes
  // the rule. Every ownership violation this backlog has actually found took this shape.
  it('does not catch a write through a fetched instance', async () => {
    const code =
      "import Client from '../../models/Client';\n\n" +
      'export const run = async () => {\n' +
      '  const client = await Client.findByPk(1);\n' +
      '  await client?.update({} as never);\n};\n';

    expect(await ownershipErrorsIn('report', code)).toHaveLength(0);
  });
});
