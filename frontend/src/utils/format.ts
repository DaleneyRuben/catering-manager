import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  parseISO,
} from 'date-fns';
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

export function formatWeekdayDate(iso: string) {
  const label = format(parseISO(iso), 'EEEE dd/MM', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Returns "Hoy · 14:32" if iso is today, otherwise "12/06 · 14:32"
export function formatConnectionStamp(iso: string, now = new Date()) {
  const date = parseISO(iso);
  const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
  const time = format(date, 'HH:mm');
  return isToday ? `Hoy · ${time}` : `${format(date, 'dd/MM')} · ${time}`;
}

// Returns "hace X min", "hace X h", or "hace X días"
export function formatRelativeTime(iso: string, now = Date.now()) {
  const date = parseISO(iso);
  const mins = differenceInMinutes(now, date);
  if (mins < 60) return `hace ${mins} min`;
  const hours = differenceInHours(now, date);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${differenceInDays(now, date)} días`;
}
