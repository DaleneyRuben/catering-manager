import { NextFunction, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { parse, format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import menuService from '../services/menu.service';
import reportService from '../services/report.service';
import { buildMenu, menuFileName } from '../utils/menuBuilder';
import { buildKitchenReport, kitchenReportFileName } from '../utils/kitchenReportBuilder';

const parseDMY = (value: string): string | null => {
  const parsed = parse(value, 'dd/MM/yyyy', new Date());
  if (!isValid(parsed)) return null;
  return format(parsed, 'yyyy-MM-dd');
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const toSpanishFileName = (iso: string): string => {
  const d = parseISO(iso);
  const day = capitalize(format(d, 'EEEE', { locale: es }));
  const month = capitalize(format(d, 'MMMM', { locale: es }));
  const year = format(d, 'yyyy');
  return `${day}, ${month} - ${year}.xlsx`;
};

const downloadActiveClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;

    const iso = typeof date === 'string' ? parseDMY(date) : null;
    if (!iso) {
      res.status(400).json({ error: 'date param is required and must be DD/MM/YYYY' });
      return;
    }

    const names = await reportService.findDeliveryClientsForDate(iso);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clientes');
    sheet.columns = [{ header: 'Cliente', key: 'name', width: 40 }];
    names.forEach((name) => sheet.addRow({ name }));

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = toSpanishFileName(iso);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const isIsoDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));

const exportMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;

    if (typeof date !== 'string' || !isIsoDate(date)) {
      res.status(400).json({ error: 'date param is required and must be YYYY-MM-DD' });
      return;
    }

    const menu = await menuService.findByDate(date);
    if (!menu) {
      res.status(404).json({ error: 'No menu found for this date' });
      return;
    }

    const buffer = await buildMenu(menu, date);
    const fileName = menuFileName(date);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportKitchenReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;

    if (typeof date !== 'string' || !isIsoDate(date)) {
      res.status(400).json({ error: 'date param is required and must be YYYY-MM-DD' });
      return;
    }

    const [menu, clients] = await Promise.all([
      menuService.findByDate(date),
      reportService.findActiveClientsWithPlansForDate(date),
    ]);

    if (!menu) {
      res.status(404).json({ error: 'No menu found for this date' });
      return;
    }

    const buffer = await buildKitchenReport(menu, clients, date);
    const fileName = kitchenReportFileName(date);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

export default { downloadActiveClients, exportMenu, exportKitchenReport };
