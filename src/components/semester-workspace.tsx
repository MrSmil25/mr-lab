import { useState } from "react";
import { Archive, ExternalLink, GraduationCap, Link2, Plus, Trash2, UserRound, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LINK_KINDS, courseTitle, type ArchivedSemester, type AssistantSession, type CourseLink, type LinkKind } from "@/data/semester";

const fieldClass = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-academic";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>{children}</label>;
}

/** Semester header: current semester, academic year, credits, and active courses. */
export function SemesterWorkspaceCard({ semester, academicYear, completedSks, totalSks, activeSks, activeCount, onOpenCourses }: {
  semester: number; academicYear: string; completedSks: number; totalSks: number; activeSks: number; activeCount: number; onOpenCourses: () => void;
}) {
  const percent = Math.min(Math.round((completedSks / totalSks) * 100), 100);
  return (
    <section className="academic-card overflow-hidden">
      <div className="h-1.5 bg-academic" />
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground"><GraduationCap className="size-3.5 text-academic" />Ruang Kerja Semester</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Semester {semester}</h2>
            <p className="mt-1 text-sm text-academic">{academicYear}</p>
          </div>
          <button onClick={onOpenCourses} className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-academic">Buka Kelas</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Selesai" value={`${completedSks} / ${totalSks}`} hint="SKS" />
          <Stat label="SKS Berjalan" value={`${activeSks}`} hint="SKS semester ini" />
          <Stat label="Kelas Aktif" value={`${activeCount}`} hint="ruang kelas" />
          <Stat label="Progres Kelulusan" value={`${percent}%`} hint="dari 144 SKS" />
        </div>
        <Progress value={percent} className="mt-5 h-2" />
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg font-bold">{value}</p><p className="text-[10px] text-muted-foreground">{hint}</p></div>;
}

/** Class resource links for one course. */
export function CourseLinksPanel({ code, links, onAdd, onRemove }: {
  code: string; links: CourseLink[]; onAdd: (link: Omit<CourseLink, "id">) => void; onRemove: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LinkKind>("Google Classroom");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const submit = () => {
    const clean = url.trim();
    if (!clean) return;
    onAdd({ code, kind, label: label.trim() || kind, url: clean.startsWith("http") ? clean : `https://${clean}` });
    setLabel(""); setUrl(""); setOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="text-base font-bold">Materi Kelas</h2><p className="mt-1 text-xs text-muted-foreground">Tautan Classroom, Drive, Sheets, LMS, dan asisten untuk kelas ini.</p></div>
        <Button variant={open ? "ghost" : "academic"} size="sm" onClick={() => setOpen((value) => !value)}>{open ? <><X />Batal</> : <><Plus />Tambah Tautan</>}</Button>
      </div>
      {open && (
        <div className="academic-card mb-4 grid gap-3 p-4 sm:grid-cols-3">
          <Field label="Jenis"><select value={kind} onChange={(event) => setKind(event.target.value as LinkKind)} className={fieldClass}>{LINK_KINDS.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
          <Field label="Label"><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="mis. Drive Kelas C" className={fieldClass} /></Field>
          <Field label="URL"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" className={fieldClass} /></Field>
          <div className="sm:col-span-3"><Button variant="academic" size="sm" onClick={submit}>Simpan Tautan</Button></div>
        </div>
      )}
      {links.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <article key={link.id} className="academic-card flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{link.kind}</span>
                <h3 className="mt-2 truncate text-sm font-bold">{link.label}</h3>
                <a href={link.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-academic"><ExternalLink className="size-3.5 shrink-0" />Buka Tautan</a>
              </div>
              <button onClick={() => onRemove(link.id)} aria-label="Hapus tautan" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </article>
          ))}
        </div>
      ) : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada tautan. Tambahkan tautan Classroom, Drive, atau LMS agar bisa dibuka sekali klik.</div>}
    </div>
  );
}

/** Assistant sessions for one course. */
export function AssistantSessionsPanel({ code, section, assistant, sessions, onAdd, onRemove }: {
  code: string; section: string; assistant: string;
  sessions: AssistantSession[]; onAdd: (session: Omit<AssistantSession, "id">) => void; onRemove: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ section, assistant, day: "Friday", start: "13:00", end: "14:30", room: "", link: "" });

  const submit = () => {
    onAdd({ code, ...draft, section: draft.section || section, assistant: draft.assistant.trim() || assistant });
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="text-base font-bold">Sesi Asistensi</h2><p className="mt-1 text-xs text-muted-foreground">Tutorial yang dijalankan asisten dosen, tampil di sini dan di kalender kamu.</p></div>
        <Button variant={open ? "ghost" : "academic"} size="sm" onClick={() => setOpen((value) => !value)}>{open ? <><X />Batal</> : <><Plus />Tambah Sesi</>}</Button>
      </div>
      {open && (
        <div className="academic-card mb-4 grid gap-3 p-4 sm:grid-cols-3">
          <Field label="Kelas"><input value={draft.section} onChange={(event) => setDraft({ ...draft, section: event.target.value.toUpperCase().slice(0, 1) })} className={fieldClass} /></Field>
          <Field label="Nama Asisten"><input value={draft.assistant} onChange={(event) => setDraft({ ...draft, assistant: event.target.value })} className={fieldClass} /></Field>
          <Field label="Hari"><select value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })} className={fieldClass}>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => <option key={day} value={day}>{day}</option>)}</select></Field>
          <Field label="Mulai"><input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} className={fieldClass} /></Field>
          <Field label="Selesai"><input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} className={fieldClass} /></Field>
          <Field label="Ruangan"><input value={draft.room} onChange={(event) => setDraft({ ...draft, room: event.target.value })} placeholder="mis. A212 atau Online" className={fieldClass} /></Field>
          <div className="sm:col-span-3"><Field label="Tautan online (opsional)"><input value={draft.link} onChange={(event) => setDraft({ ...draft, link: event.target.value })} placeholder="https://meet.google.com/…" className={fieldClass} /></Field></div>
          <div className="sm:col-span-3"><Button variant="academic" size="sm" onClick={submit}>Simpan Sesi</Button></div>
        </div>
      )}
      {sessions.length ? <AssistantSessionList sessions={sessions} onRemove={onRemove} /> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada sesi asistensi yang dijadwalkan.</div>}
    </div>
  );
}

export function AssistantSessionList({ sessions, showCourse, onRemove }: { sessions: AssistantSession[]; showCourse?: boolean; onRemove?: (id: number) => void }) {
  return (
    <div className="academic-card divide-y divide-border">
      {sessions.map((session) => (
        <article key={session.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-4 p-4">
          <div><p className="font-display text-sm font-bold text-academic">{session.start}</p><p className="mt-1 text-[10px] text-muted-foreground">until {session.end}</p></div>
          <div className="min-w-0 border-l-2 border-primary pl-4">
            <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">Asisten · Kelas {session.section}</span>
            {showCourse && <h3 className="mt-2 text-sm font-bold">{courseTitle(session.code)}</h3>}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><UserRound className="size-3.5 text-academic" />{session.assistant}</span>
              <span>{session.day} · {session.room || "Ruangan menyusul"}</span>
              {session.link && <a href={session.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-academic"><Video className="size-3.5" />Gabung online</a>}
            </div>
          </div>
          {onRemove && <button onClick={() => onRemove(session.id)} aria-label="Hapus sesi" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>}
        </article>
      ))}
    </div>
  );
}

/** Semester history: courses, credits, GPA, resources, notes, completed tasks. */
export function SemesterArchivePanel({ archive, suggestion, onAdd, onRemove }: {
  archive: ArchivedSemester[];
  suggestion: { semester: number; academicYear: string; courses: string[]; sks: number; resources: number; completedTasks: number };
  onAdd: (entry: Omit<ArchivedSemester, "id">) => void;
  onRemove: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [gpa, setGpa] = useState("3.50");
  const [notes, setNotes] = useState("");

  const submit = () => {
    onAdd({ ...suggestion, gpa: Number(gpa) || 0, notes: notes.trim() });
    setNotes(""); setOpen(false);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-base font-bold"><Archive className="size-4 text-academic" />Arsip Semester</h2><p className="mt-1 text-xs text-muted-foreground">Tutup semester untuk menyimpan mata kuliah, SKS, IP, dan catatannya dalam perjalanan akademik kamu.</p></div>
        <Button variant={open ? "ghost" : "academic"} size="sm" onClick={() => setOpen((value) => !value)}>{open ? <><X />Batal</> : <><Plus />Arsipkan Semester</>}</Button>
      </div>
      {open && (
        <div className="academic-card mb-4 grid gap-3 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">Semester {suggestion.semester} · {suggestion.academicYear} · {suggestion.courses.length} mata kuliah · {suggestion.sks} SKS · {suggestion.resources} materi · {suggestion.completedTasks} tugas selesai</div>
          <Field label="IP Semester"><input value={gpa} onChange={(event) => setGpa(event.target.value)} inputMode="decimal" className={fieldClass} /></Field>
          <Field label="Catatan Refleksi"><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Apa yang berhasil semester ini?" className={fieldClass} /></Field>
          <div className="sm:col-span-2"><Button variant="academic" size="sm" onClick={submit}>Simpan ke Arsip</Button></div>
        </div>
      )}
      {archive.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {archive.map((entry) => (
            <article key={entry.id} className="academic-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-semibold text-academic">{entry.academicYear}</p><h3 className="mt-1 font-display text-lg font-bold">Semester {entry.semester}</h3></div>
                <div className="flex items-start gap-3"><span className="rounded-lg bg-academic px-2.5 py-1 text-xs font-semibold text-academic-foreground">IP {entry.gpa.toFixed(2)}</span><button onClick={() => onRemove(entry.id)} aria-label="Hapus arsip" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat label="SKS" value={`${entry.sks}`} hint="SKS" />
                <Stat label="Materi" value={`${entry.resources}`} hint="tersimpan" />
                <Stat label="Tugas" value={`${entry.completedTasks}`} hint="selesai" />
              </div>
              <ul className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                {entry.courses.map((code) => <li key={code} className="flex items-center gap-2"><Link2 className="size-3 shrink-0 text-academic" /><span className="truncate">{courseTitle(code)}</span></li>)}
              </ul>
              {entry.notes && <p className="mt-3 rounded-xl bg-muted p-3 text-xs italic text-muted-foreground">“{entry.notes}”</p>}
            </article>
          ))}
        </div>
      ) : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada semester yang diarsipkan. Riwayat kamu akan terbentuk setiap kali menutup semester.</div>}
    </section>
  );
}
