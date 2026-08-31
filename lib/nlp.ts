// Minimal Spanish natural-language parser for quick capture.
// Extracts a date and time from free text and returns the cleaned title.
// Intentionally simple: a helpful enhancement, never a blocker.

import {
  MONTHS_LONG,
  WEEKDAYS_LONG,
  addDays,
  fromYMD,
  startOfWeek,
  todayYMD,
  toYMD,
} from "./dates";

export interface ParseResult {
  title: string;
  date: string | null;
  time: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");

function nextWeekday(target: number, from = todayYMD()): string {
  // target: 0 Sun .. 6 Sat. Returns the next date (strictly future, or today+7 if same).
  const base = fromYMD(from);
  const cur = base.getDay();
  let diff = (target - cur + 7) % 7;
  if (diff === 0) diff = 7;
  return addDays(from, diff);
}

// Accent-insensitive helper for matching.
function deaccent(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function parseQuickAdd(raw: string): ParseResult {
  let text = ` ${raw.trim()} `;
  let date: string | null = null;
  let time: string | null = null;

  const strip = (re: RegExp) => {
    text = text.replace(re, " ");
  };

  const today = todayYMD();

  // --- TIME ---
  // "a las 16:00", "a las 16h", "16:00", "16h", "9 am", "9:30am"
  const timeRe =
    /\b(?:a\s+las\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|h|hs|hrs)?\b/i;
  const tMatch = text.match(timeRe);
  if (tMatch) {
    let hh = parseInt(tMatch[1], 10);
    const mm = tMatch[2] ? parseInt(tMatch[2], 10) : 0;
    const suffix = (tMatch[3] || "").toLowerCase();
    const hadColon = !!tMatch[2];
    const hadSuffix = !!suffix;
    // Only treat a bare number as a time if it looks like one (colon or h/am/pm),
    // to avoid capturing dates like "18 septiembre".
    if ((hadColon || hadSuffix) && hh <= 23 && mm <= 59) {
      if (suffix === "pm" && hh < 12) hh += 12;
      if (suffix === "am" && hh === 12) hh = 0;
      time = `${pad(hh)}:${pad(mm)}`;
      strip(new RegExp(tMatch[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    }
  }

  const norm = deaccent(text.toLowerCase());

  // --- RELATIVE KEYWORDS ---
  if (/\bpasado\s+manana\b/.test(norm)) {
    date = addDays(today, 2);
    strip(/\bpasado\s+ma[ñn]ana\b/i);
  } else if (/\bmanana\b/.test(norm)) {
    date = addDays(today, 1);
    strip(/\bma[ñn]ana\b/i);
  } else if (/\bhoy\b/.test(norm)) {
    date = today;
    strip(/\bhoy\b/i);
  } else if (
    /\b(la\s+)?(proxima|siguiente)\s+semana\b/.test(norm) ||
    /\bsemana\s+que\s+viene\b/.test(norm)
  ) {
    // Next week -> next Monday.
    date = addDays(startOfWeek(today), 7);
    strip(/\b(la\s+)?(pr[oó]xima|siguiente)\s+semana\b/i);
    strip(/\bsemana\s+que\s+viene\b/i);
  } else if (/\b(este|proximo|el)?\s*fin\s+de\s+semana\b/.test(norm)) {
    date = nextWeekday(6); // Saturday
    strip(/\b(este|pr[oó]ximo|el)?\s*fin\s+de\s+semana\b/i);
  }

  // --- WEEKDAY NAMES ---
  if (!date) {
    for (let i = 0; i < WEEKDAYS_LONG.length; i++) {
      const name = deaccent(WEEKDAYS_LONG[i]);
      const re = new RegExp(`\\b(el|este|proximo|pr[oó]ximo)?\\s*${name}\\b`);
      if (re.test(norm)) {
        date = nextWeekday(i);
        strip(new RegExp(`\\b(el|este|pr[oó]ximo)?\\s*${WEEKDAYS_LONG[i]}\\b`, "i"));
        // also strip deaccented spelling
        strip(new RegExp(`\\b(el|este|pr[oó]ximo)?\\s*${name}\\b`, "i"));
        break;
      }
    }
  }

  // --- EXPLICIT DAY + MONTH: "18 septiembre" / "18 de septiembre" ---
  if (!date) {
    for (let m = 0; m < MONTHS_LONG.length; m++) {
      const mName = deaccent(MONTHS_LONG[m]);
      const re = new RegExp(`\\b(\\d{1,2})\\s*(?:de\\s+)?${mName}\\b`);
      const match = norm.match(re);
      if (match) {
        const day = parseInt(match[1], 10);
        const now = fromYMD(today);
        let year = now.getFullYear();
        let candidate = toYMD(new Date(year, m, day));
        if (candidate < today) {
          year += 1;
          candidate = toYMD(new Date(year, m, day));
        }
        if (day >= 1 && day <= 31) {
          date = candidate;
          strip(new RegExp(`\\b\\d{1,2}\\s*(?:de\\s+)?${MONTHS_LONG[m]}\\b`, "i"));
          strip(new RegExp(`\\b\\d{1,2}\\s*(?:de\\s+)?${mName}\\b`, "i"));
        }
        break;
      }
    }
  }

  // --- NUMERIC DATE: "18/09", "18-9", "18/09/2026" ---
  if (!date) {
    const re = /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/;
    const match = text.match(re);
    if (match) {
      const day = parseInt(match[1], 10);
      const mon = parseInt(match[2], 10) - 1;
      const now = fromYMD(today);
      let year = match[3]
        ? parseInt(match[3].length === 2 ? `20${match[3]}` : match[3], 10)
        : now.getFullYear();
      if (mon >= 0 && mon <= 11 && day >= 1 && day <= 31) {
        let candidate = toYMD(new Date(year, mon, day));
        if (!match[3] && candidate < today) {
          candidate = toYMD(new Date(year + 1, mon, day));
        }
        date = candidate;
        strip(new RegExp(match[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    }
  }

  // Clean leftover connector words and whitespace.
  let title = text
    .replace(/\s+/g, " ")
    .replace(/\s*\b(el|los|para|a\s+las|de|del)\b\s*$/i, "")
    .trim();

  // Remove a dangling leading/trailing preposition left by stripping.
  title = title.replace(/^(el|para|a las|de)\s+/i, "").trim();

  return { title: title || raw.trim(), date, time };
}
