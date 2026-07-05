import {
  differenceInCalendarDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isSameDay,
  parseISO,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { SESSION_DURATION_HOURS } from '@/constants/session';

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

export function formatTime(iso: string) {
  return format(parseISO(iso), 'HH:mm');
}

// Returns "Hoy · Sábado 04/07", "Ayer · Viernes 03/07", or "Miércoles 01/07"
export function formatDayGroupLabel(iso: string, now = new Date()) {
  const date = parseISO(iso);
  const base = formatWeekdayDate(iso);
  if (isSameDay(date, now)) return `Hoy · ${base}`;
  if (isSameDay(date, subDays(now, 1))) return `Ayer · ${base}`;
  return base;
}

// Returns "Hoy · 14:32" if iso is today, otherwise "12/06 · 14:32"
export function formatConnectionStamp(iso: string, now = new Date()) {
  const date = parseISO(iso);
  const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
  const time = format(date, 'HH:mm');
  return isToday ? `Hoy · ${time}` : `${format(date, 'dd/MM')} · ${time}`;
}

const DEVICE_TYPE_LABELS: Record<string, string> = {
  mobile: 'Móvil',
  desktop: 'Escritorio',
  tablet: 'Tableta',
};

export function formatDeviceType(deviceType: string | null): string | null {
  return deviceType ? (DEVICE_TYPE_LABELS[deviceType] ?? null) : null;
}

const DEVICE_TYPE_ICONS: Record<string, string> = {
  mobile: 'smartphone',
  desktop: 'monitor',
  tablet: 'tablet',
};

export function deviceIcon(deviceType: string | null): string | null {
  return deviceType ? (DEVICE_TYPE_ICONS[deviceType] ?? null) : null;
}

// Returns "Chrome 149 · macOS" (missing parts omitted), or null when nothing is known
export function formatBrowserOs(browser: string | null, os: string | null): string | null {
  const parts = [browser, os].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

// Returns "Chrome 126 · Android 14 · Móvil" (missing parts omitted), or null when nothing is known
export function formatDevice(
  browser: string | null,
  os: string | null,
  deviceType: string | null,
): string | null {
  const parts = [browser, os, deviceType ? DEVICE_TYPE_LABELS[deviceType] : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

// Last-access stamp for the users table: "Hace X min", "Hace X horas",
// "Hoy · HH:mm", "Ayer · HH:mm", or "Hace X días". The 4-hour cutoff is where
// the design switches from a relative stamp to the "Hoy · HH:mm" form.
export function formatLastSeen(iso: string, now = new Date()) {
  const date = parseISO(iso);
  const mins = differenceInMinutes(now, date);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = differenceInHours(now, date);
  if (hours < 4) return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
  if (isSameDay(date, now)) return `Hoy · ${format(date, 'HH:mm')}`;
  if (isSameDay(date, subDays(now, 1))) return `Ayer · ${format(date, 'HH:mm')}`;
  return `Hace ${differenceInCalendarDays(now, date)} días`;
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

// A user is "active" while their login token is still valid — same window
// as the backend's session token lifetime (SESSION_DURATION_HOURS).
export function isOnline(iso: string, now = new Date()) {
  return differenceInHours(now, parseISO(iso)) < SESSION_DURATION_HOURS;
}
