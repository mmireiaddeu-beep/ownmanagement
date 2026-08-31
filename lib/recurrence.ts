import { addDays, addMonths, fromYMD, toYMD } from "./dates";
import type { Recurrence } from "./types";

export const RECURRENCE_PRESETS: {
  key: string;
  label: string;
  build: (baseDate: string) => Recurrence;
}[] = [
  {
    key: "daily",
    label: "Cada día",
    build: () => ({ freq: "daily", interval: 1 }),
  },
  {
    key: "weekly",
    label: "Cada semana",
    build: () => ({ freq: "weekly", interval: 1 }),
  },
  {
    key: "biweekly",
    label: "Cada 2 semanas",
    build: () => ({ freq: "weekly", interval: 2 }),
  },
  {
    key: "monthly",
    label: "Cada mes",
    build: () => ({ freq: "monthly", interval: 1 }),
  },
];

export function describeRecurrence(r: Recurrence): string {
  if (r.freq === "daily") return r.interval === 1 ? "Cada día" : `Cada ${r.interval} días`;
  if (r.freq === "weekly")
    return r.interval === 1 ? "Cada semana" : `Cada ${r.interval} semanas`;
  return r.interval === 1 ? "Cada mes" : `Cada ${r.interval} meses`;
}

/** Compute the next occurrence date given a base date and a recurrence rule. */
export function nextOccurrence(baseDate: string, r: Recurrence): string {
  if (r.freq === "daily") return addDays(baseDate, r.interval);
  if (r.freq === "weekly") return addDays(baseDate, 7 * r.interval);
  // monthly
  return addMonths(baseDate, r.interval);
}
