import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Real academic data for the signed-in student, read from the shared
 * Supabase academic schema: profile, curriculum master data, the student's
 * own courses, and the course library (resources, files, notes).
 */

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/* --------------------------------- types --------------------------------- */

export type DashboardRow = {
  student_id: string;
  student_name: string;
  full_name: string;
  student_number: string | null;
  program_name: string;
  program_code: string;
  faculty: string;
  university: string;
  curriculum_year: number | null;
  current_semester: number;
  completed_credits: number;
  target_graduation: number | null;
  minimum_graduation_credit: number;
  remaining_credits: number;
  graduation_percentage: number;
  completed_courses: number;
  ongoing_courses: number;
  planned_courses: number;
  planned_sks: number;
  bookmarked_courses: number;
};

/** A curriculum course as the explorer and planner read it. */
export type RecommendationRow = {
  course_id: string;
  curriculum_course_id: string;
  code: string;
  name: string;
  sks: number;
  category: string | null;
  course_group: string | null;
  recommended_semester: number | null;
  prerequisites: string[];
  prerequisites_met: boolean;
  already_taken: boolean;
  already_completed: boolean;
  note: string | null;
};

export type StudentCourse = {
  id: string;
  courseId: string;
  code: string;
  name: string;
  sks: number;
  status: string;
  lecturer: string;
  section: string;
  day: string;
  start: string;
  end: string;
  room: string;
  schedule: string;
  semester: number | null;
  grade: string | null;
  resourceCount: number;
  fileCount: number;
  noteCount: number;
  taskCount: number;
};

export type LibraryEntry = {
  id: string;
  kind: string;
  title: string;
  description: string;
  url: string;
  courseId: string;
  courseCode: string;
  createdAt: string;
};

export type NoteEntry = {
  id: string;
  title: string;
  topic: string;
  body: string;
  attachment: string;
  courseId: string;
  courseCode: string;
};

export type LibraryCourse = {
  courseId: string;
  code: string;
  name: string;
  sks: number;
  semester: number | null;
  resourceCount: number;
  fileCount: number;
  noteCount: number;
};

const completedStatus = (status: string | null | undefined, courseStatus: string | null | undefined) =>
  (courseStatus ?? "").toUpperCase() === "COMPLETED" || (status ?? "").toLowerCase() === "completed";

/* ------------------------------- profile --------------------------------- */

type ProfileRow = {
  id: string;
  full_name: string;
  student_number: string | null;
  current_semester: number | null;
  entry_year: number | null;
  target_graduation: number | null;
  completed_credits: number | null;
  program_id: string | null;
  curriculum_version_id: string | null;
  programs: {
    university: string | null;
    faculty: string | null;
    program_name: string | null;
    curriculum_year: number | null;
    minimum_graduation_credit: number | null;
  } | null;
};

async function loadProfile(): Promise<ProfileRow | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("student_profile")
    .select(
      "id, full_name, student_number, current_semester, entry_year, target_graduation, completed_credits, program_id, curriculum_version_id, programs:program_id (university, faculty, program_name, curriculum_year, minimum_graduation_credit)",
    )
    .eq("id", userId)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
}

/** Creates or updates the academic profile of the signed-in student. */
export async function saveStudentProfile(input: {
  fullName: string;
  programId: string | null;
  curriculumVersionId: string | null;
  entryYear: number;
  currentSemester: number;
  completedCredits: number;
  targetGraduation: number | null;
}): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await supabase.from("student_profile").upsert(
    {
      id: userId,
      full_name: input.fullName,
      program_id: input.programId,
      curriculum_version_id: input.curriculumVersionId,
      entry_year: input.entryYear,
      current_semester: input.currentSemester,
      completed_credits: input.completedCredits,
      target_graduation: input.targetGraduation,
    },
    { onConflict: "id" },
  );
}

/** The signed-in student's profile, or null when onboarding is still needed. */
export function useStudentProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setProfile(await loadProfile().catch(() => null));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, refresh };
}

/* ------------------------------- dashboard -------------------------------- */

/** Dashboard numbers: credits, graduation percentage, course counts. */
export function useDashboard() {
  const [data, setData] = useState<DashboardRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const userId = await currentUserId();
      if (!userId) {
        setData(null);
        setLoading(false);
        return;
      }
      const [profile, { data: view }] = await Promise.all([
        loadProfile(),
        supabase.from("student_home_dashboard_view").select("*").eq("student_id", userId).maybeSingle(),
      ]);
      if (!profile) {
        setData(null);
        setLoading(false);
        return;
      }

      const program = profile.programs;
      const minimum = program?.minimum_graduation_credit ?? profile.target_graduation ?? 144;
      const completed = view?.completed_credits ?? profile.completed_credits ?? 0;
      const programName = program?.program_name ?? view?.program_name ?? "Study program";

      setData({
        student_id: profile.id,
        student_name: profile.full_name,
        full_name: profile.full_name,
        student_number: profile.student_number,
        program_name: programName,
        program_code: programName.toUpperCase().replace(/\s+/g, "-"),
        faculty: program?.faculty ?? "",
        university: program?.university ?? "",
        curriculum_year: program?.curriculum_year ?? view?.curriculum_year ?? null,
        current_semester: view?.current_semester ?? profile.current_semester ?? 1,
        completed_credits: completed,
        target_graduation: profile.target_graduation,
        minimum_graduation_credit: minimum,
        // Sisa SKS selalu dihitung dari target kelulusan kurikulum yang dipilih,
        // bukan dari view yang memakai kolom target_graduation profil.
        remaining_credits: Math.max(minimum - completed, 0),
        graduation_percentage: Math.min(Math.round((completed / minimum) * 100), 100),
        completed_courses: view?.completed_courses ?? 0,
        ongoing_courses: view?.ongoing_courses ?? 0,
        planned_courses: view?.planned_courses ?? 0,
        planned_sks: view?.planned_sks ?? 0,
        bookmarked_courses: view?.bookmarked_courses ?? 0,
      });
    } catch {
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { dashboard: data, loading, refresh };
}

/* ------------------------------- curriculum ------------------------------- */

/** Curriculum of the student's program with prerequisite status per course. */
export function useCurriculum() {
  const [rows, setRows] = useState<RecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const userId = await currentUserId();
      const profile = await loadProfile();
      if (!userId || !profile?.curriculum_version_id) {
        setRows([]);
        setLoading(false);
        return;
      }

      const [{ data: courses }, { data: mine }] = await Promise.all([
        supabase
          .from("courses_master")
          .select("*")
          .eq("curriculum_version_id", profile.curriculum_version_id)
          .order("recommended_semester", { ascending: true })
          .order("course_code", { ascending: true }),
        supabase.from("student_courses").select("course_id, status, course_status").eq("student_id", userId),
      ]);

      const list = courses ?? [];
      const codeById = new Map(list.map((course) => [course.id, course.course_code ?? ""]));
      const taken = new Map((mine ?? []).map((row) => [row.course_id, row]));
      const completedIds = new Set(
        (mine ?? []).filter((row) => completedStatus(row.status, row.course_status)).map((row) => row.course_id),
      );

      setRows(
        list.map((course) => {
          const prerequisites = course.prerequisite_course_id
            ? [codeById.get(course.prerequisite_course_id) ?? "Prerequisite"]
            : course.prerequisite_text
              ? [course.prerequisite_text]
              : [];
          const met = !course.prerequisite_course_id || completedIds.has(course.prerequisite_course_id);
          return {
            course_id: course.id,
            curriculum_course_id: course.id,
            code: course.course_code ?? "",
            name: course.course_name ?? course.course_code ?? "",
            sks: course.credits ?? 0,
            category: course.course_type ?? course.category ?? null,
            course_group: course.course_group ?? null,
            recommended_semester: course.recommended_semester ?? null,
            prerequisites,
            prerequisites_met: met,
            already_taken: taken.has(course.id),
            already_completed: completedIds.has(course.id),
            note: course.description ?? null,
          } satisfies RecommendationRow;
        }),
      );
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}

/* ---------------------------- student's courses --------------------------- */

const DAY_WORDS: Record<string, string> = {
  senin: "Monday", selasa: "Tuesday", rabu: "Wednesday", kamis: "Thursday", jumat: "Friday", "jum'at": "Friday", sabtu: "Saturday", minggu: "Sunday", ahad: "Sunday",
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};

/** Reads a free-text class schedule such as "Senin 08:00-10:30" into parts. */
export function parseSchedule(schedule: string): { day: string; start: string; end: string } {
  const text = (schedule ?? "").trim();
  if (!text) return { day: "", start: "", end: "" };
  let day = "";
  for (const word of text.toLowerCase().split(/[^a-z']+/)) {
    const match = DAY_WORDS[word];
    if (match) {
      day = match;
      break;
    }
  }
  const times = text.match(/\d{1,2}[:.]\d{2}/g) ?? [];
  const pad = (value: string | undefined) => (value ? value.replace(".", ":").padStart(5, "0") : "");
  return { day, start: pad(times[0]), end: pad(times[1]) };
}

/** Courses the student is taking, with their resource, file, and note counts. */

export function useStudentCourses() {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const userId = await currentUserId();
      if (!userId) {
        setCourses([]);
        setLoading(false);
        return;
      }
      const { data: rows } = await supabase
        .from("student_courses")
        .select(
          "id, course_id, status, course_status, grade, semester_taken, taken_semester, class_section, lecturer, schedule, room, courses_master:course_id (course_code, course_name, credits)",
        )
        .eq("student_id", userId)
        .order("created_at", { ascending: true });

      const list = rows ?? [];
      const ids = list.map((row) => row.course_id);
      const counts = await courseCounts(ids);

      setCourses(
        list.map((row) => {
          const master = row.courses_master as { course_code: string | null; course_name: string | null; credits: number | null } | null;
          const schedule = row.schedule ?? "";
          const parsed = parseSchedule(schedule);
          const count = counts.get(row.course_id) ?? { resources: 0, files: 0, notes: 0 };
          return {
            id: row.id,
            courseId: row.course_id,
            code: master?.course_code ?? "",
            name: master?.course_name ?? master?.course_code ?? "",
            sks: master?.credits ?? 0,
            status: row.course_status ?? row.status ?? "planned",
            lecturer: row.lecturer ?? "",
            section: row.class_section ?? "",
            day: parsed.day,
            start: parsed.start,
            end: parsed.end,
            room: row.room ?? "",
            schedule,
            semester: row.taken_semester ?? row.semester_taken ?? null,
            grade: row.grade ?? null,

            resourceCount: count.resources,
            fileCount: count.files,
            noteCount: count.notes,
            taskCount: 0,
          } satisfies StudentCourse;
        }),
      );
    } catch {
      setCourses([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { courses, loading, refresh };
}

async function courseCounts(courseIds: string[]) {
  const counts = new Map<string, { resources: number; files: number; notes: number }>();
  if (!courseIds.length) return counts;
  const [{ data: resources }, { data: files }, { data: notes }] = await Promise.all([
    supabase.from("course_resources").select("course_id").in("course_id", courseIds),
    supabase.from("course_files").select("course_id").in("course_id", courseIds),
    supabase.from("course_notes").select("course_id").in("course_id", courseIds),
  ]);
  const bump = (id: string, key: "resources" | "files" | "notes") => {
    const entry = counts.get(id) ?? { resources: 0, files: 0, notes: 0 };
    entry[key] += 1;
    counts.set(id, entry);
  };
  for (const row of resources ?? []) bump(row.course_id, "resources");
  for (const row of files ?? []) bump(row.course_id, "files");
  for (const row of notes ?? []) bump(row.course_id, "notes");
  return counts;
}

/* --------------------------------- library -------------------------------- */

/** Course materials of the student's curriculum: links, files, and notes. */
export function useLibrary() {
  const [courses, setCourses] = useState<LibraryCourse[]>([]);
  const [resources, setResources] = useState<LibraryEntry[]>([]);
  const [files, setFiles] = useState<LibraryEntry[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const userId = await currentUserId();
      if (!userId) {
        setCourses([]);
        setLoading(false);
        return;
      }
      const { data: mine } = await supabase
        .from("student_courses")
        .select("course_id, taken_semester, semester_taken, courses_master:course_id (course_code, course_name, credits, recommended_semester)")
        .eq("student_id", userId);

      const list = mine ?? [];
      const ids = list.map((row) => row.course_id);
      if (!ids.length) {
        setCourses([]);
        setResources([]);
        setFiles([]);
        setNotes([]);
        setLoading(false);
        return;
      }

      const [{ data: resourceRows }, { data: fileRows }, { data: noteRows }] = await Promise.all([
        supabase.from("course_resources").select("*").in("course_id", ids).order("created_at", { ascending: false }),
        supabase.from("course_files").select("*").in("course_id", ids).order("created_at", { ascending: false }),
        supabase.from("course_notes").select("*").in("course_id", ids).order("created_at", { ascending: false }),
      ]);

      const codeOf = new Map<string, string>();
      const libraryCourses: LibraryCourse[] = list.map((row) => {
        const master = row.courses_master as {
          course_code: string | null;
          course_name: string | null;
          credits: number | null;
          recommended_semester: number | null;
        } | null;
        codeOf.set(row.course_id, master?.course_code ?? "");
        return {
          courseId: row.course_id,
          code: master?.course_code ?? "",
          name: master?.course_name ?? master?.course_code ?? "",
          sks: master?.credits ?? 0,
          semester: row.taken_semester ?? row.semester_taken ?? master?.recommended_semester ?? null,
          resourceCount: (resourceRows ?? []).filter((item) => item.course_id === row.course_id).length,
          fileCount: (fileRows ?? []).filter((item) => item.course_id === row.course_id).length,
          noteCount: (noteRows ?? []).filter((item) => item.course_id === row.course_id).length,
        };
      });

      setCourses(libraryCourses);
      setResources(
        (resourceRows ?? []).map((row) => ({
          id: row.id,
          kind: row.resource_type,
          title: row.title,
          description: row.description ?? "",
          url: row.external_url ?? row.file_url ?? "",
          courseId: row.course_id,
          courseCode: codeOf.get(row.course_id) ?? "",
          createdAt: row.created_at ?? "",
        })),
      );
      setFiles(
        (fileRows ?? []).map((row) => ({
          id: row.id,
          kind: row.file_type,
          title: row.file_name,
          description: "",
          url: row.storage_path,
          courseId: row.course_id,
          courseCode: codeOf.get(row.course_id) ?? "",
          createdAt: row.created_at ?? "",
        })),
      );
      setNotes(
        (noteRows ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          topic: row.note_type ?? "",
          body: row.content ?? "",
          attachment: row.file_url ?? "",
          courseId: row.course_id,
          courseCode: codeOf.get(row.course_id) ?? "",
        })),
      );
    } catch {
      setCourses([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { courses, resources, files, notes, loading, refresh };
}

/* ---------------------------------- roles --------------------------------- */

/** True when the signed-in account carries the admin role. */
export function useIsAdmin(userId: string | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(Boolean(data));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return isAdmin;
}

/* --------------------------------- planner -------------------------------- */

/** Adds the planned courses of a KRS plan to the student's record. */
export async function savePlannedCourses(
  userId: string,
  picks: { courseId: string; code: string; name: string; sks: number }[],
  plannedSemester: number,
): Promise<{ saved: number }> {
  if (!picks.length) return { saved: 0 };
  const { data: existing } = await supabase.from("student_courses").select("course_id").eq("student_id", userId);
  const taken = new Set((existing ?? []).map((row) => row.course_id));
  const fresh = picks.filter((pick) => pick.courseId && !taken.has(pick.courseId));
  if (!fresh.length) return { saved: 0 };

  const { error } = await supabase.from("student_courses").insert(
    fresh.map((pick) => ({
      student_id: userId,
      course_id: pick.courseId,
      status: "planned",
      course_status: "PLANNED",
      taken_semester: plannedSemester,
      semester_taken: plannedSemester,
    })),
  );
  if (error) throw error;

  await supabase.from("student_krs_plan").insert(
    fresh.map((pick) => ({ student_id: userId, course_id: pick.courseId, planned_semester: plannedSemester })),
  );

  return { saved: fresh.length };
}

/* --------------------------------- setup ---------------------------------- */

const plannedStatus = (status: string | null | undefined, courseStatus: string | null | undefined) =>
  (courseStatus ?? "").toUpperCase() === "PLANNED" || (status ?? "").toLowerCase() === "planned";

/**
 * Mirrors the academic setup into the student's Supabase profile and record.
 * Existing rows are reconciled, not wiped: courses the student added are
 * inserted, courses removed from the setup are deleted, unchanged courses stay
 * as they are, and duplicates of the same course are cleaned up.
 */
export async function syncProfileFromSetup(setup: {
  name: string;
  programId?: string | undefined;
  entryYear: number;
  currentSemester: number;
  completed: string[];
  active?: { code: string; section: string; lecturer: string; day: string; start: string; end: string; room: string }[];
}): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  let curriculumVersionId: string | null = null;
  let minimumCredit: number | null = null;
  if (setup.programId) {
    const [{ data: version }, { data: program }] = await Promise.all([
      supabase
        .from("curriculum_versions")
        .select("id")
        .eq("program_id", setup.programId)
        .order("curriculum_year", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("programs").select("minimum_graduation_credit").eq("id", setup.programId).maybeSingle(),
    ]);
    curriculumVersionId = version?.id ?? null;
    minimumCredit = program?.minimum_graduation_credit ?? null;
  }

  const clean = (codes: string[]) => [...new Set(codes.map((code) => code.trim()).filter(Boolean))];
  const completedCodes = clean(setup.completed);
  // A course can never be completed and ongoing at the same time.
  const activeByCode = new Map((setup.active ?? []).map((course) => [course.code.trim(), course]));
  const activeCodes = clean([...activeByCode.keys()]).filter((code) => !completedCodes.includes(code));
  const wanted = [...completedCodes, ...activeCodes];

  let master: { id: string; credits: number | null; course_code: string | null }[] = [];
  if (curriculumVersionId && wanted.length) {
    const { data } = await supabase
      .from("courses_master")
      .select("id, credits, course_code")
      .eq("curriculum_version_id", curriculumVersionId)
      .in("course_code", wanted);
    master = data ?? [];
  }
  const byCode = new Map(master.map((course) => [course.course_code ?? "", course]));
  const completedCredits = completedCodes.reduce((total, code) => total + (byCode.get(code)?.credits ?? 0), 0);

  await saveStudentProfile({
    fullName: setup.name,
    programId: setup.programId ?? null,
    curriculumVersionId,
    entryYear: setup.entryYear,
    currentSemester: setup.currentSemester,
    completedCredits,
    targetGraduation: minimumCredit,
  });

  // Desired state of the student's course record, keyed by valid course id.
  const desired = new Map<string, "completed" | "ongoing">();
  for (const code of completedCodes) {
    const course = byCode.get(code);
    if (course) desired.set(course.id, "completed");
  }
  for (const code of activeCodes) {
    const course = byCode.get(code);
    if (course && !desired.has(course.id)) desired.set(course.id, "ongoing");
  }

  // Only courses of the selected curriculum may be removed by this sync.
  let scope = new Set<string>();
  if (curriculumVersionId) {
    const { data } = await supabase.from("courses_master").select("id").eq("curriculum_version_id", curriculumVersionId);
    scope = new Set((data ?? []).map((row) => row.id));
  }

  const { data: existingRows } = await supabase
    .from("student_courses")
    .select("id, course_id, status, course_status")
    .eq("student_id", userId);
  const rows = existingRows ?? [];

  const firstByCourse = new Map<string, (typeof rows)[number]>();
  const duplicates: string[] = [];
  for (const row of rows) {
    if (firstByCourse.has(row.course_id)) duplicates.push(row.id);
    else firstByCourse.set(row.course_id, row);
  }
  if (duplicates.length) await supabase.from("student_courses").delete().in("id", duplicates);

  const inserts: {
    student_id: string;
    course_id: string;
    status: string;
    course_status: string;
    taken_semester?: number;
    semester_taken?: number;
    class_section?: string;
    lecturer?: string;
    schedule?: string;
    room?: string;
  }[] = [];
  for (const [courseId, kind] of desired) {
    const status = kind === "completed" ? "completed" : "ongoing";
    const courseStatus = kind === "completed" ? "COMPLETED" : "ONGOING";
    const courseCode = master.find((course) => course.id === courseId)?.course_code ?? "";
    const config = kind === "ongoing" ? activeByCode.get(courseCode) : undefined;
    const classDetails = config ? {
      class_section: config.section,
      lecturer: config.lecturer.trim() || null,
      schedule: `${config.day} ${config.start}-${config.end}`,
      room: config.room.trim() || null,
    } : {};
    const match = firstByCourse.get(courseId);
    if (!match) {
      inserts.push({
        student_id: userId,
        course_id: courseId,
        status,
        course_status: courseStatus,
        ...classDetails,
        ...(kind === "ongoing" ? { taken_semester: setup.currentSemester, semester_taken: setup.currentSemester } : {}),
      });
      continue;
    }
    await supabase
      .from("student_courses")
      .update({ status, course_status: courseStatus, ...classDetails })
      .eq("id", match.id);
  }
  if (inserts.length) await supabase.from("student_courses").insert(inserts);

  const removable = [...firstByCourse.values()].filter(
    (row) => !desired.has(row.course_id) && scope.has(row.course_id) && !plannedStatus(row.status, row.course_status),
  );
  if (removable.length) await supabase.from("student_courses").delete().in("id", removable.map((row) => row.id));
}

/* --------------------- rehydrate setup from the account -------------------- */

type RemoteSetup = {
  name: string;
  program: string;
  programId?: string;
  faculty: string;
  university: string;
  entryYear: number;
  currentSemester: number;
  completed: string[];
  active: {
    code: string;
    section: string;
    lecturer: string;
    assistant: string;
    day: string;
    start: string;
    end: string;
    room: string;
  }[];
  completedAt: string;
};

/**
 * Rebuilds the academic setup from the student's saved profile and courses so
 * a signed-in student never has to redo onboarding on a new device or browser.
 */
export async function fetchRemoteSetup(): Promise<RemoteSetup | null> {
  const profile = await loadProfile().catch(() => null);
  if (!profile) return null;

  const { data: rows } = await supabase
    .from("student_courses")
    .select(
      "status, course_status, class_section, lecturer, schedule, room, courses_master:course_id (course_code)",
    )
    .eq("student_id", profile.id);

  const completed: string[] = [];
  const active: RemoteSetup["active"] = [];
  for (const row of rows ?? []) {
    const master = row.courses_master as { course_code: string | null } | null;
    const code = master?.course_code ?? "";
    if (!code) continue;
    if (completedStatus(row.status, row.course_status)) {
      completed.push(code);
      continue;
    }
    const parsed = parseSchedule(row.schedule ?? "");
    active.push({
      code,
      section: row.class_section || "A",
      lecturer: row.lecturer ?? "",
      assistant: "",
      day: parsed.day || "Monday",
      start: parsed.start || "08:00",
      end: parsed.end || "09:40",
      room: row.room ?? "",
    });
  }

  return {
    name: profile.full_name || "Mahasiswa",
    program: profile.programs?.program_name ?? "",
    ...(profile.program_id ? { programId: profile.program_id } : {}),
    faculty: profile.programs?.faculty ?? "",
    university: profile.programs?.university ?? "",
    entryYear: profile.entry_year ?? new Date().getFullYear(),
    currentSemester: profile.current_semester ?? 1,
    completed,
    active,
    completedAt: new Date().toISOString(),
  };
}
