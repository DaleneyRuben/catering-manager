import { menuFileName } from '../menu-file-name';

describe('menuFileName', () => {
  it('formats the date as dd-MM in the filename', () => {
    expect(menuFileName('2026-04-06')).toBe('Menu completo 06-04.docx');
  });

  it('handles end-of-year dates', () => {
    expect(menuFileName('2026-12-25')).toBe('Menu completo 25-12.docx');
  });

  it('zero-pads day and month', () => {
    expect(menuFileName('2026-01-03')).toBe('Menu completo 03-01.docx');
  });
});
