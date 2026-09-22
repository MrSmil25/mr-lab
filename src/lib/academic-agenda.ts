/**
 * Academic intelligence for the calendar: agenda grouping, timeline milestones
 * and reminder data. Every function is pure and works on real events only —
 * nothing is invented when the data is empty.
 */

import { addDaysIso, formatDateId, formatDayMonthId, minutesOf, type JakartaNow } from "@/lib/jakarta-time";

export type AgendaKind = "Lecture" | "Assistant" | "Deadline" | "Study" | "Milestone";

export type AgendaEvent = {
  id: string;
  type: AgendaKind;
  /** ISO calendar date in Jakarta. */
  date?: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  course?: string;
  person?: string;
  priority?: "High" | "Medium" | "Low";
  detail?: string;
};

export type AgendaGroup = { iso: string; label: string; events: AgendaEvent[] };

const byStart = (a: AgendaEvent, b: AgendaEvent) => `${a.date ?? ""}${a.start}`.localeCompare(`${b.date ?? ""}${b.start}`);

/** Today / next days / rest of the week, all derived from the real Jakarta date. */
export function buildAgenda(events: AgendaEvent[], now: JakartaNow, weekIsos: string[]) {
  const today = events.filter((event) => event.date === now.iso).sort(byStart);

  const horizon = addDaysIso(now.iso, 7);
  const upcomingEvents = events
    .filter((event) => (event.date ?? "") > now.iso && (event.date ?? "") <= horizon)
    .sort(byStart);

  const upcoming: AgendaGroup[] = [];
  for (const event of upcomingEvents) {
    const iso = event.date!;
    const group = upcoming.find((item) => item.iso === iso);
    if (group) group.events.push(event);
    else upcoming.push({ iso, label: formatDateId(iso), events: [event] });
  }

  const weekAhead = events
    .filter((event) => weekIsos.includes(event.date ?? "") && (event.date ?? "") >= now.iso)
    .sort(byStart);

  const thisWeek = {
    total: weekAhead.length,
    classes: weekAhead.filter((event) => event.type === "Lecture").length,
    deadlines: weekAhead.filter((event) => event.type === "Deadline").length,
    study: weekAhead.filter((event) => event.type === "Study").length,
    milestones: weekAhead.filter((event) => event.type === "Milestone").length,
    events: weekAhead,
  };

  const remainingToday = today.filter((event) => minutesOf(event.start) >= now.minutesOfDay);
  const nextUp = remainingToday[0] ?? upcomingEvents[0] ?? null;

  return { today, upcoming: upcoming.slice(0, 4), thisWeek, nextUp, remainingToday };
}

export type Reminder = {
  id: string;
  /** Structure kept notification-ready: a scheduler can send these as-is. */
  kind: "class-soon" | "deadline-today" | "deadline-tomorrow" | "milestone-soon";
  title: string;
  message: string;
  eventId: string;
  date: string;
  start: string;
  minutesUntil: number | null;
};

/**
 * Derives reminders from real events only. A class reminder appears when the
 * class starts within the next hour; deadlines are flagged today and tomorrow.
 */
export function buildReminders(events: AgendaEvent[], now: JakartaNow): Reminder[] {
  const tomorrow = addDaysIso(now.iso, 1);
  const reminders: Reminder[] = [];

  for (const event of events) {
    if (!event.date) continue;
    const minutesUntil = event.date === now.iso ? minutesOf(event.start) - now.minutesOfDay : null;

    if ((event.type === "Lecture" || event.type === "Assistant") && minutesUntil !== null && minutesUntil > 0 && minutesUntil <= 60) {
      reminders.push({
        id: `reminder-${event.id}-class`,
        kind: "class-soon",
        title: event.title,
        message: `Starts in ${minutesUntil} minute${minutesUntil === 1 ? "" : "s"}${event.location ? ` · ${event.location}` : ""}`,
        eventId: event.id,
        date: event.date,
        start: event.start,
        minutesUntil,
      });
      continue;
    }

    if (event.type === "Deadline" && event.date === now.iso && (minutesUntil ?? 0) >= 0) {
      reminders.push({
        id: `reminder-${event.id}-today`,
        kind: "deadline-today",
        title: event.title,
        message: `Due today at ${event.start}${event.course ? ` · ${event.course}` : ""}`,
        eventId: event.id,
        date: event.date,
        start: event.start,
        minutesUntil: minutesUntil ?? null,
      });
      continue;
    }

    if (event.type === "Deadline" && event.date === tomorrow) {
      reminders.push({
        id: `reminder-${event.id}-tomorrow`,
        kind: "deadline-tomorrow",
        title: event.title,
        message: `Due tomorrow at ${event.start}${event.course ? ` · ${event.course}` : ""}`,
        eventId: event.id,
        date: event.date,
        start: event.start,
        minutesUntil: null,
      });
      continue;
    }

    if (event.type === "Milestone" && event.date >= now.iso && event.date <= addDaysIso(now.iso, 7)) {
      reminders.push({
        id: `reminder-${event.id}-milestone`,
        kind: "milestone-soon",
        title: event.title,
        message: `${event.detail ?? "Academic milestone"} · ${formatDayMonthId(event.date)}`,
        eventId: event.id,
        date: event.date,
        start: event.start,
        minutesUntil,
      });
    }
  }

  return reminders.sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)).slice(0, 5);
}

export type TimelineItem = {
  id: string;
  label: string;
  title: string;
  detail?: string;
  date: string;
  endDate?: string;
  start?: string;
  daysAway: number;
};

const isoToUtc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));

/** Days between two ISO Jakarta dates. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((isoToUtc(toIso) - isoToUtc(fromIso)) / 86_400_000);
}

/** Upcoming academic milestones — KRS periods, exams, assignment and project deadlines. */
export function buildTimeline(items: TimelineItem[], now: JakartaNow): TimelineItem[] {
  return items
    .filter((item) => (item.endDate ?? item.date) >= now.iso)
    .map((item) => ({ ...item, daysAway: daysBetween(now.iso, item.date) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
}
