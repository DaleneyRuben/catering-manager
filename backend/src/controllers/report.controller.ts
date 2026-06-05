import { NextFunction, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { parse, format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import reportService from '../services/report.service';

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

export default { downloadActiveClients };
