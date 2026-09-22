import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, CircleDashed, GraduationCap, Lock, PlayCircle, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { studentProfile } from "@/data/profile";
import { TOTAL_SKS, courseByCode, curriculum, curriculumStructure, type CurriculumCourse } from "@/data/curriculum";
import { academicYearLabel } from "@/data/semester";
import type { StudentSetup } from "@/data/setup";
import { missingPrereqs, recommendNextSemester, statusLabel, statusStyle, useRoadmap, type CourseStatus, type CreditOverride } from "@/data/roadmap";
import { EmptyState } from "@/components/empty-state";

const CURRICULUM_YEAR = 2024;
const SEMESTERS = Array.from({ length: 8 }, (_, index) => index + 1);

const statusIcon: Record<CourseStatus, typeof CheckCircle2> = {
  completed: CheckCircle2,
  current: PlayCircle,
  planned: Target,
  upcoming: CircleDashed,
  locked: Lock,
};

function programLine(setup: StudentSetup | null) {
  const program = setup?.program ?? studentProfile.program;
  const faculty = setup?.faculty ?? studentProfile.faculty;
  const university = setup?.university ?? studentProfile.university;
  return {
    program,
    faculty,
    university,
    short: `${program} ${faculty.replace("Fakultas Ekonomi dan Bisnis", "FEB")} ${university.replace("Universitas Indonesia", "UI")}`,
  };
}

export function JourneyCard({ onOpen, setup = null, credits }: { onOpen: () => void; setup?: StudentSetup | null; credits?: CreditOverride }) {
  const { statuses, tracker } = useRoadmap(setup, credits);
  const info = programLine(setup);
  const semester = setup?.currentSemester ?? studentProfile.currentSemester;
  const completedCourses = curriculum.filter((course) => statuses.get(course.code) === "completed").length;
  const current = curriculum.filter((course) => statuses.get(course.code) === "current").length;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold md:text-lg">Academic roadmap</h2>
        <button onClick={onOpen} className="text-xs font-semibold text-academic">Open roadmap</button>
      </div>
      <button onClick={onOpen} className="academic-card w-full overflow-hidden text-left transition-transform hover:-translate-y-0.5">
        <div className="h-1.5 bg-academic" />
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{info.short} · Kurikulum {CURRICULUM_YEAR}</p>
            <h3 className="mt-1 text-lg font-bold">Journey to graduation</h3>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-3xl font-bold text-academic">{tracker.completedSks}</span>
              <span className="pb-1 text-sm text-muted-foreground">/ {tracker.requiredSks} SKS</span>
            </div>
            <Progress value={tracker.percent} className="mt-3 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">{tracker.percent}% dari program studi · semester {semester} dari 8 · {completedCourses} mata kuliah selesai · {current} sedang berjalan</p>
          </div>
          <span className="flex items-center gap-1 justify-self-start rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-academic md:justify-self-end">
            Lihat peta jalan <ChevronRight className="size-3.5" />
          </span>
        </div>
      </button>
    </section>
  );
}

export function AcademicJourney({ onBack, onOpenCourse, setup = null, credits }: { onBack: () => void; onOpenCourse: (course: CurriculumCourse) => void; setup?: StudentSetup | null; credits?: CreditOverride }) {
  const { statuses, tracker, custom, setStatus, addCustom, removeCustom } = useRoadmap(setup, credits);
  const info = programLine(setup);
  const currentSemester = setup?.currentSemester ?? studentProfile.currentSemester;
  const entryYear = setup?.entryYear ?? studentProfile.entryYear;

  const [openSemester, setOpenSemester] = useState(currentSemester);
  const [selected, setSelected] = useState<CurriculumCourse | null>(null);

  const timeline = useMemo(
    () =>
      SEMESTERS.map((semester) => {
        const items = curriculum.filter((course) => course.semester === semester);
        const done = items.filter((course) => statuses.get(course.code) === "completed");
        const active = items.filter((course) => statuses.get(course.code) === "current");
        const sks = items.reduce((sum, course) => sum + course.sks, 0);
        const percent = items.length ? Math.round((done.length / items.length) * 100) : 0;
        const phase: "completed" | "current" | "past" | "upcoming" =
          items.length > 0 && done.length === items.length
            ? "completed"
            : semester === currentSemester
              ? "current"
              : semester < currentSemester
                ? "past"
                : "upcoming";
        return { semester, items, done: done.length, active: active.length, sks, percent, phase, year: academicYearLabel(entryYear, semester) };
      }),
    [statuses, currentSemester, entryYear],
  );

  const detail = timeline.find((entry) => entry.semester === openSemester) ?? timeline[0]!;
  const recommended = useMemo(() => recommendNextSemester(setup, statuses), [setup, statuses]);
  const customSks = custom.reduce((sum, item) => sum + item.sks, 0);
  const unlocks = selected ? curriculum.filter((course) => course.prereq.includes(selected.code)) : [];

  const grouped = (status: CourseStatus) => detail.items.filter((course) => statuses.get(course.code) === status);

  return (
    <div className="page-enter">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2"><ArrowLeft /> Beranda</Button>

      <header className="mb-6 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground md:p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold opacity-80"><GraduationCap className="size-4" /> {info.university} · {info.faculty.replace("Fakultas Ekonomi dan Bisnis", "FEB")}</span>
          <span className="rounded-lg bg-academic-foreground/15 px-2.5 py-1 text-xs font-semibold">Kurikulum {CURRICULUM_YEAR}</span>
        </div>
        <h1 className="mt-5 text-2xl font-bold md:text-3xl">{info.short}</h1>
        <p className="mt-1 text-sm opacity-80">Syarat kelulusan · {TOTAL_SKS} SKS</p>
        <p className="mt-1 text-xs opacity-70">{setup?.name ?? studentProfile.name} · Angkatan {entryYear} · Semester {currentSemester} · {academicYearLabel(entryYear, currentSemester)}</p>

        <div className="mt-6 border-t border-academic-foreground/15 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs opacity-75">Degree progress</p>
              <p className="mt-1 font-display text-3xl font-bold">{tracker.completedSks} <span className="text-base font-semibold opacity-75">/ {tracker.requiredSks} SKS</span></p>
            </div>
            <p className="font-display text-2xl font-bold">{tracker.percent}%</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-academic-foreground/15">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${tracker.percent}%` }} />
          </div>
          <p className="mt-2 text-xs opacity-75">{tracker.currentSks} SKS sedang berjalan · {tracker.remainingSks} SKS tersisa</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold md:text-lg">Graduation tracker</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="SKS selesai" value={String(tracker.completedSks)} tone="text-success" />
          <Stat label="SKS wajib" value={String(tracker.requiredSks)} />
          <Stat label="SKS tersisa" value={String(tracker.remainingSks)} />
          <Stat label="Sedang berjalan" value={`${tracker.currentSks} SKS`} />
        </div>
        <div className="academic-card mt-3 p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Curriculum structure</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {curriculumStructure.map((group) => (
              <div key={group.label} className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">{group.label}</p>
                <p className="mt-1 font-display text-lg font-bold text-academic">{group.sks} SKS</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold md:text-lg">Semester timeline</h2>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
            {(["completed", "current", "planned", "upcoming", "locked"] as CourseStatus[]).map((status) => (
              <span key={status} className={`rounded-full px-2.5 py-1 ${statusStyle[status]}`}>{statusLabel[status]}</span>
            ))}
          </div>
        </div>

        <div className="academic-card p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((entry) => {
              const active = entry.semester === openSemester;
              return (
                <button
                  key={entry.semester}
                  onClick={() => setOpenSemester(entry.semester)}
                  className={`rounded-xl border p-4 text-left transition-colors ${active ? "border-academic bg-accent/50" : "border-border bg-surface hover:border-academic"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-lg font-bold text-academic">S{entry.semester}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${entry.phase === "completed" ? "bg-success/12 text-success" : entry.phase === "current" ? "bg-primary text-primary-foreground" : entry.phase === "past" ? "bg-accent text-academic" : "bg-muted text-muted-foreground"}`}>
                      {entry.phase === "completed" ? "Selesai" : entry.phase === "current" ? "Kamu di sini" : entry.phase === "past" ? "Sebagian selesai" : "Akan datang"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{entry.year}</p>
                  <Progress value={entry.percent} className="mt-3 h-1.5" />
                  <p className="mt-2 text-[11px] text-muted-foreground">{entry.done}/{entry.items.length} mata kuliah · {entry.sks} SKS</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-base font-bold md:text-lg">Detail semester {detail.semester}</h2>
          <p className="text-xs text-muted-foreground">{detail.year} · {detail.items.length} mata kuliah · {detail.sks} SKS</p>
        </div>

        <div className="space-y-5">
          {(["completed", "current", "planned", "upcoming", "locked"] as CourseStatus[]).map((status) => {
            const items = grouped(status);
            if (!items.length) return null;
            return (
              <div key={status}>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{statusLabel[status]} · {items.length}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((course) => (
                    <CourseCard key={course.code} course={course} status={status} statuses={statuses} selected={selected?.code === course.code} onSelect={() => setSelected(course)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-academic" />
          <h2 className="text-base font-bold md:text-lg">Rekomendasi untuk semester {currentSemester + 1}</h2>
        </div>
        {recommended.length === 0 ? (
          <div className="academic-card p-5 text-sm text-muted-foreground">Semua mata kuliah yang terbuka sudah selesai atau sedang berjalan. Rencanakan mata kuliah untuk melihatnya di sini.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((course) => (
              <div key={course.code} className="academic-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground">{course.code} · Sem {course.semester}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{course.sks} SKS</span>
                </div>
                <p className="mt-2 text-sm font-bold leading-5">{course.name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">All prerequisites met</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="yellow" onClick={() => setStatus(course.code, "planned")}>Rencanakan</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setOpenSemester(course.semester); setSelected(course); }}>Detail</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AdditionalLearning custom={custom} customSks={customSks} onAdd={addCustom} onRemove={removeCustom} />

      {selected && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-bold md:text-lg">Course detail</h2>
          <div className="academic-card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">{selected.code} · {selected.group} · Semester {selected.semester}</p>
                <h3 className="mt-1 text-lg font-bold">{selected.name}</h3>
                {selected.note && <p className="mt-1 text-xs text-muted-foreground">{selected.note}</p>}
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{selected.sks} SKS</span>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Prerequisites</p>
                {selected.prereq.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No prerequisite — this course can be taken directly.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {selected.prereq.map((code) => {
                      const prereq = courseByCode.get(code);
                      const status = statuses.get(code) ?? "upcoming";
                      return (
                        <div key={code} className="rounded-xl border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{prereq?.name ?? code}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[status]}`}>{statusLabel[status]}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">{code}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {unlocks.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Unlocks</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {unlocks.map((course) => (
                        <li key={course.code} className="flex items-center gap-2 text-muted-foreground">
                          <ChevronRight className="size-3.5 text-academic" />{course.name} <span className="text-[10px]">· Sem {course.semester}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Course status</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["completed", "current", "planned", "upcoming"] as CourseStatus[]).map((status) => {
                    const active = (statuses.get(selected.code) ?? "upcoming") === status;
                    return (
                      <button
                        key={status}
                        onClick={() => setStatus(selected.code, status)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${active ? "border-academic bg-academic text-academic-foreground" : "border-border bg-surface hover:border-academic"}`}
                      >
                        {statusLabel[status]}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Mata kuliah akan otomatis terkunci sampai semua prasyarat selesai.</p>

                <div className="mt-5 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">Course workspace</p>
                  <p className="mt-1 text-xs text-muted-foreground">Ringkasan, materi, catatan, tugas, dan jadwal untuk mata kuliah ini.</p>
                  <Button variant="yellow" size="sm" className="mt-3" onClick={() => onOpenCourse(selected)}>
                    <BookOpen /> Buka ruang kerja
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function CourseCard({
  course,
  status,
  statuses,
  selected,
  onSelect,
}: {
  course: CurriculumCourse;
  status: CourseStatus;
  statuses: Map<string, CourseStatus>;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = statusIcon[status];
  const missing = status === "locked" ? missingPrereqs(course.code, statuses) : [];

  return (
    <button
      onClick={onSelect}
      className={`rounded-xl border p-4 text-left transition-colors hover:border-academic ${selected ? "border-academic bg-accent/40" : "border-border bg-surface"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground">{course.code}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{course.sks} SKS</span>
      </div>
      <p className="mt-2 min-h-10 text-sm font-bold leading-5">{course.name}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[status]}`}>
          <Icon className="size-3" /> {statusLabel[status]}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">{course.group}</span>
      </div>
      {missing.length > 0 && (
        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
          Butuh: {missing.map((code) => courseByCode.get(code)?.name ?? code).join(", ")}
        </p>
      )}
    </button>
  );
}

type CustomInput = { name: string; provider: string; sks: string; semester: string; note: string };
const emptyCustom: CustomInput = { name: "", provider: "", sks: "2", semester: "", note: "" };

function AdditionalLearning({
  custom,
  customSks,
  onAdd,
  onRemove,
}: {
  custom: { id: number; name: string; provider: string; sks: number; semester: number; note: string }[];
  customSks: number;
  onAdd: (course: { name: string; provider: string; sks: number; semester: number; note: string }) => void;
  onRemove: (id: number) => void;
}) {
  const [form, setForm] = useState<CustomInput>(emptyCustom);
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!form.name.trim()) return;
    onAdd({
      name: form.name.trim(),
      provider: form.provider.trim() || "Outside curriculum",
      sks: Number(form.sks) || 0,
      semester: Number(form.semester) || 0,
      note: form.note.trim(),
    });
    setForm(emptyCustom);
    setOpen(false);
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold md:text-lg">Additional learning</h2>
          <p className="mt-1 text-xs text-muted-foreground">Mata kuliah di luar kurikulum · {customSks} SKS tercatat</p>
        </div>
        <Button size="sm" variant={open ? "ghost" : "yellow"} onClick={() => setOpen((value) => !value)}>
          {open ? "Batal" : <><Plus /> Tambah mata kuliah</>}
        </Button>
      </div>

      {open && (
        <div className="academic-card mb-3 grid gap-3 p-5 sm:grid-cols-2">
          <Input placeholder="Nama mata kuliah" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Input placeholder="Penyelenggara (MOOC, pertukaran, MBKM…)" value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} />
          <Input type="number" min={0} placeholder="SKS" value={form.sks} onChange={(event) => setForm({ ...form, sks: event.target.value })} />
          <Input type="number" min={1} max={8} placeholder="Semester diambil" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })} />
          <Input className="sm:col-span-2" placeholder="Catatan (opsional)" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          <div className="sm:col-span-2"><Button size="sm" variant="yellow" onClick={submit}>Simpan mata kuliah</Button></div>
        </div>
      )}

      {custom.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          eyebrow="Di luar kurikulum"
          title="Pembelajaranmu di luar kurikulum juga dihitung"
          description="Catat MOOC, program MBKM, pertukaran pelajar, sertifikasi, atau bootcamp. SKS yang kamu catat di sini akan ditambahkan ke pembelajaranmu."
          actions={[{ label: open ? "Isi formulir di atas" : "Tambah mata kuliah pertamamu", icon: Plus, onClick: () => setOpen(true) }]}
          hints={["Coursera, edX, atau program sertifikasi kampus", "MBKM, konversi magang, atau semester pertukaran"]}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {custom.map((item) => (
            <div key={item.id} className="academic-card p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{item.provider}</span>
                <button onClick={() => onRemove(item.id)} className="text-muted-foreground transition-colors hover:text-destructive" aria-label="Hapus mata kuliah"><Trash2 className="size-3.5" /></button>
              </div>
              <p className="mt-2 text-sm font-bold leading-5">{item.name}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{item.sks} SKS{item.semester ? ` · semester ${item.semester}` : ""}</p>
              {item.note && <p className="mt-1 text-[11px] text-muted-foreground">{item.note}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="academic-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${tone ?? "text-academic"}`}>{value}</p>
    </div>
  );
}
