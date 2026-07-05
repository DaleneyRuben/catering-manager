describe('checkIsWeekend', () => {
  const originalEnv = process.env.BYPASS_WEEKEND;

  afterEach(() => {
    process.env.BYPASS_WEEKEND = originalEnv;
    jest.resetModules();
  });

  it('returns the real weekend check when the bypass flag is not set', async () => {
    delete process.env.BYPASS_WEEKEND;
    jest.resetModules();
    const { checkIsWeekend } = await import('../devFlags');

    expect(checkIsWeekend(new Date(2026, 6, 4))).toBe(true); // Saturday
    expect(checkIsWeekend(new Date(2026, 6, 6))).toBe(false); // Monday
  });

  it('always returns false when the bypass flag is set', async () => {
    process.env.BYPASS_WEEKEND = 'true';
    jest.resetModules();
    const { checkIsWeekend } = await import('../devFlags');

    expect(checkIsWeekend(new Date(2026, 6, 4))).toBe(false); // Saturday, bypassed
  });
});
