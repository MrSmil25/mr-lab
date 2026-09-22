import type { StudentSetup } from "@/data/setup";

export type ExportCourse = { code: string; title: string; sks: number; section?: string; lecturer: string; assistant: string; day: string; time: string; room: string };
export type ExportTask = { title: string; course: string; due: string; priority: string; status: string; done: boolean };
export type ExportNote = { title: string; topic: string; course: string; body: string };
export type ExportResource = { title: string; type: string; course: string; detail: string };
export type ExportProgress = { currentSemester: number; completedSks: number; remainingSks: number; totalSks: number; percent: number; completedCourses: string[] };

export type ExportSection = "courses" | "tasks" | "notes" | "resources" | "progress";

export type AcademicExport = {
  courses: ExportCourse[];
  tasks: ExportTask[];
  notes: ExportNote[];
  resources: ExportResource[];
  progress: ExportProgress;
};

export function buildExportPayload(setup: StudentSetup | null, data: AcademicExport, sections: ExportSection[]) {
  const payload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    student: setup
      ? { name: setup.name, program: setup.program, faculty: setup.faculty, university: setup.university, entryYear: setup.entryYear, currentSemester: setup.currentSemester }
      : null,
  };
  for (const section of sections) payload[section] = data[section];
  return payload;
}

function escapeCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");
}

export function buildCsvBundle(data: AcademicExport, sections: ExportSection[]) {
  const blocks: string[] = [];
  for (const section of sections) {
    const value = data[section];
    const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [{ ...(value as ExportProgress), completedCourses: (value as ExportProgress).completedCourses.join(" | ") }];
    blocks.push(`# ${section.toUpperCase()}\n${toCsv(rows) || "(empty)"}`);
  }
  return blocks.join("\n\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportFilename(setup: StudentSetup | null, extension: string) {
  const name = (setup?.name || "academic").trim().toLowerCase().replace(/\s+/g, "-");
  const stamp = new Date().toISOString().slice(0, 10);
  return `${name}-academic-export-${stamp}.${extension}`;
}
