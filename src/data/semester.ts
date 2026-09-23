import { useEffect, useRef, useState } from "react";
import { courseByCode } from "@/data/curriculum";
import type { StudentSetup } from "@/data/setup";
import { onScopedHydrated, readScoped, writeScoped } from "@/lib/scoped-storage";

export const LINK_KINDS = ["Google Classroom", "Google Drive", "Google Sheets", "LMS (EMAS)", "Assistant link", "Other"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export type CourseLink = { id: number; code: string; kind: LinkKind; label: string; url: string };

export type AssistantSession = {
  id: number;
  code: string;
  section: string;
  assistant: string;
  day: string;
  start: string;
  end: string;
  room: string;
  link: string;
};

export type ArchivedSemester = {
  id: number;
  semester: number;
  academicYear: string;
  courses: string[];
  sks: number;
  gpa: number;
  resources: number;
  completedTasks: number;
  notes: string;
};

export type SemesterData = {
  links: CourseLink[];
  sessions: AssistantSession[];
  archive: ArchivedSemester[];
};

const STORAGE_KEY = "academic-os.semester.v1";
const empty: SemesterData = { links: [], sessions: [], archive: [] };

/**
 * Semester workspace state (links, assistant sessions, archive) kept on this
 * device. Academic records themselves live in the shared academic database.
 */
export function useSemesterData() {
  const [data, setData] = useState<SemesterData>(empty);

  const cache = (next: SemesterData) => {
    setData(next);
    writeScoped(STORAGE_KEY, next);
  };

  useEffect(() => {
    const read = () => {
      const stored = readScoped<SemesterData>(STORAGE_KEY);
      setData(stored ? { ...empty, ...stored } : empty);
    };
    read();
    return onScopedHydrated(read);
  }, []);

  return {
    ...data,
    addLink: (link: Omit<CourseLink, "id">) => cache({ ...data, links: [...data.links, { ...link, id: Date.now() }] }),
    removeLink: (id: number) => cache({ ...data, links: data.links.filter((item) => item.id !== id) }),
    addSession: (session: Omit<AssistantSession, "id">) => cache({ ...data, sessions: [...data.sessions, { ...session, id: Date.now() }] }),
    removeSession: (id: number) => cache({ ...data, sessions: data.sessions.filter((item) => item.id !== id) }),
    addArchive: (entry: Omit<ArchivedSemester, "id">) =>
      cache({ ...data, archive: [...data.archive, { ...entry, id: Date.now() }].sort((a, b) => a.semester - b.semester) }),
    removeArchive: (id: number) => cache({ ...data, archive: data.archive.filter((item) => item.id !== id) }),
  };
}


/** Semester 1 starts in the entry year's odd (Gasal) term; each year holds two semesters. */
export function academicYearLabel(entryYear: number, semester: number) {
  const yearOffset = Math.floor((semester - 1) / 2);
  const startYear = entryYear + yearOffset;
  const term = semester % 2 === 1 ? "Gasal" : "Genap";
  return `${term} ${startYear}/${startYear + 1}`;
}

export function courseTitle(code: string) {
  return courseByCode.get(code)?.name ?? code;
}

/** Everything the semester workspace header needs, derived from the onboarding setup. */
export function semesterSummary(setup: StudentSetup | null, activeSks: number, activeCount: number, completedSks: number, totalSks: number) {
  const semester = setup?.currentSemester ?? 1;
  return {
    semester,
    academicYear: academicYearLabel(setup?.entryYear ?? new Date().getFullYear(), semester),
    completedSks,
    totalSks,
    activeSks,
    activeCount,
  };
}
