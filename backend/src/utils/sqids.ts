import Sqids from 'sqids';

const options = process.env.SQIDS_ALPHABET
  ? { alphabet: process.env.SQIDS_ALPHABET, minLength: 6 }
  : { minLength: 6 };
const sqids = new Sqids(options);

export const encodeId = (n: number): string => sqids.encode([n]);

export const decodeId = (s: string): number => {
  const nums = sqids.decode(s);
  if (nums.length === 0) throw new Error(`Invalid encoded ID: ${s}`);
  return nums[0];
};

// Matches fields named exactly "id" or ending with "Id" (e.g. clientId, planId)
const ID_KEY = /^(id|[a-zA-Z]+Id)$/;

export const encodeIds = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(encodeIds);
  if (typeof value === 'object') {
    // Sequelize model instances store data in dataValues; toJSON() returns the plain object
    const plain =
      typeof (value as { toJSON?: () => unknown }).toJSON === 'function'
        ? (value as { toJSON: () => unknown }).toJSON()
        : value;
    return Object.entries(plain as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [k, v]) => {
        acc[k] = ID_KEY.test(k) && typeof v === 'number' ? encodeId(v) : encodeIds(v);
        return acc;
      },
      {},
    );
  }
  return value;
};
