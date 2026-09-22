/**
 * Perhitungan IPK dan SKS dari mata kuliah milik mahasiswa di Supabase.
 * Semua angka berasal dari nilai yang benar-benar tersimpan; tidak ada contoh.
 */

export type GradedCourse = { sks: number; grade: string | null; status: string };

const GRADE_POINTS: Record<string, number> = {
  A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, D: 1, E: 0,
};

export function gradePoint(grade: string | null | undefined): number | null {
  if (!grade) return null;
  const key = grade.trim().toUpperCase();
  return key in GRADE_POINTS ? GRADE_POINTS[key]! : null;
}

export const isCompleted = (status: string | null | undefined) =>
  ["completed", "passed", "lulus"].includes((status ?? "").toLowerCase());

/** IPK, SKS lulus, dan SKS berjalan dari daftar mata kuliah mahasiswa. */
export function academicSummary(courses: GradedCourse[]) {
  let qualityPoints = 0;
  let gradedSks = 0;
  let completedSks = 0;
  let activeSks = 0;

  for (const course of courses) {
    const sks = course.sks || 0;
    if (isCompleted(course.status)) {
      completedSks += sks;
      const point = gradePoint(course.grade);
      if (point !== null) {
        qualityPoints += point * sks;
        gradedSks += sks;
      }
    } else {
      activeSks += sks;
    }
  }

  return {
    gpa: gradedSks > 0 ? Number((qualityPoints / gradedSks).toFixed(2)) : 0,
    gradedSks,
    completedSks,
    activeSks,
  };
}
