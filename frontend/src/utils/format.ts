import { format, parseISO } from 'date-fns';

export function formatDate(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy');
}

export function formatDateTime(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy HH:mm');
}
