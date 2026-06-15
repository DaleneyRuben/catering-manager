import { toVoid } from './toVoid';

describe('toVoid', () => {
  it('resolves to undefined when the wrapped promise resolves', async () => {
    const result = await toVoid(Promise.resolve(42));
    expect(result).toBeUndefined();
  });

  it('rejects when the wrapped promise rejects', async () => {
    await expect(toVoid(Promise.reject(new Error('fail')))).rejects.toThrow('fail');
  });
});
