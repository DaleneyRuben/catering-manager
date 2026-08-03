const SATURDAY = '2026-08-01';
const MONDAY = '2026-08-03';

const parseStartDate = async (startDate: string) => {
  const { updateSubscriptionSchema } = await import('../subscription.schema');
  return updateSubscriptionSchema.safeParse({ startDate });
};

describe('subscription schema startDate', () => {
  const originalEnv = process.env.BYPASS_WEEKEND;

  afterEach(() => {
    process.env.BYPASS_WEEKEND = originalEnv;
    jest.resetModules();
  });

  it('rejects a weekend start date when the bypass flag is not set', async () => {
    delete process.env.BYPASS_WEEKEND;
    jest.resetModules();

    const result = await parseStartDate(SATURDAY);

    expect(result.success).toBe(false);
  });

  it('accepts a weekday start date when the bypass flag is not set', async () => {
    delete process.env.BYPASS_WEEKEND;
    jest.resetModules();

    const result = await parseStartDate(MONDAY);

    expect(result.success).toBe(true);
  });

  it('accepts a weekend start date when the bypass flag is set', async () => {
    process.env.BYPASS_WEEKEND = 'true';
    jest.resetModules();

    const result = await parseStartDate(SATURDAY);

    expect(result.success).toBe(true);
  });

  it('still rejects a malformed date when the bypass flag is set', async () => {
    process.env.BYPASS_WEEKEND = 'true';
    jest.resetModules();

    const result = await parseStartDate('01/08/2026');

    expect(result.success).toBe(false);
  });
});
