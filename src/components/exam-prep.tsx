import {
  ArrowLeft, BookOpen, CalendarDays, CalendarPlus, ChevronRight, Clock3, FileText,
  GraduationCap, NotebookPen, PencilRuler, Plus, Target, Timer, Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export type ExamResource = { id: number; kind: "Textbook" | "Slides" | "Note" | "Practice" | "Task"; title: string; source: string };
export type StudyItem = { id: number; label: string; category: "Concept review" | "Practice" | "Final review"; week: number; done: boolean };
export type StudySession = { id: number; date: string; time: string; duration: string; topic: string };
export type Exam = {
  id: number; course: string; courseCode: string; type: string; date: string; daysLeft: number;
  room: string; accent: string; plan: StudyItem[]; resources: ExamResource[]; sessions: StudySession[];
};

export const exams: Exam[] = [];

const resourceIcon = { Textbook: BookOpen, Slides: FileText, Note: NotebookPen, Practice: PencilRuler, Task: Target } as const;
const categories: StudyItem["category"][] = ["Concept review", "Practice", "Final review"];
const categoryLabel: Record<StudyItem["category"], string> = {
  "Concept review": "Tinjau konsep",
  Practice: "Latihan",
  "Final review": "Review akhir",
};

const progressOf = (plan: StudyItem[]) => plan.length ? Math.round((plan.filter(item => item.done).length / plan.length) * 100) : 0;

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-bold md:text-lg">{title}</h2>{action}</div>;
}

export function ExamCenter({ onOpen }: { onOpen: (exam: Exam) => void }) {
  const nearest = exams[0] ?? null;
  return (
    <section>
      <SectionHeader title="Pusat ujian" action={<span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{exams.length} ujian mendatang</span>} />
      {nearest ? (
        <>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Timer className="size-4 text-academic" />Ujian terdekat dalam {nearest.daysLeft} hari — {nearest.course}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map(exam => {
              const progress = progressOf(exam.plan);
              return (
                <button key={exam.id} onClick={() => onOpen(exam)} className="academic-card group overflow-hidden text-left transition-transform hover:-translate-y-0.5">
                  <div className={`h-2 ${exam.accent}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-semibold text-academic">{exam.courseCode}</span>
                      <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold">{exam.type}</span>
                    </div>
                    <h3 className="mt-3 min-h-12 text-base font-bold leading-6">{exam.course}</h3>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-academic" />{exam.date}</span>
                      <span className={`rounded-full px-2 py-1 font-semibold ${exam.daysLeft <= 14 ? "bg-destructive/10 text-destructive" : "bg-accent text-academic"}`}>{exam.daysLeft} hari lagi</span>
                    </div>
                    <div className="mt-4 border-t border-border pt-4">
                      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Persiapan</span><span className="font-bold text-academic">{progress}%</span></div>
                      <Progress value={progress} className="mt-2 h-2" />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-academic"><span>Buka persiapan</span><ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="academic-card p-5 text-sm text-muted-foreground">Belum ada ujian yang dijadwalkan. Tambahkan ujian untuk mulai menyiapkan diri.</div>
      )}
    </section>
  );
}

export function ExamDetail({ exam, onBack }: { exam: Exam; onBack: () => void }) {
  const [plan, setPlan] = useState<StudyItem[]>(exam.plan);
  const [sessions, setSessions] = useState<StudySession[]>(exam.sessions);
  const [itemDraft, setItemDraft] = useState({ label: "", category: categories[0] as StudyItem["category"], week: 1 });
  const [sessionDraft, setSessionDraft] = useState({ date: "", time: "", duration: "60 min", topic: "" });

  const progress = progressOf(plan);
  const weeks = Array.from(new Set(plan.map(item => item.week))).sort((a, b) => a - b);
  const toggle = (id: number) => setPlan(items => items.map(item => item.id === id ? { ...item, done: !item.done } : item));

  const addItem = () => {
    if (!itemDraft.label.trim()) return;
    setPlan(items => [...items, { id: Date.now(), label: itemDraft.label.trim(), category: itemDraft.category, week: Number(itemDraft.week) || 1, done: false }]);
    setItemDraft({ ...itemDraft, label: "" });
  };
  const addSession = () => {
    if (!sessionDraft.topic.trim() || !sessionDraft.date.trim()) return;
    setSessions(items => [...items, { id: Date.now(), ...sessionDraft, topic: sessionDraft.topic.trim(), time: sessionDraft.time || "19:00" }]);
    setSessionDraft({ date: "", time: "", duration: "60 min", topic: "" });
  };

  return (
    <div className="page-enter">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2"><ArrowLeft /> Pusat ujian</Button>

      <div className="mb-6 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground md:p-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold opacity-75">{exam.courseCode}</span>
          <span className="rounded-lg bg-academic-foreground/15 px-2.5 py-1 text-xs font-semibold">{exam.type}</span>
        </div>
        <h1 className="mt-5 max-w-3xl text-2xl font-bold md:text-3xl">{exam.course}</h1>
        <div className="mt-6 grid gap-4 border-t border-academic-foreground/15 pt-5 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="opacity-65">Tanggal ujian</p><p className="mt-1 font-semibold">{exam.date}</p></div>
          <div><p className="opacity-65">Hitung mundur</p><p className="mt-1 font-semibold">{exam.daysLeft} hari lagi</p></div>
          <div><p className="opacity-65">Ruangan</p><p className="mt-1 font-semibold">{exam.room}</p></div>
          <div><p className="opacity-65">Persiapan</p><p className="mt-1 font-semibold">{progress}% selesai</p></div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-academic-foreground/20"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
        <div className="space-y-4">
          <section className="academic-card p-5">
            <div className="mb-5 flex items-center gap-2"><GraduationCap className="size-5 text-academic" /><h2 className="text-base font-bold">Rencana belajar</h2></div>
            <div className="space-y-5">
              {weeks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada rencana belajar. Tambahkan langkah belajar di bawah.</p>
              ) : weeks.map(week => (
                <div key={week}>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Minggu {week}</p>
                  <div className="space-y-2">
                    {plan.filter(item => item.week === week).map(item => (
                      <div key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted p-3">
                        <button onClick={() => toggle(item.id)} aria-label={`Tandai ${item.label}`} className={`size-5 shrink-0 rounded-full border ${item.done ? "border-academic bg-academic" : "border-input bg-background"}`} />
                        <p className={`min-w-0 text-sm ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}>{item.label}</p>
                        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-academic">{categoryLabel[item.category]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_140px_72px_auto]">
              <Input value={itemDraft.label} onChange={event => setItemDraft({ ...itemDraft, label: event.target.value })} placeholder="Tambah langkah belajar" className="h-9 text-sm" />
              <select value={itemDraft.category} onChange={event => setItemDraft({ ...itemDraft, category: event.target.value as StudyItem["category"] })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                {categories.map(category => <option key={category} value={category}>{categoryLabel[category]}</option>)}
              </select>
              <Input value={String(itemDraft.week)} onChange={event => setItemDraft({ ...itemDraft, week: Number(event.target.value) || 1 })} inputMode="numeric" aria-label="Minggu" className="h-9 text-sm" />
              <Button size="sm" variant="academic" onClick={addItem} aria-label="Tambah langkah belajar"><Plus className="size-4" /></Button>
            </div>
          </section>

          <section className="academic-card p-5">
            <div className="mb-5 flex items-center gap-2"><Target className="size-5 text-academic" /><h2 className="text-base font-bold">Checklist persiapan</h2></div>
            <div className="grid gap-4 sm:grid-cols-3">
              {categories.map(category => {
                const items = plan.filter(item => item.category === category);
                const done = items.filter(item => item.done).length;
                const value = items.length ? Math.round((done / items.length) * 100) : 0;
                return (
                  <div key={category} className="rounded-xl bg-muted p-4">
                    <p className="text-xs font-semibold">{categoryLabel[category]}</p>
                    <p className="mt-1 font-display text-2xl font-bold text-academic">{value}%</p>
                    <Progress value={value} className="mt-2 h-1.5" />
                    <p className="mt-2 text-[11px] text-muted-foreground">{done} dari {items.length} selesai</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="academic-card p-5">
            <div className="mb-4 flex items-center gap-2"><BookOpen className="size-5 text-academic" /><h2 className="text-base font-bold">Materi yang direkomendasikan</h2></div>
            <div className="space-y-2">
              {exam.resources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada materi yang ditautkan.</p>
              ) : exam.resources.map(resource => {
                const Icon = resourceIcon[resource.kind];
                return (
                  <div key={resource.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-border p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-academic"><Icon className="size-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{resource.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{resource.kind} · {resource.source}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="academic-card p-5">
            <div className="mb-4 flex items-center gap-2"><CalendarPlus className="size-5 text-academic" /><h2 className="text-base font-bold">Sesi belajar</h2></div>
            <div className="space-y-2">
              {sessions.length ? sessions.map(session => (
                <div key={session.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{session.topic}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground"><CalendarDays className="size-3" />{session.date} · {session.time}<Clock3 className="size-3" />{session.duration}</p>
                  </div>
                  <button onClick={() => setSessions(items => items.filter(item => item.id !== session.id))} aria-label={`Hapus ${session.topic}`} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              )) : <p className="text-sm text-muted-foreground">Belum ada sesi belajar yang dijadwalkan.</p>}
            </div>
            <div className="mt-4 grid gap-2 border-t border-border pt-4">
              <Input value={sessionDraft.topic} onChange={event => setSessionDraft({ ...sessionDraft, topic: event.target.value })} placeholder="Topik sesi" className="h-9 text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <Input value={sessionDraft.date} onChange={event => setSessionDraft({ ...sessionDraft, date: event.target.value })} placeholder="8 Okt" className="h-9 text-sm" />
                <Input value={sessionDraft.time} onChange={event => setSessionDraft({ ...sessionDraft, time: event.target.value })} placeholder="19:00" className="h-9 text-sm" />
                <Input value={sessionDraft.duration} onChange={event => setSessionDraft({ ...sessionDraft, duration: event.target.value })} placeholder="60 menit" className="h-9 text-sm" />
              </div>
              <Button variant="academic" size="sm" onClick={addSession}><Plus className="size-4" /> Jadwalkan sesi belajar</Button>
              <p className="text-[11px] text-muted-foreground">Sesi akan muncul sebagai blok belajar pribadi untuk {exam.course}.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
