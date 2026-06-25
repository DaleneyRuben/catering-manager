import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return format(parseISO(iso), 'dd/MM/yyyy');
}

export function formatDateTime(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy HH:mm');
}

export function formatLongDate(iso: string, { withYear = false }: { withYear?: boolean } = {}) {
  const pattern = withYear ? "EEEE d 'de' MMMM, yyyy" : "EEEE d 'de' MMMM";
  const label = format(parseISO(iso), pattern, { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatShortDate(iso: string) {
  return format(parseISO(iso), 'dd/MM');
}
