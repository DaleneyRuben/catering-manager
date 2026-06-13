import {
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  PageBreak,
  BorderStyle,
  AlignmentType,
} from 'docx';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ActiveClientRow } from '../services/report.service';

const RED = 'C00000';
const GRAY = '595959';
const BLACK = '000000';

const COL_WIDTHS = [1230, 3850, 2330, 2330, 2330, 2330] as const;
const NUM_CLIENT_COLS = 4;

export type MenuData = {
  breakfast: string | null;
  morningSnack: string | null;
  salad: string | null;
  lunch: string | null;
  afternoonSnack: string | null;
  dinner: string | null;
  juice: string | null;
};

type MealKey = 'breakfast' | 'morning_snack' | 'salad' | 'lunch' | 'afternoon_snack' | 'dinner';

type MealConfig = {
  key: MealKey;
  label: string;
  menuField: keyof MenuData;
};

export type MealSection = {
  label: string;
  dish: string;
  count: number;
  noDar: string[];
};

export type KitchenReportData = {
  dateText: string;
  totalClients: number;
  pasteleria: MealSection[];
  hiperproteico: string[];
  produccion: MealSection[];
  restrictionConflicts: { name: string; conflicts: string[] }[];
};

const PASTELERIA_MEALS: MealConfig[] = [
  { key: 'breakfast', label: 'DESAYUNO', menuField: 'breakfast' },
  { key: 'morning_snack', label: 'MEDIA MAÑANA', menuField: 'morningSnack' },
  { key: 'afternoon_snack', label: 'MERIENDA TARDE', menuField: 'afternoonSnack' },
];

const PRODUCCION_MEALS: MealConfig[] = [
  { key: 'lunch', label: 'ALMUERZO', menuField: 'lunch' },
  { key: 'salad', label: 'ENSALADA', menuField: 'salad' },
  { key: 'dinner', label: 'CENA', menuField: 'dinner' },
];

const MEAL_LABEL_SHADING = { type: ShadingType.CLEAR, color: 'auto', fill: 'D9D9D9' };

const THIN = { style: BorderStyle.SINGLE, size: 1, color: BLACK };
const NO_BORDER = { style: BorderStyle.NIL, size: 0, color: BLACK };
const ALL_BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };

const para = (
  text: string,
  {
    bold = false,
    color = BLACK,
    size,
    align,
  }: {
    bold?: boolean;
    color?: string;
    size?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  } = {},
): Paragraph =>
  new Paragraph({
    alignment: align,
    children: [new TextRun({ text, bold, color, size })],
  });

const cell = (
  content: Paragraph | Paragraph[],
  {
    colspan = 1,
    borders = ALL_BORDERS,
    shading,
  }: {
    colspan?: number;
    borders?: typeof ALL_BORDERS;
    shading?: { type: (typeof ShadingType)[keyof typeof ShadingType]; color: string; fill: string };
  } = {},
): TableCell =>
  new TableCell({
    columnSpan: colspan,
    borders,
    ...(shading && { shading }),
    children: Array.isArray(content) ? content : [content],
  });

const emptyCell = (colspan = 1): TableCell => cell(para(''), { colspan });

const spacerRow = (): TableRow =>
  new TableRow({ children: Array.from({ length: COL_WIDTHS.length }, () => emptyCell()) });

const dateRow = (dateText: string, totalClients: number): TableRow =>
  new TableRow({
    children: [
      cell(para(dateText, { bold: true }), { colspan: 5 }),
      cell(
        para(String(totalClients), {
          bold: true,
          color: RED,
          size: 40,
          align: AlignmentType.RIGHT,
        }),
        { colspan: 1 },
      ),
    ],
  });

const specHeaderRow = (): TableRow =>
  new TableRow({
    children: [
      cell(
        para('ESPECIFICACIONES DE LA PROGRAMACION', {
          bold: true,
          color: GRAY,
          align: AlignmentType.CENTER,
        }),
        {
          colspan: 6,
          borders: {
            top: THIN,
            left: THIN,
            right: THIN,
            bottom: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
          },
        },
      ),
    ],
  });

const sectionLabelRow = (label: string): TableRow =>
  new TableRow({
    children: [
      cell(para('CANT\nTOTAL', { bold: true, color: GRAY, size: 16, align: AlignmentType.CENTER })),
      cell(para(label, { bold: true, color: RED, align: AlignmentType.CENTER }), { colspan: 5 }),
    ],
  });

const mealTableRow = (label: string, dish: string, count: number): TableRow =>
  new TableRow({
    children: [
      emptyCell(1),
      cell(para(`${label}: ${dish}`, { bold: true }), { colspan: 4, shading: MEAL_LABEL_SHADING }),
      cell(para(String(count), { bold: true, color: RED, size: 32, align: AlignmentType.RIGHT })),
    ],
  });

const NO_DAR_SIZE = 15;

const clientChunkRows = (
  clients: string[],
  firstRowPrefix: [TableCell, TableCell] | null,
  nameSize?: number,
): TableRow[] => {
  const rows: TableRow[] = [];

  for (let i = 0; i < clients.length; i += NUM_CLIENT_COLS) {
    const chunk = clients.slice(i, i + NUM_CLIENT_COLS);
    const nameCells = chunk.map((name) => cell(para(name, { size: nameSize })));
    const paddingCells = Array.from({ length: NUM_CLIENT_COLS - chunk.length }, () => emptyCell());

    if (i === 0 && firstRowPrefix) {
      rows.push(new TableRow({ children: [...firstRowPrefix, ...nameCells, ...paddingCells] }));
    } else {
      rows.push(
        new TableRow({ children: [emptyCell(), emptyCell(), ...nameCells, ...paddingCells] }),
      );
    }
  }

  return rows;
};

const noDarTableRows = (label: string, clients: string[]): TableRow[] => {
  if (clients.length === 0) return [];
  return clientChunkRows(
    clients,
    [
      cell(
        para(String(clients.length), {
          bold: true,
          color: RED,
          size: NO_DAR_SIZE,
          align: AlignmentType.CENTER,
        }),
      ),
      cell(para(`NO DAR ${label}`, { size: NO_DAR_SIZE })),
    ],
    NO_DAR_SIZE,
  );
};

const hiperproteicoTableRows = (clients: string[]): TableRow[] => {
  if (clients.length === 0) return [];
  return clientChunkRows(clients, [
    cell(para(String(clients.length), { bold: true, color: RED, align: AlignmentType.CENTER })),
    cell(para('HIPERPROTEICO', { bold: true })),
  ]);
};

const buildMealTableRows = (
  config: MealConfig,
  menu: MenuData,
  clients: ActiveClientRow[],
): TableRow[] => {
  const dish = menu[config.menuField] ?? '';
  const receiving = clients.filter((c) => c.planMeals.includes(config.key));
  const noDar = clients.filter((c) => !c.planMeals.includes(config.key)).map((c) => c.name);
  return [
    mealTableRow(config.label, dish, receiving.length),
    ...noDarTableRows(config.label, noDar),
    spacerRow(),
  ];
};

const restrictionTableRows = (conflicts: { name: string; conflicts: string[] }[]): TableRow[] =>
  conflicts.map(
    (c) =>
      new TableRow({
        children: [
          emptyCell(),
          cell(para(c.name, { bold: true }), { colspan: 2 }),
          cell(para(c.conflicts.join(' - ').toUpperCase(), { color: GRAY }), { colspan: 3 }),
        ],
      }),
  );

const buildDocxTable = (rows: TableRow[]): Table =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [...COL_WIDTHS],
    rows,
    borders: NO_BORDERS,
  });

const formatDateText = (date: string): string => {
  const parsed = parseISO(date);
  const day = format(parsed, 'dd');
  const month = format(parsed, 'MMMM', { locale: es }).toUpperCase();
  const year = format(parsed, 'yyyy');
  return `FECHA: ${day} – ${month} – ${year}`;
};

export const computeKitchenReportData = (
  menu: MenuData,
  clients: ActiveClientRow[],
  date: string,
): KitchenReportData => {
  const allDishes = [
    menu.breakfast,
    menu.morningSnack,
    menu.salad,
    menu.lunch,
    menu.afternoonSnack,
    menu.dinner,
    menu.juice,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const toSection = (configs: MealConfig[]): MealSection[] =>
    configs.map((m) => ({
      label: m.label,
      dish: menu[m.menuField] ?? '',
      count: clients.filter((c) => c.planMeals.includes(m.key)).length,
      noDar: clients.filter((c) => !c.planMeals.includes(m.key)).map((c) => c.name),
    }));

  return {
    dateText: formatDateText(date),
    totalClients: clients.length,
    pasteleria: toSection(PASTELERIA_MEALS),
    hiperproteico: clients.filter((c) => c.planMeals.includes('extra')).map((c) => c.name),
    produccion: toSection(PRODUCCION_MEALS),
    restrictionConflicts: clients
      .map((c) => ({
        name: c.name,
        conflicts: c.restrictions.filter((r) => allDishes.includes(r.toLowerCase())),
      }))
      .filter((c) => c.conflicts.length > 0),
  };
};

export const buildKitchenReport = async (
  menu: MenuData,
  clients: ActiveClientRow[],
  date: string,
): Promise<Buffer> => {
  const data = computeKitchenReportData(menu, clients, date);

  const pastelariaRows: TableRow[] = [
    dateRow(data.dateText, data.totalClients),
    specHeaderRow(),
    sectionLabelRow('PASTELERIA'),
    ...PASTELERIA_MEALS.flatMap((m) => buildMealTableRows(m, menu, clients)),
    ...hiperproteicoTableRows(data.hiperproteico),
  ];

  const produccionRows: TableRow[] = [
    dateRow(data.dateText, data.totalClients),
    specHeaderRow(),
    sectionLabelRow('PRODUCCION'),
    ...PRODUCCION_MEALS.flatMap((m) => buildMealTableRows(m, menu, clients)),
    ...restrictionTableRows(data.restrictionConflicts),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
              header: 708,
              footer: 708,
              gutter: 0,
            },
          },
        },
        children: [
          buildDocxTable(pastelariaRows),
          new Paragraph({ children: [new PageBreak()] }),
          buildDocxTable(produccionRows),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
};

export const kitchenReportFileName = (date: string): string => {
  const parsed = parseISO(date);
  const dayName = format(parsed, 'EEEE', { locale: es });
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalized} ${format(parsed, 'dd-MM')}.docx`;
};
