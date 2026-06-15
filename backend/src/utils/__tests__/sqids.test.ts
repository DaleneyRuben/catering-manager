import { encodeId, decodeId, encodeIds } from '../sqids';

describe('decodeId', () => {
  it('decodes a valid encoded id back to the original number', () => {
    expect(decodeId(encodeId(42))).toBe(42);
  });

  it('throws on an invalid encoded string', () => {
    expect(() => decodeId('!!!invalid!!!')).toThrow('Invalid encoded ID');
  });
});

describe('encodeIds', () => {
  it('encodes top-level id field', () => {
    const result = encodeIds({ id: 1, name: 'Test' }) as Record<string, unknown>;
    expect(typeof result.id).toBe('string');
    expect(result.name).toBe('Test');
  });

  it('encodes *Id foreign-key fields', () => {
    const result = encodeIds({ clientId: 5, planId: 7 }) as Record<string, unknown>;
    expect(typeof result.clientId).toBe('string');
    expect(typeof result.planId).toBe('string');
  });

  it('does not encode non-id numeric fields', () => {
    const result = encodeIds({ price: 1390, discount: 0 }) as Record<string, unknown>;
    expect(result.price).toBe(1390);
    expect(result.discount).toBe(0);
  });

  it('recursively encodes nested objects', () => {
    const result = encodeIds({
      id: 1,
      subscription: { id: 2, clientId: 1 },
    }) as Record<string, unknown>;
    const sub = result.subscription as Record<string, unknown>;
    expect(typeof sub.id).toBe('string');
    expect(typeof sub.clientId).toBe('string');
  });

  it('recursively encodes arrays of objects', () => {
    const result = encodeIds([{ id: 1 }, { id: 2 }]) as Record<string, unknown>[];
    expect(typeof result[0].id).toBe('string');
    expect(typeof result[1].id).toBe('string');
  });

  it('encoded id is consistent with encodeId', () => {
    const result = encodeIds({ id: 42 }) as Record<string, unknown>;
    expect(result.id).toBe(encodeId(42));
  });

  it('leaves null and primitive values unchanged', () => {
    expect(encodeIds(null)).toBeNull();
    expect(encodeIds('hello')).toBe('hello');
    expect(encodeIds(42)).toBe(42);
  });

  it('preserves Date objects without corrupting them into character maps', () => {
    const date = new Date('2026-06-11T18:46:17.000Z');
    const result = encodeIds({ occurredAt: date }) as Record<string, unknown>;
    expect(result.occurredAt).toBeInstanceOf(Date);
    expect((result.occurredAt as Date).toISOString()).toBe('2026-06-11T18:46:17.000Z');
  });
});
