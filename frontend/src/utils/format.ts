import { format, parseISO } from 'date-fns';

export function formatDate(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy');
}
