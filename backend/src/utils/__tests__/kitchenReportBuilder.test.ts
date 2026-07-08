import { computeKitchenReportData, kitchenReportFileName } from '../kitchenReportBuilder';
import type { ActiveClientRow } from '../../services/report';

const mockMenu = {
  breakfast: 'Queque de platano',
  morningSnack: 'Flan de chocolate',
  salad: 'Vainitas con zuccini',
  lunch: 'Boloñesa con caracolitos',
  afternoonSnack: 'Manzana asada con canela',
  dinner: 'Tortilla de coliflor con yuca',
  juice: 'Limonada',
};

const makeClient = (
  name: string,
  planMeals: string[],
  specialInstructions: Record<string, string> = {},
): ActiveClientRow => ({ name, planMeals, specialInstructions });

const allMeals = ['breakfast', 'morning_snack', 'salad', 'lunch', 'afternoon_snack', 'dinner'];

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

describe('computeKitchenReportData', () => {
  it('sets date text and total client count', () => {
    const clients = [makeClient('Ana López', allMeals)];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    expect(data.dateText).toBe('FECHA: 04 – JUNIO – 2026');
    expect(data.totalClients).toBe(1);
  });

  it('computes CANT TOTAL per meal from plan', () => {
    const clients = [
      makeClient('Ana López', allMeals),
      makeClient('Carlos Ríos', ['lunch', 'dinner']),
      makeClient('María Torres', allMeals),
    ];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    const desayuno = data.bakery.find((m) => m.label === 'DESAYUNO')!;
    expect(desayuno.count).toBe(2);

    const almuerzo = data.mainMeals.find((m) => m.label === 'ALMUERZO')!;
    expect(almuerzo.count).toBe(3);
  });

  it('lists NO DAR clients for each meal', () => {
    const clients = [
      makeClient('Ana López', allMeals),
      makeClient('Carlos Ríos', ['lunch', 'dinner']),
    ];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    const desayuno = data.bakery.find((m) => m.label === 'DESAYUNO')!;
    expect(desayuno.noDar).toEqual(['Carlos Ríos']);
  });

  it('groups instructions by label within a meal section', () => {
    const clients = [
      makeClient('Ana López', allMeals, { salad: 'DAR GRANDES' }),
      makeClient('Jorge Rengel', allMeals, { salad: 'DAR GRANDES' }),
      makeClient('Carlos Ríos', allMeals),
    ];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    const ensalada = data.mainMeals.find((m) => m.label === 'ENSALADA')!;
    expect(ensalada.instructions).toEqual({ 'DAR GRANDES': ['Ana López', 'Jorge Rengel'] });
  });

  it('returns empty instructions when no client has a special instruction for the meal', () => {
    const clients = [makeClient('Ana López', allMeals)];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    const ensalada = data.mainMeals.find((m) => m.label === 'ENSALADA')!;
    expect(ensalada.instructions).toEqual({});
  });

  it('only applies an instruction to the relevant meal section', () => {
    const clients = [makeClient('Ana López', allMeals, { salad: 'DAR GRANDES' })];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    const almuerzo = data.mainMeals.find((m) => m.label === 'ALMUERZO')!;
    expect(almuerzo.instructions).toEqual({});
  });

  it('includes all bakery meals in order', () => {
    const clients = [makeClient('Ana López', allMeals)];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    expect(data.bakery.map((m) => m.label)).toEqual(['DESAYUNO', 'MEDIA MAÑANA', 'MERIENDA TARDE']);
  });

  it('includes all main meals in order', () => {
    const clients = [makeClient('Ana López', allMeals)];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    expect(data.mainMeals.map((m) => m.label)).toEqual(['ALMUERZO', 'ENSALADA', 'CENA']);
  });

  it('lists hiperproteico clients', () => {
    const clients = [
      makeClient('Ana López', [...allMeals, 'extra']),
      makeClient('Carlos Ríos', allMeals),
    ];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    expect(data.hiperproteico).toEqual(['Ana López']);
  });

  it('returns empty hiperproteico when no client has extra', () => {
    const clients = [makeClient('Ana López', allMeals)];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    expect(data.hiperproteico).toEqual([]);
  });

  it('matches snapshot', () => {
    const clients = [
      makeClient('Carmen Tapia', ['lunch', 'salad', 'dinner']),
      makeClient('Ana López', allMeals),
      makeClient('Jorge Rengel', [...allMeals, 'extra']),
    ];
    const data = computeKitchenReportData(mockMenu, clients, '2026-06-04');

    expect(data).toMatchSnapshot();
  });
});
