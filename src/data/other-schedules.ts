import { useEffect, useState } from "react";
import { onScopedHydrated, readScoped, writeScoped } from "@/lib/scoped-storage";

export const OTHER_SCHEDULE_TYPES = ["Asistensi", "Rapat", "Lomba", "Konferensi", "Wawancara", "Pekerjaan organisasi", "Kegiatan lainnya"] as const;
export type OtherScheduleType = (typeof OTHER_SCHEDULE_TYPES)[number];

export type OtherSchedule = {
  id: number;
  type: OtherScheduleType;
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
  organizer: string;
  description: string;
  url?: string;
};

const STORAGE_KEY = "my-room.other-schedules.v1";

/** Agenda nonkelas yang dibuat pengguna dan disimpan terpisah untuk setiap akun. */
export function useOtherSchedules() {
  const [schedules, setSchedules] = useState<OtherSchedule[]>([]);

  useEffect(() => {
    const read = () => setSchedules(readScoped<OtherSchedule[]>(STORAGE_KEY) ?? []);
    read();
    return onScopedHydrated(read);
  }, []);

  const save = (next: OtherSchedule[]) => {
    setSchedules(next);
    writeScoped(STORAGE_KEY, next);
  };

  return {
    schedules,
    addSchedule: (schedule: Omit<OtherSchedule, "id">) => save([...schedules, { ...schedule, id: Date.now() }]),
    removeSchedule: (id: number) => save(schedules.filter((schedule) => schedule.id !== id)),
  };
}