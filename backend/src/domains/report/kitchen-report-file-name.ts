import { spanishWeekdayFileName } from '../../utils/date';

export const kitchenReportFileName = (date: string): string => spanishWeekdayFileName(date, 'docx');
