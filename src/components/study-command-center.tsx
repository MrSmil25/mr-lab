import {
  ArrowLeft, BookOpen, CalendarDays, CalendarPlus, ChevronRight, Clock3, FileText, GraduationCap,
  ListChecks, NotebookPen, PencilRuler, Plus, Target, Timer, Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { exams, type Exam, type StudyItem } from "@/components/exam-prep";

export type MasteryLevel = "Not started" | "Learning" | "Familiar" | "Mastered";
export type StudyTopic = { id: number; title: string; level: MasteryLevel };
export type PlannedSession = { id: number; eventId: number; day: string; date: string; time: string; duration: string; topic: string };

export type EventMeta = {
  assessment: "UTS" | "UAS" | "Quiz" | "Presentation" | "Project";
  format: string;
  notes: string[];
  topics: StudyTopic[];
};

const eventMeta: Record<number, EventMeta> = {};

export const initialStudySessions: PlannedSession[] = [];

const masteryLevels: MasteryLevel[] = ["Not started", "Learning", "Familiar", "Mastered"];
const masteryStyle: Record<MasteryLevel, string> = {
  "Not started": "bg-muted text-muted-foreground",
  Learning: "bg-warning/15 text-warning",
  Familiar: "bg-accent text-academic",
  Mastered: "bg-success/12 text-success",
};
const masteryValue: Record<MasteryLevel, number> = { "Not started": 0, Learning: 40, Familiar: 70, Mastered: 100 };
const masteryLabel: Record<MasteryLevel, string> = {
  "Not started": "Belum mulai",
  Learning: "Sedang belajar",
  Familiar: "Cukup paham",
  Mastered: "Sudah kuasai",
};
const assessmentLabel: Record<EventMeta["assessment"], string> = {
  UTS: "UTS",
  UAS: "UAS",
  Quiz: "Kuis",
  Presentation: "Presentasi",
  Project: "Proyek",
};

const resourceIcon = { Textbook: BookOpen, Slides: FileText, Note: NotebookPen, Practice: PencilRuler, Task: Target } as const;
const categories: StudyItem["category"][] = ["Concept review", "Practice", "Final review"];
const categoryLabel: Record<StudyItem["category"], string> = {
  "Concept review": "Tinjau konsep",
  Practice: "Latihan",
  "Final review": "Review akhir",
};
const weekDayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekDayLabel: Record<string, string> = { Mon: "Sen", Tue: "Sel", Wed: "Rab", Thu: "Kam", Fri: "Jum", Sat: "Sab", Sun: "Min" };

const progressOf = (plan: StudyItem[]) => (plan.length ? Math.round((plan.filter((item) => item.done).length / plan.length) * 100) : 0);

const defaultMeta: EventMeta = { assessment: "UTS", format: "", notes: [], topics: [] };

export const getEventMeta = (id: number) => eventMeta[id] ?? defaultMeta;

export function AcademicEventCard({ onPrepare }: { onPrepare: (event: Exam) => void }) {
  const next = exams.length ? [...exams].sort((a, b) => a.daysLeft - b.daysLeft)[0]! : null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold md:text-lg">Pusat komando belajar</h2>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{exams.length} penilaian mendatang</span>
      </div>
      {next ? (
        (() => {
          const meta = getEventMeta(next.id);
          const progress = progressOf(next.plan);
          return (
            <article className="academic-card overflow-hidden">
              <div className="h-1.5 bg-primary" />
              <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Agenda akademik mendatang</p>
                  <h3 className="mt-2 flex flex-wrap items-center gap-2 text-lg font-bold">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-academic"><GraduationCap className="size-4" /></span>
                    {assessmentLabel[meta.assessment]} {next.course}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-academic" />{next.date}</span>
                    <span className="flex items-center gap-1.5"><Timer className="size-3.5 text-academic" />{next.daysLeft} hari lagi</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={progress} className="h-2 max-w-sm flex-1" />
                    <span className="text-xs font-bold text-academic">{progress}% siap</span>
                  </div>
                </div>
                <Button variant="yellow" onClick={() => onPrepare(next)} className="justify-self-start md:justify-self-end">
                  Siapkan sekarang <ChevronRight className="size-4" />
                </Button>
              </div>
            </article>
          );
        })()
      ) : (
        <div className="academic-card p-5 text-sm text-muted-foreground">Belum ada agenda akademik mendatang.</div>
      )}
    </section>
  );
}

export function StudyCommandCenter({
  event, onBack, sessions, onAddSession, onRemoveSession,
}: {
  event: Exam;
  onBack: () => void;
  sessions: PlannedSession[];
  onAddSession: (session: Omit<PlannedSession, "id">) => void;
  onRemoveSession: (id: number) => void;
}) {
  const meta = getEventMeta(event.id);
  const [plan, setPlan] = useState<StudyItem[]>(event.plan);
  const [topics, setTopics] = useState<StudyTopic[]>(meta.topics);
  const [itemDraft, setItemDraft] = useState({ label: "", category: categories[0] as StudyItem["category"], week: 1 });
  const [sessionDraft, setSessionDraft] = useState({ topic: "", day: "Mon", date: "", time: "19:00", duration: "60 min" });

  const progress = progressOf(plan);
  const weeks = useMemo(() => Array.from(new Set(plan.map((item) => item.week))).sort((a, b) => a - b), [plan]);
  const mastery = topics.length ? Math.round(topics.reduce((sum, topic) => sum + masteryValue[topic.level], 0) / topics.length) : 0;
  const mySessions = sessions.filter((session) => session.eventId === event.id);

  const toggle = (id: number) => setPlan((items) => items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  const cycleTopic = (id: number) =>
    setTopics((items) => items.map((topic) => (topic.id === id
      ? { ...topic, level: masteryLevels[(masteryLevels.indexOf(topic.level) + 1) % masteryLevels.length]! }
      : topic)));

  const addItem = () => {
    if (!itemDraft.label.trim()) return;
    setPlan((items) => [...items, { id: Date.now(), label: itemDraft.label.trim(), category: itemDraft.category, week: Number(itemDraft.week) || 1, done: false }]);
    setItemDraft({ ...itemDraft, label: "" });
  };

  const addSession = () => {
    if (!sessionDraft.topic.trim()) return;
    onAddSession({
      eventId: event.id,
      day: sessionDraft.day,
      date: sessionDraft.date.trim() || sessionDraft.day,
      time: sessionDraft.time || "19:00",
      duration: sessionDraft.duration || "60 min",
      topic: sessionDraft.topic.trim(),
    });
    setSessionDraft({ ...sessionDraft, topic: "", date: "" });
  };

  return (
    <div className="page-enter">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2"><ArrowLeft /> Beranda</Button>

      <header className="mb-6 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold opacity-75">{event.courseCode} · Pusat komando belajar</span>
          <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">{assessmentLabel[meta.assessment]}</span>
        </div>
        <h1 className="mt-5 max-w-3xl text-2xl font-bold md:text-3xl">{event.course}</h1>
        <p className="mt-1 text-sm opacity-80">{event.type}</p>
        <div className="mt-6 grid gap-4 border-t border-academic-foreground/15 pt-5 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="opacity-65">Tanggal</p><p className="mt-1 font-semibold">{event.date}</p></div>
          <div><p className="opacity-65">Hitung mundur</p><p className="mt-1 font-semibold">{event.daysLeft} hari lagi</p></div>
          <div><p className="opacity-65">Penguasaan topik</p><p className="mt-1 font-semibold">{mastery}%</p></div>
          <div><p className="opacity-65">Persiapan</p><p className="mt-1 font-semibold">{progress}% selesai</p></div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-academic-foreground/20"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
        <div className="space-y-4">
          <section className="academic-card p-5">
            <div className="mb-5 flex items-center gap-2"><ListChecks className="size-5 text-academic" /><h2 className="text-base font-bold">Ringkasan penilaian</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Tanggal dan tempat</p>
                <p className="mt-1 text-sm font-semibold">{event.date}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{event.room}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Format penilaian</p>
                <p className="mt-1 text-sm font-semibold">{meta.format || "Belum diisi"}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Topik yang dicakup</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada topik yang ditambahkan.</p>
                ) : topics.map((topic) => <span key={topic.id} className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{topic.title}</span>)}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Catatan penting</p>
              <ul className="mt-2 space-y-1.5">
                {meta.notes.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Belum ada catatan penting.</li>
                ) : meta.notes.map((note) => (
                  <li key={note} className="flex gap-2 text-sm text-muted-foreground"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{note}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="academic-card p-5">
            <div className="mb-5 flex items-center gap-2"><GraduationCap className="size-5 text-academic" /><h2 className="text-base font-bold">Peta jalan belajar</h2></div>
            <div className="space-y-5">
              {weeks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada rencana belajar. Tambahkan langkah belajar di bawah.</p>
              ) : weeks.map((week) => (
                <div key={week}>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Minggu {week}</p>
                  <div className="space-y-2">
                    {plan.filter((item) => item.week === week).map((item) => (
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
              <Input value={itemDraft.label} onChange={(event_) => setItemDraft({ ...itemDraft, label: event_.target.value })} placeholder="Tambah langkah belajar" className="h-9 text-sm" />
              <select value={itemDraft.category} onChange={(event_) => setItemDraft({ ...itemDraft, category: event_.target.value as StudyItem["category"] })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                {categories.map((category) => <option key={category} value={category}>{categoryLabel[category]}</option>)}
              </select>
              <Input value={String(itemDraft.week)} onChange={(event_) => setItemDraft({ ...itemDraft, week: Number(event_.target.value) || 1 })} inputMode="numeric" aria-label="Minggu" className="h-9 text-sm" />
              <Button size="sm" variant="academic" onClick={addItem} aria-label="Tambah langkah belajar"><Plus className="size-4" /></Button>
            </div>
            <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
              {categories.map((category) => {
                const items = plan.filter((item) => item.category === category);
                const done = items.filter((item) => item.done).length;
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

          <section className="academic-card p-5">
            <div className="mb-2 flex items-center gap-2"><Target className="size-5 text-academic" /><h2 className="text-base font-bold">Penguasaan topik</h2></div>
            <p className="mb-4 text-xs text-muted-foreground">Ketuk topik untuk naik ke level berikutnya · penguasaan keseluruhan {mastery}%</p>
            <div className="space-y-2">
              {topics.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada topik untuk dilacak.</p>
              ) : topics.map((topic) => (
                <button key={topic.id} onClick={() => cycleTopic(topic.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-academic">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{topic.title}</p>
                    <Progress value={masteryValue[topic.level]} className="mt-2 h-1.5" />
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${masteryStyle[topic.level]}`}>{masteryLabel[topic.level]}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="academic-card p-5">
            <div className="mb-4 flex items-center gap-2"><BookOpen className="size-5 text-academic" /><h2 className="text-base font-bold">Materi terkait</h2></div>
            <div className="space-y-2">
              {event.resources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada materi yang ditautkan.</p>
              ) : event.resources.map((resource) => {
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
              {mySessions.length ? mySessions.map((session) => (
                <div key={session.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{session.topic}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <CalendarDays className="size-3" />{weekDayLabel[session.day] ?? session.day} · {session.date} · {session.time}
                      <Clock3 className="size-3" />{session.duration}
                    </p>
                  </div>
                  <button onClick={() => onRemoveSession(session.id)} aria-label={`Hapus ${session.topic}`} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              )) : <p className="text-sm text-muted-foreground">Belum ada sesi belajar yang dijadwalkan.</p>}
            </div>
            <div className="mt-4 grid gap-2 border-t border-border pt-4">
              <Input value={sessionDraft.topic} onChange={(event_) => setSessionDraft({ ...sessionDraft, topic: event_.target.value })} placeholder="Topik sesi" className="h-9 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={sessionDraft.day} onChange={(event_) => setSessionDraft({ ...sessionDraft, day: event_.target.value })} aria-label="Hari" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {weekDayKeys.map((day) => <option key={day} value={day}>{weekDayLabel[day]}</option>)}
                </select>
                <Input value={sessionDraft.date} onChange={(event_) => setSessionDraft({ ...sessionDraft, date: event_.target.value })} placeholder="8 Okt" className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={sessionDraft.time} onChange={(event_) => setSessionDraft({ ...sessionDraft, time: event_.target.value })} placeholder="19:00" className="h-9 text-sm" />
                <Input value={sessionDraft.duration} onChange={(event_) => setSessionDraft({ ...sessionDraft, duration: event_.target.value })} placeholder="60 menit" className="h-9 text-sm" />
              </div>
              <Button variant="academic" size="sm" onClick={addSession}><Plus className="size-4" /> Jadwalkan sesi belajar</Button>
              <p className="text-[11px] text-muted-foreground">Sesi akan muncul di kalender akademik sebagai blok belajar untuk {event.course}.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
