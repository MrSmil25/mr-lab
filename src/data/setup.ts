import { useEffect, useState } from "react";
import { curriculum, TOTAL_SKS, courseByCode } from "@/data/curriculum";
import { onScopedHydrated, readScoped, removeScoped, writeScoped } from "@/lib/scoped-storage";

export const SECTIONS = ["A", "B", "C", "D", "E"] as const;
export type Section = (typeof SECTIONS)[number];

export const CLASS_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type ClassDay = (typeof CLASS_DAYS)[number];

export type ActiveCourseConfig = {
  code: string;
  section: Section;
  lecturer: string;
  assistant: string;
  day: ClassDay;
  start: string;
  end: string;
  room: string;
};

export type CustomCourse = {
  code: string;
  name: string;
  faculty: string;
  sks: number;
  lecturer: string;
  day: ClassDay;
  start: string;
  end: string;
  room: string;
  countsTowardGraduation: boolean;
};

export type StudentSetup = {
  name: string;
  program: string;
  programId?: string;
  faculty: string;
  university: string;
  entryYear: number;
  currentSemester: number;
  completed: string[];
  active: ActiveCourseConfig[];
  customCourses?: CustomCourse[];
  /** Kurikulum yang ditulis sendiri mahasiswa (opsi "buat kurikulum sendiri"). */
  customCurriculum?: { totalSks: number; courses: { code: string; name: string; sks: number; semester: number }[] };
  completedAt: string;
};

const STORAGE_KEY = "academic-os.setup.v1";

export function loadSetup(): StudentSetup | null {
  return readScoped<StudentSetup>(STORAGE_KEY);
}

export function persistSetup(setup: StudentSetup | null) {
  if (setup) writeScoped(STORAGE_KEY, setup);
  else removeScoped(STORAGE_KEY);
}

/**
 * Academic setup state. The answers are cached on this device and mirrored
 * into the student's profile in the academic database.
 */
export function useSetup() {
  const [ready, setReady] = useState(false);
  const [setup, setSetupState] = useState<StudentSetup | null>(null);

  useEffect(() => {
    let cancelled = false;
    const activate = (current: StudentSetup) =>
      void import("@/data/curriculum-catalog")
        .then((catalog) =>
          current.customCurriculum
            ? catalog.applyCustomCurriculum(current.customCurriculum)
            : catalog.activateCurriculumForProgram(current.programId),
        )
        .catch(() => {});

    const local = loadSetup();
    if (local) {
      setSetupState(local);
      activate(local);
      setReady(true);
      return;
    }

    // No local copy (new device or cleared browser): rebuild it from the account.
    void import("@/data/academic")
      .then((academic) => academic.fetchRemoteSetup())
      .catch(() => null)
      .then((remote) => {
        if (cancelled) return;
        if (remote && remote.programId) {
          const restored = remote as unknown as StudentSetup;
          persistSetup(restored);
          setSetupState(restored);
          activate(restored);
        }
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);


  const save = (next: StudentSetup) => {
    persistSetup(next);
    setSetupState(next);
    void import("@/data/academic")
      .then((academic) =>
        academic.syncProfileFromSetup({
          name: next.name,
          programId: next.programId,
          entryYear: next.entryYear,
          currentSemester: next.currentSemester,
          completed: next.completed,
          active: next.active,
        }),
      )
      .catch(() => {});
  };
  const reset = () => {
    persistSetup(null);
    setSetupState(null);
  };

  return { ready, setup, save, reset };
}

/**
 * Menggabungkan data setup di perangkat dengan data akademik yang tersimpan di
 * akun, sehingga form "ubah profil" selalu terbuka dengan pilihan mata kuliah
 * yang sudah ada — bukan dari kosong.
 */
export function mergeSetup(local: StudentSetup | null, remote: Partial<StudentSetup> | null): StudentSetup | null {
  if (!remote) return local;
  if (!local) return (remote.name ? (remote as StudentSetup) : null);

  const active = [...local.active];
  for (const item of remote.active ?? []) {
    if (!active.some((existing) => existing.code === item.code)) active.push(item);
  }
  const activeCodes = new Set(active.map((item) => item.code));
  const completed = [...new Set([...local.completed, ...(remote.completed ?? [])])].filter((code) => !activeCodes.has(code));

  return {
    ...local,
    name: local.name || (remote.name ?? ""),
    entryYear: local.entryYear || (remote.entryYear ?? local.entryYear),
    currentSemester: local.currentSemester || (remote.currentSemester ?? local.currentSemester),
    completed,
    active,
    customCourses: local.customCourses ?? [],
  };
}

export const semesterGroups = Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => ({
  semester,
  courses: curriculum.filter((course) => course.semester === semester),
}));

export function sksOf(codes: string[]) {
  return codes.reduce((total, code) => total + (courseByCode.get(code)?.sks ?? 0), 0);
}

export function degreeProgress(codes: string[]) {
  const completedSks = sksOf(codes);
  return {
    completedSks,
    remainingSks: Math.max(TOTAL_SKS - completedSks, 0),
    percent: Math.min(Math.round((completedSks / TOTAL_SKS) * 100), 100),
    totalSks: TOTAL_SKS,
  };
}
