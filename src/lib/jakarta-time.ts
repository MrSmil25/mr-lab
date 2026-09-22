/**
 * Real date and time helpers pinned to the Asia/Jakarta timezone (UTC+7).
 * Everything the calendar shows — today, day names, week range, the current
 * time indicator — is derived from these helpers, never from fixed values.
 */

export const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export const DAY_KEYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Indonesian day names, indexed by the short key used across the calendar. */
export const DAY_LABEL_ID: Record<DayKey, string> = {
  Mon: "Senin",
  Tue: "Selasa",
  Wed: "Rabu",
  Thu: "Kamis",
  Fri: "Jumat",
  Sat: "Sabtu",
  Sun: "Minggu",
};

/** English day names, used to read schedules stored in English. */
export const DAY_LABEL_EN: Record<DayKey, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: JAKARTA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  weekday: "short",
});

export type JakartaNow = {
  /** ISO calendar date in Jakarta, e.g. 2026-09-17. */
  iso: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** Minutes elapsed since midnight in Jakarta. */
  minutesOfDay: number;
  /** 24-hour clock, e.g. 13:45. */
  time: string;
  dayKey: DayKey;
};

/** The real current moment in Jakarta, broken into calendar parts. */
export function jakartaNow(base: Date = new Date()): JakartaNow {
  const parts = Object.fromEntries(PARTS_FORMATTER.formatToParts(base).map((part) => [part.type, part.value])) as Record<string, string>;
  const year = Number(parts["year"]);
  const month = Number(parts["month"]);
  const day = Number(parts["day"]);
  const hour = Number(parts["hour"] === "24" ? "0" : parts["hour"]);
  const minute = Number(parts["minute"]);
  const weekday = (parts["weekday"] ?? "Mon") as DayKey;
  const dayKey = DAY_KEYS.includes(weekday) ? weekday : "Mon";
  return {
    iso: `${parts["year"]}-${parts["month"]}-${parts["day"]}`,
    year,
    month,
    day,
    hour,
    minute,
    minutesOfDay: hour * 60 + minute,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    dayKey,
  };
}

/** Adds days to an ISO calendar date without any timezone drift. */
export function addDaysIso(iso: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Shift an ISO date by whole months, clamping the day to the target month length. */
export function shiftMonthIso(iso: string, months: number): string {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  const total = (year * 12 + (month - 1)) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonth = (total % 12) + 1;
  const maxDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clamped = Math.min(day, maxDay);
  return `${String(targetYear).padStart(4, "0")}-${String(targetMonth).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
}

export function dayKeyOfIso(iso: string): DayKey {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
  return DAY_KEYS[(index + 6) % 7] ?? "Mon";
}

export type CalendarDay = { key: DayKey; iso: string; label: string; labelEn: string; date: string; monthShort: string };

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function monthNameId(month: number): string {
  return MONTHS_ID[month - 1] ?? "";
}

/** The Monday-to-Sunday week containing the given Jakarta date. */
export function weekOf(iso: string): CalendarDay[] {
  const offset = DAY_KEYS.indexOf(dayKeyOfIso(iso));
  const monday = addDaysIso(iso, -offset);
  return DAY_KEYS.map((key, index) => {
    const dayIso = addDaysIso(monday, index);
    const [, month = "01", day = "01"] = dayIso.split("-");
    return {
      key,
      iso: dayIso,
      label: DAY_LABEL_ID[key],
      labelEn: DAY_LABEL_EN[key],
      date: String(Number(day)),
      monthShort: (MONTHS_ID[Number(month) - 1] ?? "").slice(0, 3),
    };
  });
}

/** Full Indonesian date, e.g. "Kamis, 17 September 2026". */
export function formatDateId(iso: string): string {
  const [year = "", month = "01", day = "01"] = iso.split("-");
  return `${DAY_LABEL_ID[dayKeyOfIso(iso)]}, ${Number(day)} ${monthNameId(Number(month))} ${year}`;
}

/** "17 September 2026" without the day name. */
export function formatDayMonthId(iso: string): string {
  const [year = "", month = "01", day = "01"] = iso.split("-");
  return `${Number(day)} ${monthNameId(Number(month))} ${year}`;
}

/** Normalises any written time into a 24-hour HH:mm string, or null. */
export function toTime24(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /(\d{1,2})[.:](\d{2})\s*(am|pm)?/i.exec(value);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3]?.toLowerCase();
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Minutes since midnight for an HH:mm string. */
export function minutesOf(time: string): number {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/** Reads a day name in Indonesian or English and returns the short key. */
export function dayKeyFromName(value: string | null | undefined): DayKey | null {
  if (!value) return null;
  const text = value.trim().toLowerCase();
  for (const key of DAY_KEYS) {
    if (text.startsWith(key.toLowerCase())) return key;
    if (text.startsWith(DAY_LABEL_EN[key].toLowerCase())) return key;
    if (text.startsWith(DAY_LABEL_ID[key].toLowerCase())) return key;
  }
  if (text.startsWith("jum")) return "Fri";
  if (text.startsWith("ming") || text.startsWith("ahad")) return "Sun";
  return null;
}

/** Reads "20 Sep 2026 · 23:59" or "2026-09-20" into an ISO date plus time. */
export function parseDueDate(value: string | null | undefined): { iso: string; time: string | null } | null {
  if (!value) return null;
  const text = value.trim();
  const time = toTime24(text.includes("·") ? (text.split("·")[1] ?? "") : "");
  const isoMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (isoMatch) return { iso: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`, time };
  const monthNames: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, mei: 5, jun: 6, jul: 7, aug: 8, agu: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12, des: 12,
  };
  const written = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(text);
  if (written) {
    const month = monthNames[(written[2] ?? "").slice(0, 3).toLowerCase()];
    if (month) return { iso: `${written[3]}-${String(month).padStart(2, "0")}-${String(Number(written[1])).padStart(2, "0")}`, time };
  }
  return null;
}

/** React-friendly ticking clock: re-renders every minute with the Jakarta time. */
export function nextMinuteDelay(base: Date = new Date()): number {
  return 60000 - (base.getSeconds() * 1000 + base.getMilliseconds());
}

/** Jakarta calendar date + 24h time for a stored timestamp (timestamptz). */
export function jakartaFromTimestamp(value: string): { iso: string; time: string } {
  const parts = jakartaNow(new Date(value));
  return { iso: parts.iso, time: parts.time };
}

/** Builds a timestamptz string for a Jakarta date + HH:mm, e.g. 2026-09-20T23:59:00+07:00. */
export function toJakartaTimestamp(iso: string, time = "23:59"): string {
  return `${iso}T${time.length === 5 ? time : "23:59"}:00+07:00`;
}

const MONTH_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Today", "Tomorrow" or "20 Sep", relative to the real Jakarta date. */
export function relativeDueLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) return "Today";
  if (iso === addDaysIso(todayIso, 1)) return "Tomorrow";
  if (iso === addDaysIso(todayIso, -1)) return "Yesterday";
  const [, month = "01", day = "01"] = iso.split("-");
  return `${Number(day)} ${MONTH_SHORT_EN[Number(month) - 1] ?? ""}`;
}

/** Parses free text ("Today", "Tomorrow", "22 Sep", "2026-09-22") into an ISO date, or null. */
export function parseDueLabelToIso(value: string, todayIso: string): string | null {
  const text = value.trim().toLowerCase();
  if (!text) return null;
  if (text === "today" || text === "hari ini") return todayIso;
  if (text === "tomorrow" || text === "besok") return addDaysIso(todayIso, 1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})\s+([a-z]{3})/);
  if (match) {
    const day = Number(match[1]);
    const month = MONTH_SHORT_EN.findIndex((name) => name.toLowerCase() === match[2]);
    if (month >= 0) {
      const year = Number(todayIso.slice(0, 4));
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return iso < todayIso ? `${year + 1}${iso.slice(4)}` : iso;
    }
  }
  return null;
}
