import { NextFunction, Request, Response } from 'express';
import { Document, Packer, Paragraph, TextRun } from 'docx';
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

    const doc = new Document({
      sections: [
        {
          children: names.map((name) => new Paragraph({ children: [new TextRun(name)] })),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Disposition', `attachment; filename="clientes-${date}.docx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

export default { downloadActiveClients };
