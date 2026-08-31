// Lightweight, dependency-free date helpers working on local "YYYY-MM-DD" strings.

export const WEEKDAYS_LONG = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export const WEEKDAYS_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const pad = (n: number) => String(n).padStart(2, "0");

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayYMD(): string {
  return toYMD(new Date());
}

export function addDays(ymd: string, n: number): string {
  const d = fromYMD(ymd);
  d.setDate(d.getDate() + n);
  return toYMD(d);
}

export function addMonths(ymd: string, n: number): string {
  const d = fromYMD(ymd);
  d.setMonth(d.getMonth() + n);
  return toYMD(d);
}

/** Monday-based start of the week. */
export function startOfWeek(ymd: string): string {
  const d = fromYMD(ymd);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return toYMD(d);
}

export function weekDays(ymd: string): string[] {
  const start = startOfWeek(ymd);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Returns 6 weeks (42 cells) covering the month of `ymd`, Monday-based. */
export function monthGrid(ymd: string): string[] {
  const d = fromYMD(ymd);
  const first = toYMD(new Date(d.getFullYear(), d.getMonth(), 1));
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function monthOf(ymd: string): number {
  return fromYMD(ymd).getMonth();
}

export function isToday(ymd: string | null): boolean {
  return ymd === todayYMD();
}

export function isPast(ymd: string | null): boolean {
  if (!ymd) return false;
  return ymd < todayYMD();
}

export function isWeekend(ymd: string): boolean {
  const day = fromYMD(ymd).getDay();
  return day === 0 || day === 6;
}

export function dayNum(ymd: string): number {
  return fromYMD(ymd).getDate();
}

/** e.g. "lunes 31 agosto" */
export function formatLong(ymd: string): string {
  const d = fromYMD(ymd);
  return `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}

/** e.g. "31 ago" */
export function formatShort(ymd: string): string {
  const d = fromYMD(ymd);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()].slice(0, 3)}`;
}

/** e.g. "Agosto 2026" */
export function formatMonthYear(ymd: string): string {
  const d = fromYMD(ymd);
  const m = MONTHS_LONG[d.getMonth()];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
}

/** Human relative label used in lists: Hoy / Mañana / Ayer / lunes 31 ago. */
export function relativeLabel(ymd: string): string {
  const today = todayYMD();
  if (ymd === today) return "Hoy";
  if (ymd === addDays(today, 1)) return "Mañana";
  if (ymd === addDays(today, -1)) return "Ayer";
  const d = fromYMD(ymd);
  const wd = WEEKDAYS_SHORT[d.getDay()].toLowerCase();
  return `${wd} ${d.getDate()} ${MONTHS_LONG[d.getMonth()].slice(0, 3)}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
