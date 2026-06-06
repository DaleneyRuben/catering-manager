import { AlignmentType, Document, Packer, Paragraph, TextRun, UnderlineType } from 'docx';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Menu from '../models/Menu';

const PURPLE = '7030A0';
const GRAY = '808080';
const RED = 'C00000';

const bulletParagraph = (label: string, time: string): Paragraph =>
  new Paragraph({
    bullet: { level: 0 },
    children: [
      new TextRun({
        text: `${label} ${time}`,
        bold: true,
        color: GRAY,
        allCaps: true,
      }),
    ],
  });

const dishParagraph = (dish: string): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text: dish })],
  });

const emptyParagraph = (): Paragraph => new Paragraph({});

type MenuInstance = Menu | Record<string, string | null>;

export const buildMenuCardDocx = async (menu: MenuInstance, date: string): Promise<Buffer> => {
  const parsed = parseISO(date);
  const day = format(parsed, 'dd');
  const month = format(parsed, 'MMMM', { locale: es }).toUpperCase();

  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: `MENÚ ${day} DE ${month}`,
          bold: true,
          color: PURPLE,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
    emptyParagraph(),
  );

  const bulletMeals: Array<{ key: keyof MenuInstance; label: string; time: string }> = [
    { key: 'breakfast', label: 'DESAYUNO', time: '8:00' },
    { key: 'morningSnack', label: 'MERIENDA MAÑANA', time: '10:30' },
    { key: 'lunch', label: 'ALMUERZO', time: '13:00' },
  ];

  bulletMeals
    .filter(({ key }) => !!(menu[key] as string | null))
    .forEach(({ key, label, time }) => {
      children.push(bulletParagraph(label, time), dishParagraph(menu[key] as string));
    });

  const salad = menu.salad as string | null;
  if (salad) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'ENSALADA', bold: true, color: GRAY }),
          new TextRun({ text: ': ', bold: true, color: GRAY }),
          new TextRun({ text: salad }),
        ],
      }),
    );
  }

  const afternoonSnack = menu.afternoonSnack as string | null;
  if (afternoonSnack) {
    children.push(bulletParagraph('MEDIA TARDE', '16:00'), dishParagraph(afternoonSnack));
  }

  const dinner = menu.dinner as string | null;
  if (dinner) {
    children.push(bulletParagraph('CENA', '19:00'), dishParagraph(dinner));
  }

  const juice = menu.juice as string | null;
  if (juice) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'JUGO DEL DÍA:', bold: true, color: PURPLE })],
      }),
      dishParagraph(juice),
    );
  }

  children.push(emptyParagraph(), emptyParagraph());

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'NOTA:', bold: true, color: PURPLE }),
        new TextRun({
          text: '   SI LA PRESENTACIÓN DE SU ALIMENTACIÓN, NO COINCIDE CON EL MENÚ, SE DEBE A LOS CAMBIOS SOLICITADOS Y/O ESTABLECIDOS POR LA LICENCIADA EN NUTRICIÓN DE ACUERDO A LA EVALUACIÓN DE CADA CLIENTE.',
          bold: true,
          color: PURPLE,
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text: 'Nutricionista Lic. SILVIA', color: PURPLE })],
    }),
    emptyParagraph(),
    new Paragraph({
      children: [new TextRun({ text: 'CEL. 62300013', bold: true, color: RED })],
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
};

export const menuCardFileName = (date: string): string => {
  const parsed = parseISO(date);
  const dayMonth = format(parsed, 'dd-MM');
  return `Menu completo ${dayMonth}.docx`;
};
