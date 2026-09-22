import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Academic identity of the signed-in student: profile, program, curriculum
 * version, graduation requirement, course counts, and semester history.
 * Every read is scoped to the authenticated user id, so a student can only
 * ever see their own record.
 */

export type SemesterHistoryEntry = {
  semester: number;
  completedSks: number;
  completedCourses: number;
  ongoingCourses: number;
  plannedCourses: number;
};

export type AcademicIdentity = {
  fullName: string;
  studentNumber: string | null;
  university: string | null;
  faculty: string | null;
  programName: string | null;
  curriculumYear: number | null;
  entryYear: number | null;
  currentSemester: number | null;
  completedCredits: number;
  minimumGraduationCredit: number;
  minimumElectiveCredit: number | null;
  remainingCredits: number;
  graduationPercentage: number;
  completedCourses: number;
  ongoingCourses: number;
  plannedCourses: number;
  history: SemesterHistoryEntry[];
  complete: boolean;
};

const ONGOING = ["ongoing", "in_progress", "active", "taking"];

function statusOf(status: string | null, courseStatus: string | null): "completed" | "ongoing" | "planned" {
  const value = (courseStatus ?? status ?? "").toLowerCase();
  if (value === "completed" || value === "passed") return "completed";
  if (ONGOING.includes(value)) return "ongoing";
  return "planned";
}

async function loadIdentity(): Promise<AcademicIdentity | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("student_profile")
    .select(
      "id, full_name, student_number, current_semester, entry_year, target_graduation, completed_credits, program_id, curriculum_version_id, programs:program_id (university, faculty, program_name, curriculum_year, minimum_graduation_credit)",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const program = (profile.programs ?? null) as {
    university: string | null;
    faculty: string | null;
    program_name: string | null;
    curriculum_year: number | null;
    minimum_graduation_credit: number | null;
  } | null;

  const [{ data: version }, { data: enrolled }] = await Promise.all([
    profile.curriculum_version_id
      ? supabase.from("curriculum_versions").select("curriculum_year").eq("id", profile.curriculum_version_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("student_courses")
      .select("status, course_status, semester_taken, taken_semester, courses_master:course_id (credits, recommended_semester)")
      .eq("student_id", userId),
  ]);

  const curriculumYear = version?.curriculum_year ?? program?.curriculum_year ?? null;

  let requirement = program?.minimum_graduation_credit ?? null;
  let elective: number | null = null;
  if (profile.program_id) {
    const query = supabase
      .from("graduation_requirements")
      .select("minimum_graduation_credit, minimum_elective_credit, curriculum_year")
      .eq("program_id", profile.program_id);
    const { data: requirements } = await query;
    const match =
      (requirements ?? []).find((row) => row.curriculum_year === curriculumYear) ?? (requirements ?? [])[0] ?? null;
    if (match) {
      requirement = match.minimum_graduation_credit ?? requirement;
      elective = match.minimum_elective_credit ?? null;
    }
  }

  const minimum = requirement ?? profile.target_graduation ?? 144;
  const rows = enrolled ?? [];

  const buckets = new Map<number, SemesterHistoryEntry>();
  let completedCourses = 0;
  let ongoingCourses = 0;
  let plannedCourses = 0;
  let earnedFromCourses = 0;

  for (const row of rows) {
    const master = row.courses_master as { credits: number | null; recommended_semester: number | null } | null;
    const kind = statusOf(row.status, row.course_status);
    const semester = row.taken_semester ?? row.semester_taken ?? master?.recommended_semester ?? null;
    const credits = master?.credits ?? 0;

    if (kind === "completed") {
      completedCourses += 1;
      earnedFromCourses += credits;
    } else if (kind === "ongoing") ongoingCourses += 1;
    else plannedCourses += 1;

    if (semester != null) {
      const entry =
        buckets.get(semester) ?? { semester, completedSks: 0, completedCourses: 0, ongoingCourses: 0, plannedCourses: 0 };
      if (kind === "completed") {
        entry.completedSks += credits;
        entry.completedCourses += 1;
      } else if (kind === "ongoing") entry.ongoingCourses += 1;
      else entry.plannedCourses += 1;
      buckets.set(semester, entry);
    }
  }

  const completedCredits = profile.completed_credits ?? earnedFromCourses;
  const remaining = Math.max(minimum - completedCredits, 0);

  return {
    fullName: profile.full_name,
    studentNumber: profile.student_number,
    university: program?.university ?? null,
    faculty: program?.faculty ?? null,
    programName: program?.program_name ?? null,
    curriculumYear,
    entryYear: profile.entry_year,
    currentSemester: profile.current_semester,
    completedCredits,
    minimumGraduationCredit: minimum,
    minimumElectiveCredit: elective,
    remainingCredits: remaining,
    graduationPercentage: minimum > 0 ? Math.min(Math.round((completedCredits / minimum) * 100), 100) : 0,
    completedCourses,
    ongoingCourses,
    plannedCourses,
    history: [...buckets.values()].sort((a, b) => a.semester - b.semester),
    complete: Boolean(profile.full_name && profile.program_id && profile.current_semester && profile.student_number),
  };
}

/** Loads the signed-in student's academic identity dashboard data. */
export function useAcademicIdentity() {
  const [identity, setIdentity] = useState<AcademicIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIdentity(await loadIdentity().catch(() => null));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { identity, loading, refresh };
}
