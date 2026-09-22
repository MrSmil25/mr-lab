import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DAY_KEYS, DAY_LABEL_EN, DAY_LABEL_ID, dayKeyFromName, toTime24, type DayKey } from "@/lib/jakarta-time";

/**
 * Weekly class schedule for the signed-in student.
 *
 * Source of truth: public.course_schedules joined to public.courses_master.
 * Rows are read and written with the student's own session, so row level
 * security keeps every student inside their own timetable.
 */

export type ScheduleRow = {
  id: string;
  courseId: string | null;
  courseCode: string;
  courseName: string;
  /** Short day key used across the calendar (Mon…Sun). */
  dayKey: DayKey;
  /** Indonesian day name, e.g. "Senin". */
  dayLabelId: string;
  /** English day name, e.g. "Monday". */
  dayLabelEn: string;
  start: string;
  end: string | null;
  room: string;
};

export type ScheduleInput = {
  courseId: string;
  dayKey: DayKey;
  start: string;
  end: string;
  room: string;
};

export type CourseOption = { id: string; code: string; name: string };

const SCHEDULE_COLUMNS =
  "id, course_id, day_of_week, start_time, end_time, room, courses_master:course_id (course_code, course_name)";

type RawSchedule = {
  id: string | number;
  course_id: string | null;
  day_of_week: string | number | null;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  courses_master: { course_code: string | null; course_name: string | null } | null;
};

type QueryResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;

type LooseFilter<T> = QueryResult<T> & {
  eq: (column: string, value: string) => LooseFilter<T>;
  order: (column: string, options?: { ascending?: boolean }) => LooseFilter<T>;
  select: (columns?: string) => LooseFilter<T>;
};

type LooseTable = {
  select: (columns?: string) => LooseFilter<RawSchedule[]>;
  insert: (values: Record<string, unknown>) => LooseFilter<unknown>;
  update: (values: Record<string, unknown>) => LooseFilter<unknown>;
  delete: () => LooseFilter<unknown>;
};

/** course_schedules is not in the generated types yet, so queries use a loose view of the same client. */
function table(name: string): LooseTable {
  return (supabase as unknown as { from: (table: string) => LooseTable }).from(name);
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Accepts a weekday name (id/en) or a number (0=Sunday, 1..6 Mon–Sat, 7=Sunday). */
export function dayKeyFromValue(value: string | number | null | undefined): DayKey | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || /^\d+$/.test(String(value).trim())) {
    const num = Number(value);
    if (num === 0 || num === 7) return "Sun";
    if (num >= 1 && num <= 6) return DAY_KEYS[num - 1] ?? null;
    return null;
  }
  return dayKeyFromName(String(value));
}

function normalise(row: RawSchedule): ScheduleRow | null {
  const dayKey = dayKeyFromValue(row.day_of_week);
  const start = toTime24(row.start_time) ?? (row.start_time ? row.start_time.slice(0, 5) : null);
  if (!dayKey || !start) return null;
  const master = row.courses_master;
  return {
    id: String(row.id),
    courseId: row.course_id,
    courseCode: master?.course_code ?? "",
    courseName: master?.course_name ?? master?.course_code ?? "Mata kuliah",
    dayKey,
    dayLabelId: DAY_LABEL_ID[dayKey],
    dayLabelEn: DAY_LABEL_EN[dayKey],
    start,
    end: toTime24(row.end_time) ?? (row.end_time ? row.end_time.slice(0, 5) : null),
    room: row.room ?? "",
  };
}

/** The value stored in day_of_week: keeps the existing convention of the table. */
function dayValue(dayKey: DayKey, sample: ScheduleRow[] | null, raw: string | number | null): string | number {
  if (typeof raw === "number") return DAY_KEYS.indexOf(dayKey) + 1;
  void sample;
  return DAY_LABEL_EN[dayKey];
}

function payload(input: ScheduleInput, numericDays: boolean, studentId: string) {
  return {
    student_id: studentId,
    course_id: input.courseId,
    day_of_week: numericDays ? DAY_KEYS.indexOf(input.dayKey) + 1 : dayValue(input.dayKey, null, null),
    start_time: `${input.start}:00`,
    end_time: input.end ? `${input.end}:00` : null,
    room: input.room || null,
  };
}

export function useCourseSchedules() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numericDays, setNumericDays] = useState(false);

  const refresh = useCallback(async () => {
    const userId = await currentUserId();
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await table("course_schedules").select(SCHEDULE_COLUMNS).eq("student_id", userId);
    if (queryError) setError(queryError.message);
    else setError(null);
    const raw = data ?? [];
    setNumericDays(raw.some((row) => typeof row.day_of_week === "number"));
    const parsed = raw
      .map(normalise)
      .filter((row): row is ScheduleRow => row !== null)
      .sort((a, b) => `${DAY_KEYS.indexOf(a.dayKey)}${a.start}`.localeCompare(`${DAY_KEYS.indexOf(b.dayKey)}${b.start}`));
    setRows(parsed);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: ScheduleInput) => {
    const userId = await currentUserId();
    if (!userId) return "Kamu harus masuk dulu.";
    const { error: insertError } = await table("course_schedules").insert(payload(input, numericDays, userId));
    await refresh();
    return insertError?.message ?? null;
  }, [numericDays, refresh]);

  const update = useCallback(async (id: string, input: ScheduleInput) => {
    const userId = await currentUserId();
    if (!userId) return "Kamu harus masuk dulu.";
    const { error: updateError } = await table("course_schedules").update(payload(input, numericDays, userId)).eq("id", id).eq("student_id", userId);
    await refresh();
    return updateError?.message ?? null;
  }, [numericDays, refresh]);

  const remove = useCallback(async (id: string) => {
    const userId = await currentUserId();
    if (!userId) return "Kamu harus masuk dulu.";
    const { error: deleteError } = await table("course_schedules").delete().eq("id", id).eq("student_id", userId);
    await refresh();
    return deleteError?.message ?? null;
  }, [refresh]);

  return { rows, loading, error, refresh, create, update, remove };
}

/** Course catalogue used by the schedule form. */
export function useCourseOptions() {
  const [options, setOptions] = useState<CourseOption[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await (table("courses_master") as unknown as LooseTable)
        .select("id, course_code, course_name")
        .order("course_code", { ascending: true }) as unknown as { data: { id: string; course_code: string | null; course_name: string | null }[] | null };
      setOptions((data ?? []).map((row) => ({ id: String(row.id), code: row.course_code ?? "", name: row.course_name ?? row.course_code ?? "Mata kuliah" })));
    })();
  }, []);

  return options;
}
