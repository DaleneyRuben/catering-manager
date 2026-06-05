import { NextFunction, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { parse, format, isValid } from 'date-fns';
import reportService from '../services/report.service';

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

    const names = await reportService.findDeliveryClientsForDate(iso);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clientes');
    sheet.columns = [{ header: 'Cliente', key: 'name', width: 40 }];
    names.forEach((name) => sheet.addRow({ name }));

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="clientes-${date}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

export default { downloadActiveClients };
