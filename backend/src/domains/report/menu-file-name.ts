import { format, parseISO } from 'date-fns';

export const menuFileName = (date: string): string => {
  const parsed = parseISO(date);
  const dayMonth = format(parsed, 'dd-MM');
  return `Menu completo ${dayMonth}.docx`;
};
