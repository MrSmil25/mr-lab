import { useEffect, useState } from "react";
import { readScoped, writeScoped } from "@/lib/scoped-storage";

/**
 * Rutinitas berulang mingguan (olahraga, magang, rapat organisasi, dll.).
 * Disimpan terpisah untuk setiap akun yang masuk, sama seperti organisasi.
 */

export const ROUTINE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type RoutineDay = (typeof ROUTINE_DAYS)[number];

export const ROUTINE_DAY_LABELS: Record<RoutineDay, string> = {
  Mon: "Sen", Tue: "Sel", Wed: "Rab", Thu: "Kam", Fri: "Jum", Sat: "Sab", Sun: "Min",
};

export const ROUTINE_TYPES = ["Rutinitas pribadi", "Organisasi", "Pekerjaan", "Olahraga", "Ibadah", "Lainnya"] as const;
export type RoutineType = (typeof ROUTINE_TYPES)[number];

export type Routine = {
  id: number;
  title: string;
  type: RoutineType;
  organization?: string;
  days: RoutineDay[];
  start?: string;
  end?: string;
  location?: string;
};

const STORAGE_KEY = "my-room.routines.v1";

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    setRoutines(readScoped<Routine[]>(STORAGE_KEY) ?? []);
  }, []);

  const save = (next: Routine[]) => {
    setRoutines(next);
    writeScoped(STORAGE_KEY, next);
  };

  return {
    routines,
    addRoutine: (routine: Omit<Routine, "id">) => save([...routines, { ...routine, id: Date.now() }]),
    removeRoutine: (id: number) => save(routines.filter((routine) => routine.id !== id)),
  };
}
