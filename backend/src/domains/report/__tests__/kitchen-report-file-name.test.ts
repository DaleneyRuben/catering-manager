import { kitchenReportFileName } from '../kitchen-report-file-name';

describe('kitchenReportFileName', () => {
  it('returns a filename with the Spanish day name capitalized and formatted date', () => {
    expect(kitchenReportFileName('2026-06-15')).toBe('Lunes 15-06.docx');
  });

  it('formats a Friday correctly', () => {
    expect(kitchenReportFileName('2026-06-19')).toBe('Viernes 19-06.docx');
  });

  it('formats a Wednesday correctly', () => {
    expect(kitchenReportFileName('2026-06-17')).toBe('Miércoles 17-06.docx');
  });
});
