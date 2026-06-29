import { initials } from '@/utils/string';

describe('initials', () => {
  it('returns first letter of first and last name', () => {
    expect(initials('María García')).toBe('MG');
  });

  it('uses only the first two words', () => {
    expect(initials('Juan Carlos López Pérez')).toBe('JC');
  });

  it('handles a single word name', () => {
    expect(initials('Carlos')).toBe('C');
  });
});
