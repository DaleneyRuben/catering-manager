import { buildMenu, menuFileName } from '../menuBuilder';

const fullMenu = {
  breakfast: 'Queque de platano',
  morningSnack: 'Flan de chocolate',
  salad: 'Vainitas con zuccini',
  lunch: 'Boloñesa con caracolitos',
  afternoonSnack: 'Manzana asada con canela',
  dinner: 'Tortilla de coliflor con yuca',
  juice: 'Limonada',
};

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

describe('buildMenu', () => {
  it('returns a non-empty Buffer for a full menu', async () => {
    const buffer = await buildMenu(fullMenu, '2026-04-06');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('returns a Buffer when all optional fields are null', async () => {
    const minimalMenu = {
      breakfast: null,
      morningSnack: null,
      salad: null,
      lunch: null,
      afternoonSnack: null,
      dinner: null,
      juice: null,
    };
    const buffer = await buildMenu(minimalMenu, '2026-04-06');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('returns a Buffer when only breakfast and lunch are set', async () => {
    const partialMenu = {
      breakfast: 'Tostadas',
      morningSnack: null,
      salad: null,
      lunch: 'Arroz con pollo',
      afternoonSnack: null,
      dinner: null,
      juice: null,
    };
    const buffer = await buildMenu(partialMenu, '2026-04-06');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
