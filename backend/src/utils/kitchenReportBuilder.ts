import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  PageBreak,
  BorderStyle,
} from 'docx';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ActiveClientRow } from '../services/report.service';

const BLACK = '000000';
const GRAY = '595959';

type MenuData = {
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

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const cell = (text: string, bold = false, rightAlign = false): TableCell =>
  new TableCell({
    borders: NO_BORDER,
    children: [
      new Paragraph({
        alignment: rightAlign ? 'right' : 'left',
        children: [new TextRun({ text, bold, color: BLACK })],
      }),
    ],
  });

const wideRow = (text: string, bold = false): TableRow =>
  new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        borders: NO_BORDER,
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold, color: BLACK })],
          }),
        ],
      }),
    ],
  });

const mealRows = (config: MealConfig, menu: MenuData, clients: ActiveClientRow[]): TableRow[] => {
  const dish = menu[config.menuField] ?? '';
  const receiving = clients.filter((c) => c.planMeals.includes(config.key));
  const noDar = clients.filter((c) => !c.planMeals.includes(config.key));

  const rows: TableRow[] = [
    new TableRow({
      children: [
        cell(`${config.label}: ${dish}`, true),
        cell(String(receiving.length), true, true),
      ],
    }),
  ];

  if (noDar.length > 0) {
    rows.push(wideRow(`${noDar.length}  NO DAR ${config.label}`));
    noDar.forEach((c) => rows.push(wideRow(c.name)));
  }

  return rows;
};

const headerRow = (): TableRow =>
  new TableRow({
    children: [
      new TableCell({
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'ESPECIFICACIONES DE LA PROGRAMACION', bold: true, color: GRAY }),
            ],
          }),
        ],
      }),
      new TableCell({
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
        },
        children: [
          new Paragraph({
            alignment: 'right',
            children: [new TextRun({ text: 'CANT TOTAL', bold: true, color: GRAY })],
          }),
        ],
      }),
    ],
  });

const buildTable = (rows: TableRow[]): Table =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [8000, 2000],
    rows: [headerRow(), ...rows],
    borders: {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    },
  });

const formatDate = (date: string): string => {
  const parsed = parseISO(date);
  const day = format(parsed, 'dd');
  const month = format(parsed, 'MMMM', { locale: es }).toUpperCase();
  const year = format(parsed, 'yyyy');
  return `FECHA: ${day} – ${month} – ${year}`;
};

const findRestrictionConflicts = (
  menu: MenuData,
  clients: ActiveClientRow[],
): { name: string; conflicts: string[] }[] => {
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

  return clients
    .map((c) => ({
      name: c.name,
      conflicts: c.restrictions.filter((r) => allDishes.includes(r.toLowerCase())),
    }))
    .filter((c) => c.conflicts.length > 0);
};

export const buildKitchenReport = async (
  menu: MenuData,
  clients: ActiveClientRow[],
  date: string,
): Promise<Buffer> => {
  const dateHeader = formatDate(date);
  const totalClients = clients.length;
  const hiperproteico = clients.filter((c) => c.planMeals.includes('extra'));

  const pastelariaTableRows: TableRow[] = [wideRow('PASTELERIA', true)];
  PASTELERIA_MEALS.forEach((m) => pastelariaTableRows.push(...mealRows(m, menu, clients)));

  if (hiperproteico.length > 0) {
    pastelariaTableRows.push(
      wideRow(
        `HIPERPROTEICO: ${hiperproteico.length} – ${hiperproteico.map((c) => c.name).join(' – ')}`,
      ),
    );
  }

  const produccionTableRows: TableRow[] = [wideRow('PRODUCCION', true)];
  PRODUCCION_MEALS.forEach((m) => produccionTableRows.push(...mealRows(m, menu, clients)));

  const restrictionConflicts = findRestrictionConflicts(menu, clients);

  const children = [
    new Paragraph({ children: [new TextRun({ text: dateHeader, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: String(totalClients), bold: true })] }),
    new Paragraph({}),
    buildTable(pastelariaTableRows),
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({ children: [new TextRun({ text: dateHeader, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: String(totalClients), bold: true })] }),
    new Paragraph({}),
    buildTable(produccionTableRows),
    new Paragraph({}),
    ...restrictionConflicts.flatMap((c) => [
      new Paragraph({ children: [new TextRun({ text: c.name, bold: true })] }),
      new Paragraph({
        children: [new TextRun({ text: c.conflicts.join(' - ').toUpperCase(), color: GRAY })],
      }),
    ]),
  ];

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
};

export const kitchenReportFileName = (date: string): string => {
  const parsed = parseISO(date);
  const dayName = format(parsed, 'EEEE', { locale: es });
  const dayMonth = format(parsed, 'ddMM');
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalized} ${dayMonth}.docx`;
};
