import { ArrowLeft, BookOpen, Check, Download, FileSpreadsheet, FileJson, GraduationCap, Pencil, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { curriculum, curriculumStructure, TOTAL_SKS } from "@/data/curriculum";
import { useAcademicIdentity, type SemesterHistoryEntry } from "@/data/identity";
import type { StudentSetup } from "@/data/setup";
import { buildCsvBundle, buildExportPayload, downloadFile, exportFilename, type AcademicExport, type ExportSection } from "@/lib/export-data";

const exportSections: { id: ExportSection; label: string; description: string }[] = [
  { id: "courses", label: "Courses", description: "Active classes, lecturers, schedule, and room." },
  { id: "tasks", label: "Tasks", description: "Assignments with due date, priority, and status." },
  { id: "notes", label: "Notes", description: "Study notes grouped by course and topic." },
  { id: "resources", label: "Resources", description: "Materials, readings, and saved links." },
  { id: "progress", label: "Academic progress", description: "Credits completed, remaining, and percentage." },
];

export function SettingsView({
  setup, data, progress, onBack, onEditSetup,
}: {
  setup: StudentSetup | null;
  data: AcademicExport;
  progress: { completedSks: number; remainingSks: number; totalSks: number; percent: number };
  onBack: () => void;
  onEditSetup: () => void;
}) {
  const { identity, loading: identityLoading } = useAcademicIdentity();
  const [selected, setSelected] = useState<ExportSection[]>(exportSections.map((section) => section.id));
  const [message, setMessage] = useState("");

  const toggle = (id: ExportSection) =>
    setSelected((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));

  const ordered = exportSections.map((section) => section.id).filter((id) => selected.includes(id));

  const exportJson = () => {
    if (!ordered.length) return;
    downloadFile(exportFilename(setup, "json"), JSON.stringify(buildExportPayload(setup, data, ordered), null, 2), "application/json");
    setMessage("JSON export downloaded.");
    setTimeout(() => setMessage(""), 2500);
  };
  const exportCsv = () => {
    if (!ordered.length) return;
    downloadFile(exportFilename(setup, "csv"), buildCsvBundle(data, ordered), "text/csv");
    setMessage("CSV export downloaded.");
    setTimeout(() => setMessage(""), 2500);
  };

  const semesterCount = new Set(curriculum.map((course) => course.semester)).size;

  return (
    <div className="page-enter">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2"><ArrowLeft /> Back</Button>

      <header className="mb-6 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground md:p-8">
        <p className="text-xs font-semibold opacity-80">WORKSPACE SETTINGS</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">{setup?.name ?? "Your"} academic workspace</h1>
        <p className="mt-2 text-sm opacity-85">{setup ? `${setup.program} · ${setup.faculty} · ${setup.university}` : "Complete your academic setup to personalise this workspace."}</p>
      </header>

      <Tabs defaultValue="profile">
        <TabsList className="mb-5 flex h-auto w-full justify-start overflow-x-auto bg-transparent p-0">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="setup">Academic setup</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="export">Export data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-4">
            <section className="academic-card p-5 md:p-6">
              <div className="mb-5 flex items-center gap-2"><UserRound className="size-5 text-academic" /><h2 className="text-base font-bold">Student profile</h2></div>
              {identityLoading ? (
                <p className="text-sm text-muted-foreground">Loading your academic identity…</p>
              ) : (
                <>
                  {!identity?.complete && (
                    <div className="mb-4 rounded-xl bg-warning/10 p-3.5">
                      <p className="text-sm font-semibold text-academic">Complete your academic profile</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Add your student number, program, and current semester so this dashboard reflects your full academic identity.</p>
                      <Button variant="academic" size="sm" className="mt-3" onClick={onEditSetup}><Pencil /> Complete profile</Button>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Row label="Full name" value={identity?.fullName ?? setup?.name ?? "—"} />
                    <Row label="Student ID / NIM" value={identity?.studentNumber ?? "—"} />
                    <Row label="University" value={identity?.university ?? setup?.university ?? "—"} />
                    <Row label="Faculty" value={identity?.faculty ?? setup?.faculty ?? "—"} />
                    <Row label="Study program" value={identity?.programName ?? setup?.program ?? "—"} />
                    <Row label="Curriculum year" value={identity?.curriculumYear ? String(identity.curriculumYear) : "—"} />
                    <Row label="Entry year" value={identity?.entryYear ? `Angkatan ${identity.entryYear}` : setup ? `Angkatan ${setup.entryYear}` : "—"} />
                    <Row label="Current semester" value={identity?.currentSemester ? `Semester ${identity.currentSemester}` : setup ? `Semester ${setup.currentSemester}` : "—"} />
                  </div>
                </>
              )}
            </section>

            <section className="academic-card p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2"><BookOpen className="size-5 text-academic" /><h2 className="text-base font-bold">Academic summary</h2></div>
              <p className="font-display text-3xl font-bold">{identity?.graduationPercentage ?? progress.percent}%</p>
              <Progress value={identity?.graduationPercentage ?? progress.percent} className="mt-3 h-2" />
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Mini label="Completed" value={`${identity?.completedCredits ?? progress.completedSks} SKS`} />
                <Mini label="Target graduation" value={`${identity?.minimumGraduationCredit ?? progress.totalSks} SKS`} />
                <Mini label="Remaining" value={`${identity?.remainingCredits ?? progress.remainingSks} SKS`} />
                <Mini label="Elective minimum" value={identity?.minimumElectiveCredit != null ? `${identity.minimumElectiveCredit} SKS` : "—"} />
              </div>
            </section>

            <section className="academic-card p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2"><GraduationCap className="size-5 text-academic" /><h2 className="text-base font-bold">Course summary</h2></div>
              <div className="grid grid-cols-3 gap-2">
                <Mini label="Completed" value={String(identity?.completedCourses ?? 0)} />
                <Mini label="Ongoing" value={String(identity?.ongoingCourses ?? 0)} />
                <Mini label="Planned" value={String(identity?.plannedCourses ?? 0)} />
              </div>
            </section>

            <section className="academic-card p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2"><GraduationCap className="size-5 text-academic" /><h2 className="text-base font-bold">Academic journey</h2></div>
              {identity?.history.length ? (
                <div className="space-y-2">
                  {identity.history.map((entry: SemesterHistoryEntry) => {
                    const current = entry.semester === identity.currentSemester;
                    return (
                      <div key={entry.semester} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3.5 ${current ? "bg-accent" : "bg-muted"}`}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">Semester {entry.semester}{current && <span className="ml-2 rounded-full bg-academic px-2 py-0.5 text-[10px] font-bold text-academic-foreground">Current</span>}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.completedCourses} completed · {entry.ongoingCourses} ongoing · {entry.plannedCourses} planned</p>
                        </div>
                        <span className="text-xs font-bold text-academic">{entry.completedSks} SKS</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No semester history yet. Your journey appears as you record courses per semester.</p>
              )}
            </section>

            <section className="academic-card p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2"><UserRound className="size-5 text-academic" /><h2 className="text-base font-bold">Personalization</h2></div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-muted p-3.5"><p className="text-xs font-semibold uppercase text-muted-foreground">Academic preferences</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Not set yet</p></div>
                <div className="rounded-xl bg-muted p-3.5"><p className="text-xs font-semibold uppercase text-muted-foreground">Learning preferences</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Not set yet</p></div>
                <div className="rounded-xl bg-muted p-3.5"><p className="text-xs font-semibold uppercase text-muted-foreground">Favorite courses</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Not set yet</p></div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="setup">
          <div className="grid gap-4 md:grid-cols-2">
            <section className="academic-card p-5">
              <div className="mb-4 flex items-center gap-2"><GraduationCap className="size-5 text-academic" /><h2 className="text-base font-bold">Academic setup</h2></div>
              <p className="text-sm leading-6 text-muted-foreground">Change your program, semester, completed courses, class sections, or lecturers by running the setup again. Your current data stays until you finish.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Active courses" value={String(data.courses.length)} />
                <Mini label="Completed courses" value={String(setup?.completed.length ?? 0)} />
                <Mini label="Extra courses" value={String(setup?.customCourses?.length ?? 0)} />
              </div>
              <Button variant="academic" className="mt-5" onClick={onEditSetup}><Pencil /> Edit academic setup</Button>
            </section>

            <section className="academic-card p-5">
              <div className="mb-4 flex items-center gap-2"><BookOpen className="size-5 text-academic" /><h2 className="text-base font-bold">Degree progress</h2></div>
              <p className="font-display text-3xl font-bold">{progress.percent}%</p>
              <Progress value={progress.percent} className="mt-3 h-2" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Mini label="Completed" value={`${progress.completedSks} SKS`} />
                <Mini label="Remaining" value={`${progress.remainingSks} SKS`} />
                <Mini label="Required" value={`${progress.totalSks} SKS`} />
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="curriculum">
          <section className="academic-card p-5 md:p-6">
            <div className="mb-5 flex items-center gap-2"><GraduationCap className="size-5 text-academic" /><h2 className="text-base font-bold">Curriculum information</h2></div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Mini label="Program" value={setup?.program ?? "—"} />
              <Mini label="Curriculum year" value="2024" />
              <Mini label="Graduation requirement" value={`${TOTAL_SKS} SKS`} />
              <Mini label="Structure" value={`${semesterCount} semesters · ${curriculum.length} courses`} />
            </div>
            <div className="mt-5 space-y-2">
              {curriculumStructure.map((group) => (
                <div key={group.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted p-3.5">
                  <span className="truncate text-sm font-semibold">{group.label}</span>
                  <span className="text-xs font-bold text-academic">{group.sks} SKS</span>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="export">
          <section className="academic-card p-5 md:p-6">
            <div className="mb-2 flex items-center gap-2"><Download className="size-5 text-academic" /><h2 className="text-base font-bold">Export your academic data</h2></div>
            <p className="text-sm text-muted-foreground">Pick what to include, then download a copy you can archive or open in a spreadsheet.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {exportSections.map((section) => {
                const active = selected.includes(section.id);
                return (
                  <button key={section.id} onClick={() => toggle(section.id)} className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${active ? "border-academic bg-accent" : "border-border bg-muted"}`}>
                    <span className={`mt-0.5 grid size-5 place-items-center rounded-md border ${active ? "border-academic bg-academic text-academic-foreground" : "border-input bg-background"}`}>{active && <Check className="size-3.5" />}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{section.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{section.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button variant="academic" onClick={exportJson} disabled={!ordered.length}><FileJson /> Download JSON</Button>
              <Button variant="outline" onClick={exportCsv} disabled={!ordered.length}><FileSpreadsheet /> Download CSV</Button>
              {message && <span className="rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">{message}</span>}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted p-3.5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-muted p-3"><p className="truncate text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-bold">{value}</p></div>;
}
