import { CalendarClock, FileText, GraduationCap, ListTodo, NotebookPen, Plus, Timer, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROUTINE_DAY_LABELS, ROUTINE_DAYS, ROUTINE_TYPES, type Routine, type RoutineDay, type RoutineType } from "@/data/routines";

export type QuickTaskLink = "course" | "organization" | "none";
export type QuickTask = { title: string; link: QuickTaskLink; course: string; organization: string; dueIso: string; dueTime: string };
export type QuickNote = { title: string; course: string; body: string };
export type QuickResource = { title: string; course: string; type: string };
export type QuickSession = { day: string; date: string; time: string; duration: string; topic: string };
export type QuickCourse = { name: string; provider: string; sks: number; day: string; time: string; room: string };
export type QuickRoutine = Omit<Routine, "id">;

type Kind = "Task" | "Routine" | "Note" | "Resource" | "Study session" | "Custom course";

const kinds: { id: Kind; label: string; icon: typeof ListTodo }[] = [
  { id: "Task", label: "To-do", icon: ListTodo },
  { id: "Routine", label: "Rutinitas", icon: CalendarClock },
  { id: "Note", label: "Catatan", icon: NotebookPen },
  { id: "Resource", label: "Materi", icon: FileText },
  { id: "Study session", label: "Belajar", icon: Timer },
  { id: "Custom course", label: "Kuliah", icon: GraduationCap },
];

const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function QuickAdd({
  courses, organizations = [], onAddTask, onAddNote, onAddResource, onAddSession, onAddCourse, onAddRoutine,
}: {
  courses: string[];
  organizations?: string[];
  onAddTask: (task: QuickTask) => void;
  onAddNote: (note: QuickNote) => void;
  onAddResource: (resource: QuickResource) => void;
  onAddSession: (session: QuickSession) => void;
  onAddCourse?: (course: QuickCourse) => void;
  onAddRoutine?: (routine: QuickRoutine) => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("Task");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState<QuickTaskLink>("course");
  const [course, setCourse] = useState(courses[0] ?? "");
  const [organization, setOrganization] = useState(organizations[0] ?? "");
  const [dueIso, setDueIso] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [due, setDue] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("Books");
  const [day, setDay] = useState("Mon");
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("90 min");
  const [provider, setProvider] = useState("");
  const [sks, setSks] = useState("3");
  const [courseDay, setCourseDay] = useState("Monday");
  const [courseTime, setCourseTime] = useState("08:00 – 10:30");
  const [room, setRoom] = useState("");
  const [routineType, setRoutineType] = useState<RoutineType>("Rutinitas pribadi");
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([]);
  const [routineStart, setRoutineStart] = useState("");
  const [routineEnd, setRoutineEnd] = useState("");
  const [routineLocation, setRoutineLocation] = useState("");
  const [message, setMessage] = useState("");

  const reset = () => { setTitle(""); setDue(""); setDueIso(""); setDueTime(""); setBody(""); setProvider(""); setRoom(""); setRoutineDays([]); setRoutineLocation(""); };

  const toggleRoutineDay = (value: RoutineDay) =>
    setRoutineDays((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));

  const submit = () => {
    const value = title.trim();
    if (!value) return;
    if (kind === "Task") {
      const effectiveLink: QuickTaskLink = link === "course" && !course ? "none" : link === "organization" && !organization ? "none" : link;
      onAddTask({ title: value, link: effectiveLink, course, organization, dueIso, dueTime });
    }
    if (kind === "Routine") {
      if (!routineDays.length) { setMessage("Pilih minimal satu hari untuk rutinitas ini."); return; }
      onAddRoutine?.({
        title: value,
        type: routineType,
        ...(routineType === "Organisasi" && organization ? { organization } : {}),
        days: routineDays,
        ...(routineStart ? { start: routineStart } : {}),
        ...(routineEnd ? { end: routineEnd } : {}),
        ...(routineLocation.trim() ? { location: routineLocation.trim() } : {}),
      });
    }
    if (kind === "Note") onAddNote({ title: value, course, body: body.trim() });
    if (kind === "Resource") onAddResource({ title: value, course, type });
    if (kind === "Study session") onAddSession({ day, date: due.trim() || day, time, duration, topic: value });
    if (kind === "Custom course") onAddCourse?.({ name: value, provider: provider.trim() || "Outside curriculum", sks: Number(sks) || 0, day: courseDay, time: courseTime, room: room.trim() });
    setMessage("Tersimpan di ruang akademikmu.");
    reset();
    setTimeout(() => setMessage(""), 2500);
  };

  const needsCourse = kind === "Note" || kind === "Resource";
  const label = kinds.find((item) => item.id === kind)?.label.toLowerCase() ?? "";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className="fixed bottom-24 right-4 z-40 grid size-14 place-items-center rounded-full bg-academic text-academic-foreground shadow-lg transition-transform hover:-translate-y-0.5 md:bottom-8 md:right-8"
      >
        <Plus className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-academic/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl" onClick={event => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-bold">Tambah cepat</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Buat apa pun tanpa meninggalkan halaman ini.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close quick add" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
            </header>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {kinds.map(({ id, label: kindLabel, icon: Icon }) => (
                  <button key={id} onClick={() => setKind(id)} className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-1.5 py-3 text-center text-[11px] font-semibold transition-colors ${kind === id ? "border-academic bg-accent text-academic" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    <Icon className="size-4" />
                    <span className="w-full truncate">{kindLabel}</span>
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">{kind === "Study session" ? "Topik" : kind === "Custom course" ? "Nama mata kuliah" : kind === "Routine" ? "Nama rutinitas" : "Judul"}</span>
                <Input value={title} onChange={event => setTitle(event.target.value)} placeholder={kind === "Study session" ? "Ulang materi perilaku biaya" : kind === "Custom course" ? "Digital Marketing (MOOC)" : kind === "Routine" ? "Gym, rapat divisi, magang…" : "Tugas baru"} className="mt-1.5" />
              </label>

              {kind === "Task" && (
                <>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Kaitkan dengan</span>
                    <select value={link} onChange={event => setLink(event.target.value as QuickTaskLink)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                      <option value="course">Mata kuliah</option>
                      <option value="organization">Organisasi</option>
                      <option value="none">Tanpa kaitan (to-do saja)</option>
                    </select>
                  </label>

                  {link === "course" && (
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">Mata kuliah</span>
                      <select value={course} onChange={event => setCourse(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                        {courses.length ? courses.map(item => <option key={item} value={item}>{item}</option>) : <option value="">Belum ada mata kuliah</option>}
                      </select>
                    </label>
                  )}

                  {link === "organization" && (
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">Organisasi</span>
                      <select value={organization} onChange={event => setOrganization(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                        {organizations.length ? organizations.map(item => <option key={item} value={item}>{item}</option>) : <option value="">Belum ada organisasi — tambahkan di Pustaka</option>}
                      </select>
                    </label>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">Tanggal</span>
                      <Input type="date" value={dueIso} onChange={event => setDueIso(event.target.value)} className="mt-1.5" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">Jam (opsional)</span>
                      <Input type="time" value={dueTime} onChange={event => setDueTime(event.target.value)} className="mt-1.5" />
                    </label>
                  </div>
                </>
              )}

              {kind === "Routine" && (
                <>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Jenis rutinitas</span>
                    <select value={routineType} onChange={event => setRoutineType(event.target.value as RoutineType)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                      {ROUTINE_TYPES.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>

                  {routineType === "Organisasi" && (
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">Organisasi</span>
                      <select value={organization} onChange={event => setOrganization(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                        {organizations.length ? organizations.map(item => <option key={item} value={item}>{item}</option>) : <option value="">Belum ada organisasi — tambahkan di Pustaka</option>}
                      </select>
                    </label>
                  )}

                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">Hari (berulang setiap minggu)</span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {ROUTINE_DAYS.map(item => (
                        <button key={item} type="button" onClick={() => toggleRoutineDay(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${routineDays.includes(item) ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>
                          {ROUTINE_DAY_LABELS[item]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">Mulai (opsional)</span>
                      <Input type="time" value={routineStart} onChange={event => setRoutineStart(event.target.value)} className="mt-1.5" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground">Selesai (opsional)</span>
                      <Input type="time" value={routineEnd} onChange={event => setRoutineEnd(event.target.value)} className="mt-1.5" />
                    </label>
                    <label className="col-span-2 block">
                      <span className="text-xs font-semibold text-muted-foreground">Tempat (opsional)</span>
                      <Input value={routineLocation} onChange={event => setRoutineLocation(event.target.value)} placeholder="Gym FEB, Zoom, sekretariat…" className="mt-1.5" />
                    </label>
                  </div>
                </>
              )}

              {needsCourse && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Mata kuliah</span>
                  <select value={course} onChange={event => setCourse(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                    {courses.length ? courses.map(item => <option key={item} value={item}>{item}</option>) : <option value="">Belum ada mata kuliah</option>}
                  </select>
                </label>
              )}

              {kind === "Note" && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Catatan</span>
                  <Textarea value={body} onChange={event => setBody(event.target.value)} rows={3} placeholder="Poin penting dari kelas…" className="mt-1.5" />
                </label>
              )}

              {kind === "Resource" && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Jenis materi</span>
                  <select value={type} onChange={event => setType(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                    {["Books", "Lecture Slides", "Practice Questions", "Articles", "External References"].map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>
              )}

              {kind === "Study session" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Hari</span>
                    <select value={day} onChange={event => setDay(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                      {dayKeys.map(item => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Tanggal</span>
                    <Input value={due} onChange={event => setDue(event.target.value)} placeholder="2 Oct" className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Jam</span>
                    <Input value={time} onChange={event => setTime(event.target.value)} className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Durasi</span>
                    <Input value={duration} onChange={event => setDuration(event.target.value)} className="mt-1.5" />
                  </label>
                </div>
              )}

              {kind === "Custom course" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Penyelenggara</span>
                    <Input value={provider} onChange={event => setProvider(event.target.value)} placeholder="MOOC, MBKM, exchange…" className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Bobot (SKS)</span>
                    <Input type="number" min={0} value={sks} onChange={event => setSks(event.target.value)} className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Hari</span>
                    <select value={courseDay} onChange={event => setCourseDay(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                      {fullDays.map(item => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Jam</span>
                    <Input value={courseTime} onChange={event => setCourseTime(event.target.value)} className="mt-1.5" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="text-xs font-semibold text-muted-foreground">Ruang atau platform</span>
                    <Input value={room} onChange={event => setRoom(event.target.value)} placeholder="B.211 atau Coursera" className="mt-1.5" />
                  </label>
                </div>
              )}

              {message && <p className="rounded-xl bg-success/10 px-3 py-2 text-xs font-semibold text-success">{message}</p>}

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Tutup</Button>
                <Button variant="academic" onClick={submit}><Plus /> Tambah {label}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
