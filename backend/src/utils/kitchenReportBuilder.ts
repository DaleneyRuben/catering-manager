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
import type { ActiveClientRow } from '../services/report';
import {
  type MenuData,
  type MealConfig,
  BAKERY_MEALS,
  MAIN_MEALS,
  computeKitchenReportData,
} from './kitchenReportData';

export type { MenuData, MealSection, KitchenReportData } from './kitchenReportData';
export { computeKitchenReportData, kitchenReportFileName } from './kitchenReportData';

const RED = 'C00000';
const GRAY = '595959';
const BLACK = '000000';

const COL_WIDTHS = [800, 3800, 3000, 3000, 3000, 800] as const;
const NUM_CLIENT_COLS = 3;

const W = {
  count: COL_WIDTHS[0],
  label: COL_WIDTHS[1],
  name: COL_WIDTHS[2],
  rightCount: COL_WIDTHS[5],
  dish: COL_WIDTHS[1] + COL_WIDTHS[2] * 3,
  sectionLabel: COL_WIDTHS.slice(1).reduce((a: number, b) => a + b, 0),
  dateMain: COL_WIDTHS.slice(0, 5).reduce((a: number, b) => a + b, 0),
  full: COL_WIDTHS.reduce((a: number, b) => a + b, 0),
} as const;

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
    width,
    borders = ALL_BORDERS,
    shading,
  }: {
    colspan?: number;
    width?: number;
    borders?: typeof ALL_BORDERS;
    shading?: { type: (typeof ShadingType)[keyof typeof ShadingType]; color: string; fill: string };
  } = {},
): TableCell =>
  new TableCell({
    columnSpan: colspan,
    ...(width !== undefined && { width: { size: width, type: WidthType.DXA } }),
    borders,
    ...(shading && { shading }),
    children: Array.isArray(content) ? content : [content],
  });

const emptyCell = (width: number, colspan = 1): TableCell => cell(para(''), { colspan, width });

const spacerRow = (): TableRow => new TableRow({ children: COL_WIDTHS.map((w) => emptyCell(w)) });

const dateRow = (dateText: string, totalClients: number): TableRow =>
  new TableRow({
    children: [
      cell(para(dateText, { bold: true }), { colspan: 5, width: W.dateMain }),
      cell(
        para(String(totalClients), {
          bold: true,
          color: RED,
          size: 40,
          align: AlignmentType.RIGHT,
        }),
        { colspan: 1, width: W.rightCount },
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
          width: W.full,
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
      cell(
        para('CANT\nTOTAL', { bold: true, color: GRAY, size: 16, align: AlignmentType.CENTER }),
        { width: W.count },
      ),
      cell(para(label, { bold: true, color: RED, align: AlignmentType.CENTER }), {
        colspan: 5,
        width: W.sectionLabel,
      }),
    ],
  });

const mealTableRow = (label: string, dish: string, count: number): TableRow =>
  new TableRow({
    children: [
      emptyCell(W.count),
      cell(para(`${label}: ${dish}`, { bold: true }), {
        colspan: 4,
        width: W.dish,
        shading: MEAL_LABEL_SHADING,
      }),
      cell(para(String(count), { bold: true, color: RED, size: 32, align: AlignmentType.RIGHT }), {
        width: W.rightCount,
      }),
    ],
  });

const NO_DAR_SIZE = 15;
const CLIENTS_PER_CELL = 3;
const CLIENTS_PER_ROW = NUM_CLIENT_COLS * CLIENTS_PER_CELL;

const clientChunkRows = (
  clients: string[],
  firstRowPrefix: [TableCell, TableCell] | null,
  nameSize?: number,
): TableRow[] => {
  const rows: TableRow[] = [];

  for (let i = 0; i < clients.length; i += CLIENTS_PER_ROW) {
    const rowClients = clients.slice(i, i + CLIENTS_PER_ROW);

    const nameCells = Array.from({ length: NUM_CLIENT_COLS }, (_, colIdx) => {
      const cellClients = rowClients.slice(
        colIdx * CLIENTS_PER_CELL,
        (colIdx + 1) * CLIENTS_PER_CELL,
      );
      const paragraphs =
        cellClients.length > 0
          ? cellClients.map((name) => para(name, { size: nameSize }))
          : [para('')];
      return cell(paragraphs, { width: W.name });
    });

    if (i === 0 && firstRowPrefix) {
      rows.push(
        new TableRow({ children: [...firstRowPrefix, ...nameCells, emptyCell(W.rightCount)] }),
      );
    } else {
      rows.push(
        new TableRow({
          children: [emptyCell(W.count), emptyCell(W.label), ...nameCells, emptyCell(W.rightCount)],
        }),
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
        { width: W.count },
      ),
      cell(para(`NO DAR ${label}`, { size: NO_DAR_SIZE }), { width: W.label }),
    ],
    NO_DAR_SIZE,
  );
};

const hiperproteicoTableRows = (clients: string[]): TableRow[] => {
  if (clients.length === 0) return [];
  return clientChunkRows(clients, [
    cell(para(String(clients.length), { bold: true, color: RED, align: AlignmentType.CENTER }), {
      width: W.count,
    }),
    cell(para('HIPERPROTEICO', { bold: true }), { width: W.label }),
  ]);
};

const instructionTableRows = (label: string, clients: string[]): TableRow[] => {
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
        { width: W.count },
      ),
      cell(para(label, { size: NO_DAR_SIZE }), { width: W.label }),
    ],
    NO_DAR_SIZE,
  );
};

const buildMealTableRows = (
  config: MealConfig,
  menu: MenuData,
  clients: ActiveClientRow[],
): TableRow[] => {
  const dish = menu[config.menuField] ?? '';
  const receiving = clients.filter((c) => c.planMeals.includes(config.key));
  const noDar = clients.filter((c) => !c.planMeals.includes(config.key)).map((c) => c.name);
  const instructions = receiving.reduce<Record<string, string[]>>((acc, c) => {
    const label = c.specialInstructions[config.key];
    if (label) (acc[label] ??= []).push(c.name);
    return acc;
  }, {});

  return [
    mealTableRow(config.label, dish, receiving.length),
    ...noDarTableRows(config.label, noDar),
    ...Object.entries(instructions).flatMap(([label, names]) => instructionTableRows(label, names)),
    spacerRow(),
  ];
};

const buildDocxTable = (rows: TableRow[]): Table =>
  new Table({
    width: { size: W.full, type: WidthType.DXA },
    columnWidths: [...COL_WIDTHS],
    rows,
    borders: NO_BORDERS,
  });

export const buildKitchenReport = async (
  menu: MenuData,
  clients: ActiveClientRow[],
  date: string,
): Promise<Buffer> => {
  const data = computeKitchenReportData(menu, clients, date);

  const bakeryRows: TableRow[] = [
    dateRow(data.dateText, data.totalClients),
    specHeaderRow(),
    sectionLabelRow('PASTELERIA'),
    ...BAKERY_MEALS.flatMap((m) => buildMealTableRows(m, menu, clients)),
    ...hiperproteicoTableRows(data.hiperproteico),
  ];

  const mainMealsRows: TableRow[] = [
    dateRow(data.dateText, data.totalClients),
    specHeaderRow(),
    sectionLabelRow('PRODUCCION'),
    ...MAIN_MEALS.flatMap((m) => buildMealTableRows(m, menu, clients)),
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
          buildDocxTable(bakeryRows),
          new Paragraph({ children: [new PageBreak()] }),
          buildDocxTable(mainMealsRows),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
};
