import { NextFunction, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { parse, format, isValid, parseISO } from 'date-fns';
import { checkIsWeekend } from '../utils/devFlags';
import { spanishWeekdayFileName } from '../utils/date';
import * as menuService from '../services/menu';
import * as reportService from '../services/report';
import { buildMenu, menuFileName } from '../utils/menuBuilder';
import { buildKitchenReport, kitchenReportFileName } from '../utils/kitchenReportBuilder';

const parseDMY = (value: string): string | null => {
  const parsed = parse(value, 'dd/MM/yyyy', new Date());
  if (!isValid(parsed)) return null;
  return format(parsed, 'yyyy-MM-dd');
};

const downloadActiveClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;

    const iso = typeof date === 'string' ? parseDMY(date) : null;
    if (!iso) {
      res.status(400).json({ error: 'date param is required and must be DD/MM/YYYY' });
      return;
    }

    if (checkIsWeekend(parseISO(iso))) {
      res.status(400).json({ error: 'No hay entregas los fines de semana' });
      return;
    }

    const names = await reportService.findDeliveryClientsForDate(iso);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clientes');
    sheet.columns = [{ header: 'Cliente', key: 'name', width: 40 }];
    names.forEach((name) => sheet.addRow({ name }));

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = spanishWeekdayFileName(iso, 'xlsx');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
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

    if (checkIsWeekend(parseISO(date))) {
      res.status(400).json({ error: 'No hay entregas los fines de semana' });
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
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
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

    if (checkIsWeekend(parseISO(date))) {
      res.status(400).json({ error: 'No hay entregas los fines de semana' });
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
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

export default { downloadActiveClients, exportMenu, exportKitchenReport };
