import { Award, Calculator, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { studentProfile } from "@/data/profile";
import { useDashboard, useStudentCourses } from "@/data/academic";
import { academicSummary, gradePoint, isCompleted } from "@/lib/gpa";
import { GpaEyeButton, GpaValue } from "@/components/gpa-visibility";

export type SemesterRecord = { id: number; name: string; gpa: number; sks: number; courses: number };

export const semesterHistory: SemesterRecord[] = [];

function gradeLetter(score: number) {
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  return "D";
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-bold md:text-lg">{title}</h2>{action}</div>;
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg font-bold">{value}</p>{hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}</div>;
}

export function AcademicPerformance() {
  const [targetGpa, setTargetGpa] = useState(studentProfile.targetGpa.toFixed(2));
  const [targetSks, setTargetSks] = useState(String(studentProfile.targetSks));
  const [goals, setGoals] = useState<{ id: number; label: string; done: boolean }[]>([]);
  const [goalDraft, setGoalDraft] = useState("");

  const { courses } = useStudentCourses();
  const { dashboard } = useDashboard();
  const currentSemester = dashboard?.current_semester ?? null;

  // Riwayat semester dan IPK dihitung langsung dari mata kuliah milik mahasiswa.
  const history = useMemo<SemesterRecord[]>(() => {
    const buckets = new Map<number, { sks: number; courses: number; points: number; gradedSks: number }>();
    if (currentSemester) buckets.set(currentSemester, { sks: 0, courses: 0, points: 0, gradedSks: 0 });
    for (const course of courses) {
      const semester = course.semester ?? 0;
      if (!isCompleted(course.status) && semester !== currentSemester) continue;
      const bucket = buckets.get(semester) ?? { sks: 0, courses: 0, points: 0, gradedSks: 0 };
      bucket.sks += course.sks || 0;
      bucket.courses += 1;
      const point = gradePoint(course.grade);
      if (point !== null) {
        bucket.points += point * (course.sks || 0);
        bucket.gradedSks += course.sks || 0;
      }
      buckets.set(semester, bucket);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([semester, value]) => ({
        id: semester,
        name: semester ? `Semester ${semester}` : "Tanpa semester",
        gpa: value.gradedSks ? value.points / value.gradedSks : 0,
        sks: value.sks,
        courses: value.courses,
      }));
  }, [courses, currentSemester]);

  const summary = useMemo(
    () => academicSummary(courses.map(course => ({ sks: course.sks || 0, grade: course.grade ?? null, status: course.status }))),
    [courses],
  );

  const currentGpa = summary.gpa;
  const target = Number(targetGpa) || 0;
  const creditTarget = Number(targetSks) || 0;
  const completedSks = summary.completedSks;
  const gpaProgress = target > 0 ? Math.min(100, Math.round((currentGpa / target) * 100)) : 0;
  const sksProgress = creditTarget > 0 ? Math.min(100, Math.round((completedSks / creditTarget) * 100)) : 0;
  const gap = target - currentGpa;
  const best = history.length ? Math.max(...history.map(item => item.gpa)) : 0;
  const goalsDone = goals.filter(goal => goal.done).length;

  const addGoal = () => {
    const label = goalDraft.trim();
    if (!label) return;
    setGoals(items => [...items, { id: Date.now(), label, done: false }]);
    setGoalDraft("");
  };

  return (
    <section>
      <SectionHeader title="Performa akademik" action={<span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{completedSks} SKS selesai</span>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.9fr)]">
        <article className="academic-card p-5 md:p-6">
          <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <div className="rounded-2xl bg-academic p-5 text-academic-foreground">
              <p className="flex items-center justify-between gap-2 text-[11px] uppercase opacity-75">IPK saat ini<GpaEyeButton /></p>
              <GpaValue value={currentGpa.toFixed(2)} className="mt-1 block font-display text-4xl font-bold" />
              <p className="mt-2 flex items-center gap-1.5 text-[11px] opacity-85"><TrendingUp className="size-3.5 text-primary" />IPK tertinggi <GpaValue value={best.toFixed(2)} /></p>
            </div>
            <div className="min-w-0">
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-xs text-muted-foreground">Progres menuju target</p><p className="mt-1 text-sm font-semibold">{gap > 0 ? `${gap.toFixed(2)} lagi` : "Target tercapai"}</p></div>
                <p className="font-display text-2xl font-bold text-academic">{gpaProgress}%</p>
              </div>
              <Progress value={gpaProgress} className="mt-3 h-2" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="rounded-xl bg-muted p-3">
                  <span className="text-[11px] text-muted-foreground">Target IPK</span>
                  <Input value={targetGpa} onChange={event => setTargetGpa(event.target.value)} inputMode="decimal" className="mt-1 h-8 border-0 bg-surface px-2 font-display text-base font-bold" />
                </label>
                <label className="rounded-xl bg-muted p-3">
                  <span className="text-[11px] text-muted-foreground">Target SKS</span>
                  <Input value={targetSks} onChange={event => setTargetSks(event.target.value)} inputMode="numeric" className="mt-1 h-8 border-0 bg-surface px-2 font-display text-base font-bold" />
                </label>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Progres SKS</span><span className="font-semibold text-academic">{completedSks} / {creditTarget || "—"} SKS</span></div>
                <Progress value={sksProgress} className="mt-2 h-2" />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Award className="size-4 text-academic" />Riwayat semester</p>
            <div className="space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada riwayat semester.</p>
              ) : [...history].reverse().map((item, index) => (
                <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.name}{item.id === currentSemester && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Saat ini</span>}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.sks} SKS · {item.courses} mata kuliah</p>
                  </div>
                  <div className="text-right">
                    <GpaValue value={item.gpa.toFixed(2)} className="font-display text-lg font-bold text-academic" />
                    <p className="text-[10px] text-muted-foreground">IPK</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="academic-card p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Target className="size-4 text-academic" />Target akademik</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatTile label="Target tercapai" value={`${goalsDone}/${goals.length}`} />
            <div className="rounded-xl bg-muted p-3"><p className="text-[11px] text-muted-foreground">Rata-rata IPK</p><GpaValue value={(history.length ? history.reduce((sum, item) => sum + item.gpa, 0) / history.length : 0).toFixed(2)} className="mt-1 block font-display text-lg font-bold" /></div>
          </div>
          <Progress value={goals.length ? (goalsDone / goals.length) * 100 : 0} className="mt-4 h-2" />
          <div className="mt-4 space-y-2">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada target akademik.</p>
            ) : goals.map(goal => (
              <div key={goal.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                <button onClick={() => setGoals(items => items.map(item => item.id === goal.id ? { ...item, done: !item.done } : item))} aria-label={`Tandai ${goal.label}`} className={`size-5 rounded-full border ${goal.done ? "border-academic bg-academic" : "border-input bg-background"}`} />
                <p className={`min-w-0 text-sm ${goal.done ? "text-muted-foreground line-through" : "font-medium"}`}>{goal.label}</p>
                <button onClick={() => setGoals(items => items.filter(item => item.id !== goal.id))} aria-label={`Hapus ${goal.label}`} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={goalDraft} onChange={event => setGoalDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") addGoal(); }} placeholder="Tambah target akademik" className="h-9" />
            <Button size="sm" variant="academic" onClick={addGoal} aria-label="Tambah target"><Plus className="size-4" /></Button>
          </div>
        </article>
      </div>
    </section>
  );
}

type Component = { id: number; name: string; weight: number; score: number };

const defaultComponents: Component[] = [];

export function CoursePerformance({ courseTitle }: { courseTitle: string }) {
  const [components, setComponents] = useState<Component[]>(defaultComponents);
  const [targetScore, setTargetScore] = useState("85");
  const [draft, setDraft] = useState({ name: "", weight: "", score: "" });

  const { graded, currentGrade, projected, remainingWeight } = useMemo(() => {
    const gradedItems = components.filter(item => item.score > 0);
    const gradedWeight = gradedItems.reduce((sum, item) => sum + item.weight, 0);
    const earned = gradedItems.reduce((sum, item) => sum + (item.score * item.weight) / 100, 0);
    const totalWeight = components.reduce((sum, item) => sum + item.weight, 0);
    return {
      graded: gradedWeight,
      currentGrade: gradedWeight > 0 ? (earned / gradedWeight) * 100 : 0,
      projected: earned,
      remainingWeight: Math.max(0, totalWeight - gradedWeight),
    };
  }, [components]);

  const target = Number(targetScore) || 0;
  const requiredScore = remainingWeight > 0 ? ((target - projected) / remainingWeight) * 100 : null;

  const update = (id: number, patch: Partial<Component>) => setComponents(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const addComponent = () => {
    if (!draft.name.trim()) return;
    setComponents(items => [...items, { id: Date.now(), name: draft.name.trim(), weight: Number(draft.weight) || 0, score: Number(draft.score) || 0 }]);
    setDraft({ name: "", weight: "", score: "" });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="academic-card p-5">
        <div className="mb-5 flex items-center gap-2"><TrendingUp className="size-5 text-academic" /><h2 className="text-base font-bold">Ringkasan nilai</h2></div>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-3xl font-bold">{currentGrade.toFixed(1)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Nilai saat ini dari {graded}% komponen penilaian</p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-academic">Perkiraan {gradeLetter(currentGrade)}</span>
        </div>
        <Progress value={Math.min(100, currentGrade)} className="mt-4 h-2" />
        <div className="mt-5 grid grid-cols-2 gap-2">
          {components.length === 0 ? (
            <p className="col-span-2 text-sm text-muted-foreground">Belum ada komponen nilai. Tambahkan di kalkulator nilai.</p>
          ) : components.map(item => (
            <StatTile key={item.id} label={item.name} value={item.score > 0 ? String(item.score) : "—"} hint={`Bobot ${item.weight}%`} />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Nilai dilacak untuk {courseTitle}. Komponen yang belum dinilai tidak dihitung sampai ada nilainya.</p>
      </section>

      <section className="academic-card p-5">
        <div className="mb-5 flex items-center gap-2"><Calculator className="size-5 text-academic" /><h2 className="text-base font-bold">Kalkulator nilai</h2></div>
        <div className="space-y-2">
          {components.map(item => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_64px_64px_auto] items-center gap-2">
              <Input value={item.name} onChange={event => update(item.id, { name: event.target.value })} className="h-9 text-sm" aria-label="Komponen penilaian" />
              <Input value={String(item.weight)} onChange={event => update(item.id, { weight: Number(event.target.value) || 0 })} inputMode="numeric" className="h-9 text-sm" aria-label={`Bobot ${item.name}`} />
              <Input value={String(item.score)} onChange={event => update(item.id, { score: Number(event.target.value) || 0 })} inputMode="numeric" className="h-9 text-sm" aria-label={`Nilai ${item.name}`} />
              <button onClick={() => setComponents(items => items.filter(row => row.id !== item.id))} aria-label={`Hapus ${item.name}`} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_64px_64px_auto] items-center gap-2">
          <Input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Komponen" className="h-9 text-sm" />
          <Input value={draft.weight} onChange={event => setDraft({ ...draft, weight: event.target.value })} placeholder="%" inputMode="numeric" className="h-9 text-sm" />
          <Input value={draft.score} onChange={event => setDraft({ ...draft, score: event.target.value })} placeholder="Nilai" inputMode="numeric" className="h-9 text-sm" />
          <Button size="sm" variant="academic" onClick={addComponent} aria-label="Tambah komponen"><Plus className="size-4" /></Button>
        </div>
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">Target nilai akhir</span>
            <Input value={targetScore} onChange={event => setTargetScore(event.target.value)} inputMode="numeric" className="h-9 w-24 text-sm" />
          </label>
          <div className="rounded-xl bg-muted p-4">
            {components.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tambahkan komponen penilaian untuk melihat proyeksi nilai.</p>
            ) : remainingWeight === 0 ? (
              <p className="text-sm text-muted-foreground">Semua komponen sudah dinilai. Nilai akhir adalah {projected.toFixed(1)} ({gradeLetter(projected)}).</p>
            ) : requiredScore !== null && requiredScore > 100 ? (
              <p className="text-sm font-semibold text-destructive">Target {target} tidak mungkin tercapai — kamu butuh {requiredScore.toFixed(1)} pada sisa {remainingWeight}%.</p>
            ) : (
              <p className="text-sm">Kamu butuh <span className="font-display text-lg font-bold text-academic">{Math.max(0, requiredScore ?? 0).toFixed(1)}</span> pada sisa {remainingWeight}% untuk mencapai {target} ({gradeLetter(target)}).</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
