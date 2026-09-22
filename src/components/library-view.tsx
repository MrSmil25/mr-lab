import { useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronRight, Clock3, Download, ExternalLink, FileText,
  GraduationCap, Library, Link2, MapPin, NotebookPen, Paperclip, Plus, Repeat2, Save, Search, Trash2, UserRound, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import type { LibraryCourse, LibraryEntry, NoteEntry } from "@/data/academic";
import { ORGANIZATION_ITEM_TYPES, type Organization, type OrganizationItem, type OrganizationItemType } from "@/data/organizations";

type ResourceType = "Books" | "Lecture Slides" | "Practice Questions" | "Articles" | "External References" | "Files";
type WorkType = "Class summary" | "Personal note" | "Exercise answers" | "Project file" | "Study reflection";

type ArchiveItem = {
  id: number;
  title: string;
  description: string;
  type: string;
  kind: "file" | "link";
  meta?: string;
  url?: string;
};

type ArchiveNote = {
  id: number;
  title: string;
  topic: string;
  body: string;
  attachment?: string;
  link?: string;
};

type ClassLink = { id: number; title: string; url: string; category: string };

type ArchiveCourse = {
  code: string;
  title: string;
  sks: number;
  lecturer: string;
  assistant: string;
  day: string;
  time: string;
  room: string;
  accent: string;
  syllabus: string;
  links: ClassLink[];
  materials: ArchiveItem[];
  work: ArchiveItem[];
  notes: ArchiveNote[];
};

type Semester = { id: string; label: string; period: string; status: "Current" | "Archived"; courses: ArchiveCourse[] };

const resourceTypes: ResourceType[] = ["Books", "Lecture Slides", "Practice Questions", "Articles", "External References", "Files"];
const workTypes: WorkType[] = ["Class summary", "Personal note", "Exercise answers", "Project file", "Study reflection"];

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
};
const isValidUrl = (value: string) => {
  try {
    const url = new URL(normalizeUrl(value));
    return url.hostname.includes(".") && url.hostname.length > 3;
  } catch {
    return false;
  }
};
const hostOf = (url?: string) => {
  try {
    return new URL(url ?? "").hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
};
const formatSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const semesters: Semester[] = [];

const field = "w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

/** Turns the student's real course library into the archive shape this page renders. */
function buildLiveSemesters(library: LibraryData): Semester[] {
  const accents = ["bg-primary", "bg-academic", "bg-success", "bg-warning"];
  const bySemester = new Map<number, LibraryCourse[]>();
  for (const course of library.courses) {
    const key = course.semester ?? 0;
    bySemester.set(key, [...(bySemester.get(key) ?? []), course]);
  }
  return [...bySemester.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([semester, list], index) => ({
      id: `semester-${semester}`,
      label: semester ? `Semester ${semester}` : "Semester belum terjadwal",
      period: "Dari riwayat akademik kamu",
      status: index === 0 ? ("Current" as const) : ("Archived" as const),
      courses: list.map((course, position) => ({
        code: course.code,
        title: course.name,
        sks: course.sks,
        lecturer: "",
        assistant: "",
        day: "",
        time: "",
        room: "",
        accent: accents[position % accents.length] ?? "bg-academic",
        syllabus: "",
        links: library.resources
          .filter(item => item.courseId === course.courseId && item.url)
          .map((item, id) => ({ id: id + 1, title: item.title, url: item.url, category: item.kind })),
        materials: library.resources
          .filter(item => item.courseId === course.courseId)
          .map((item, id) => ({ id: id + 1, title: item.title, description: item.description, type: item.kind, kind: item.url ? ("link" as const) : ("file" as const), ...(item.url ? { url: item.url } : {}) })),
        work: library.files
          .filter(item => item.courseId === course.courseId)
          .map((item, id) => ({ id: id + 1, title: item.title, description: "", type: item.kind, kind: "file" as const })),
        notes: library.notes
          .filter(item => item.courseId === course.courseId)
          .map((item, id) => ({ id: id + 1, title: item.title, topic: item.topic, body: item.body, ...(item.attachment ? { attachment: item.attachment } : {}) })),
      })),
    }));
}

export type LibraryData = {
  courses: LibraryCourse[];
  resources: LibraryEntry[];
  files: LibraryEntry[];
  notes: NoteEntry[];
  loading: boolean;
};

type OrganizationActions = {
  addOrganization: (name: string, role: string) => number;
  removeOrganization: (id: number) => void;
  addItem: (organizationId: number, item: Omit<OrganizationItem, "id">) => void;
  removeItem: (organizationId: number, itemId: number) => void;
  toggleItem: (organizationId: number, itemId: number) => void;
};

export function LibraryView({ library, organizations, organizationActions }: { library?: LibraryData; organizations: Organization[]; organizationActions: OrganizationActions }) {
  const live = useMemo(() => (library && library.courses.length ? buildLiveSemesters(library) : null), [library]);
  const [overrides, setOverrides] = useState<Semester[] | null>(null);
  const [semesterId, setSemesterId] = useState<string | null>(null);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [space, setSpace] = useState<"academic" | "organization" | null>(null);

  const data = overrides ?? live ?? (library && !library.loading ? [] : semesters);
  const setData = (updater: (items: Semester[]) => Semester[]) => setOverrides(updater(data));
  const semester = data.find(item => item.id === semesterId) ?? data[0] ?? null;
  const course = semester?.courses.find(item => item.code === openCode) ?? null;

  const summary = useMemo(() => {
    if (!semester) return { courses: 0, resources: 0, notes: 0 };
    const resources = semester.courses.reduce((total, item) => total + item.materials.length + item.work.length + item.links.length, 0);
    const notes = semester.courses.reduce((total, item) => total + item.notes.length, 0);
    return { courses: semester.courses.length, resources, notes };
  }, [semester]);

  const updateCourse = (code: string, patch: Partial<ArchiveCourse>) =>
    setData(items => items.map(item => item.id !== semester?.id ? item : { ...item, courses: item.courses.map(entry => entry.code === code ? { ...entry, ...patch } : entry) }));

  if (!space) return <LibraryChoice onSelect={setSpace} />;

  if (space === "organization") return <OrganizationLibrary organizations={organizations} actions={organizationActions} onBack={() => setSpace(null)} />;

  if (course && semester) return <CourseArchive course={course} semester={semester} onBack={() => setOpenCode(null)} updateCourse={patch => updateCourse(course.code, patch)} />;

  if (!semester) return <div>
    <Button variant="ghost" size="sm" onClick={() => setSpace(null)} className="mb-5"><ArrowLeft /> Pilih pustaka lain</Button>
    <div className="mb-7">
      <p className="text-sm text-academic">Arsip pengetahuan</p>
      <h1 className="mt-1 text-2xl font-bold md:text-3xl">Perpustakaan Akademik</h1>
    </div>
    <EmptyState
      icon={Library}
      eyebrow="Perpustakaan"
      title="Belum ada materi kuliah"
      description="Setelah mata kuliah menjadi bagian dari riwayat akademik kamu, setiap materi, berkas, dan catatan yang disimpan akan muncul di sini, dikelompokkan per semester."
      hints={["Tambahkan mata kuliah lewat perencana KRS", "Materi dan catatan dibagi per mata kuliah"]}
    />
  </div>;

  const visible = semester.courses.filter(item => `${item.title} ${item.code} ${item.lecturer}`.toLowerCase().includes(query.toLowerCase()));

  return <div>
    <Button variant="ghost" size="sm" onClick={() => setSpace(null)} className="mb-5"><ArrowLeft /> Pilih pustaka lain</Button>
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 md:hidden">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase text-academic">Arsip pengetahuan</p>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold leading-8">Perpustakaan Akademik</h1>
      </div>
    </div>
    <div className="mb-7 hidden items-end justify-between md:flex">
      <div><p className="text-sm text-academic">Arsip pengetahuan</p><h1 className="mt-1 text-3xl font-bold">Perpustakaan Akademik</h1></div>
      <p className="text-sm text-muted-foreground">{semester.label}</p>
    </div>

    <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {data.map(item => <button key={item.id} onClick={() => setSemesterId(item.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${item.id === semesterId ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{item.label}</button>)}
    </div>

    <section className="academic-card mb-6 overflow-hidden">
      <div className="h-2 bg-primary" />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold">{semester.label}</h2>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${semester.status === "Current" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}>{semester.status}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{semester.period}</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[{ label: "Mata Kuliah", value: summary.courses, icon: GraduationCap }, { label: "Materi", value: summary.resources, icon: Library }, { label: "Catatan Pribadi", value: summary.notes, icon: NotebookPen }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl bg-muted p-3">
            <Icon className="size-4 text-academic" />
            <p className="mt-3 text-lg font-bold">{value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
          </div>)}
        </div>
      </div>
    </section>

    <label className="mb-5 flex items-center gap-3 rounded-xl border border-input bg-surface px-4 py-3">
      <Search className="size-4 text-muted-foreground" />
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari mata kuliah di semester ini" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
    </label>

    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-bold md:text-lg">Arsip Mata Kuliah</h2></div>
    <div className="grid gap-3 md:grid-cols-2">
      {visible.map(item => <button key={item.code} onClick={() => setOpenCode(item.code)} className="academic-card overflow-hidden text-left">
        <div className={`h-1.5 ${item.accent}`} />
        <div className="p-5">
          <p className="text-xs font-semibold uppercase text-academic">{item.code}</p>
          <h3 className="mt-2 text-sm font-bold leading-6">{item.title}</h3>
          <p className="mt-2 text-xs text-muted-foreground">{item.sks} SKS · {item.lecturer}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{item.materials.length + item.work.length + item.links.length} materi · {item.notes.length} catatan</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-academic">Buka arsip <ChevronRight className="size-4" /></span>
          </div>
        </div>
      </button>)}
      {!visible.length && <div className="md:col-span-2"><EmptyState
        icon={Search}
        eyebrow="Arsip semester"
        title={query ? `Tidak ada mata kuliah yang cocok dengan “${query}”` : "Belum ada mata kuliah yang diarsipkan di semester ini"}
        description="Mata kuliah yang diarsipkan menyimpan semua materi, catatan, dan tautan dari semester yang sudah selesai. Cari berdasarkan nama, kode, atau nama dosen."
        actions={query ? [{ label: "Hapus pencarian", onClick: () => setQuery("") }] : []}
        hints={["Coba kode mata kuliah seperti ECMN600020", "Setiap arsip menyimpan materi, tugas pribadi, tautan, dan catatan"]}
        compact
      /></div>}
    </div>
  </div>;
}

function LibraryChoice({ onSelect }: { onSelect: (space: "academic" | "organization") => void }) {
  return <div>
    <div className="mb-7">
      <p className="text-sm text-academic">Pilih ruang pustaka</p>
      <h1 className="mt-1 text-2xl font-bold md:text-3xl">Apa yang ingin kamu buka?</h1>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <button type="button" onClick={() => onSelect("academic")} className="academic-card group p-6 text-left transition-transform hover:-translate-y-0.5">
        <div className="grid size-11 place-items-center rounded-lg bg-accent text-academic"><GraduationCap className="size-5" /></div>
        <h2 className="mt-5 text-lg font-bold">Akademik</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Materi, tautan kelas, tugas, dan catatan yang tersusun berdasarkan semester.</p>
        <span className="mt-5 flex items-center justify-between text-sm font-semibold text-academic">Buka pustaka akademik <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </button>
      <button type="button" onClick={() => onSelect("organization")} className="academic-card group p-6 text-left transition-transform hover:-translate-y-0.5">
        <div className="grid size-11 place-items-center rounded-lg bg-primary/25 text-academic"><Building2 className="size-5" /></div>
        <h2 className="mt-5 text-lg font-bold">Organisasi</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Ruang opsional untuk tautan, tugas, rutinitas, rapat rutin, SOP, dan catatan organisasi.</p>
        <span className="mt-5 flex items-center justify-between text-sm font-semibold text-academic">Buka pustaka organisasi <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </button>
    </div>
  </div>;
}

const recurringTypes: OrganizationItemType[] = ["Rutinitas harian", "Rutinitas mingguan", "Rapat rutin"];

function OrganizationLibrary({ organizations, actions, onBack }: { organizations: Organization[]; actions: OrganizationActions; onBack: () => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(organizations[0]?.id ?? null);
  const [addingOrganization, setAddingOrganization] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [organizationDraft, setOrganizationDraft] = useState({ name: "", role: "" });
  const [itemDraft, setItemDraft] = useState({ type: "Tautan" as OrganizationItemType, title: "", description: "", url: "", day: "Monday", start: "", end: "", room: "" });
  const selected = organizations.find((item) => item.id === selectedId) ?? organizations[0] ?? null;
  const needsSchedule = recurringTypes.includes(itemDraft.type);
  const invalidUrl = itemDraft.url.trim().length > 0 && !isValidUrl(itemDraft.url);

  const saveOrganization = () => {
    if (!organizationDraft.name.trim()) return;
    const id = actions.addOrganization(organizationDraft.name, organizationDraft.role);
    setSelectedId(id);
    setOrganizationDraft({ name: "", role: "" });
    setAddingOrganization(false);
  };
  const saveItem = () => {
    if (!selected || !itemDraft.title.trim() || invalidUrl) return;
    actions.addItem(selected.id, {
      type: itemDraft.type,
      title: itemDraft.title.trim(),
      description: itemDraft.description.trim(),
      ...(itemDraft.url.trim() ? { url: normalizeUrl(itemDraft.url) } : {}),
      ...(needsSchedule ? { day: itemDraft.type === "Rutinitas harian" ? "Everyday" : itemDraft.day, start: itemDraft.start, end: itemDraft.end, room: itemDraft.room.trim() } : {}),
      ...(itemDraft.type === "Tugas" ? { done: false } : {}),
    });
    setItemDraft({ type: "Tautan", title: "", description: "", url: "", day: "Monday", start: "", end: "", room: "" });
    setAddingItem(false);
  };

  return <div>
    <Button variant="ghost" size="sm" onClick={onBack} className="mb-5"><ArrowLeft /> Pilih pustaka lain</Button>
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm text-academic">Ruang kegiatan</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">Pustaka Organisasi</h1><p className="mt-2 text-sm text-muted-foreground">Opsional dan sepenuhnya kamu susun sendiri.</p></div>
      <Button variant="yellow" onClick={() => setAddingOrganization(true)}><Plus /> Tambah organisasi</Button>
    </div>

    {addingOrganization && <section className="academic-card mb-6 grid gap-3 p-5 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Nama organisasi</span><input autoFocus value={organizationDraft.name} onChange={event => setOrganizationDraft(current => ({ ...current, name: event.target.value }))} placeholder="Nama organisasi" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Peran (opsional)</span><input value={organizationDraft.role} onChange={event => setOrganizationDraft(current => ({ ...current, role: event.target.value }))} placeholder="Contoh: Staf acara" className={field} /></label>
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={saveOrganization}><Save /> Simpan</Button><Button variant="ghost" size="sm" onClick={() => setAddingOrganization(false)}><X /> Batal</Button></div>
    </section>}

    {!organizations.length ? <EmptyState icon={Building2} eyebrow="Pustaka organisasi" title="Belum ada organisasi" description="Tambahkan organisasi jika kamu ingin menyimpan pekerjaan, rapat, rutinitas, tautan, atau SOP di MR Labs." actions={[{ label: "Tambah organisasi", icon: Plus, onClick: () => setAddingOrganization(true) }]} hints={["Bagian ini opsional", "Setiap akun memiliki ruang organisasinya sendiri"]} /> : <>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {organizations.map((organization) => <Button key={organization.id} variant={organization.id === selected?.id ? "academic" : "secondary"} size="sm" onClick={() => setSelectedId(organization.id)}>{organization.name}</Button>)}
      </div>
      {selected && <>
        <section className="academic-card mb-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase text-academic">Organisasi</p><h2 className="mt-1 text-xl font-bold">{selected.name}</h2>{selected.role && <p className="mt-1 text-sm text-muted-foreground">{selected.role}</p>}</div>
            <div className="flex gap-2"><Button variant="yellow" size="sm" onClick={() => setAddingItem(value => !value)}><Plus /> Tambah isi</Button><Button variant="ghost" size="icon" aria-label="Hapus organisasi" onClick={() => { actions.removeOrganization(selected.id); setSelectedId(null); }}><Trash2 /></Button></div>
          </div>
        </section>

        {addingItem && <section className="academic-card mb-6 grid gap-3 p-5 sm:grid-cols-2">
          <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Jenis</span><select value={itemDraft.type} onChange={event => setItemDraft(current => ({ ...current, type: event.target.value as OrganizationItemType }))} className={field}>{ORGANIZATION_ITEM_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Judul</span><input value={itemDraft.title} onChange={event => setItemDraft(current => ({ ...current, title: event.target.value }))} placeholder="Judul kegiatan atau dokumen" className={field} /></label>
          <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Deskripsi (opsional)</span><textarea value={itemDraft.description} onChange={event => setItemDraft(current => ({ ...current, description: event.target.value }))} rows={3} placeholder="Catatan singkat" className={field} /></label>
          <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tautan (opsional)</span><input value={itemDraft.url} onChange={event => setItemDraft(current => ({ ...current, url: event.target.value }))} placeholder="docs.google.com/…" className={field} /></label>
          {needsSchedule && <>
            {itemDraft.type !== "Rutinitas harian" && <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Hari</span><select value={itemDraft.day} onChange={event => setItemDraft(current => ({ ...current, day: event.target.value }))} className={field}>{[["Monday", "Senin"], ["Tuesday", "Selasa"], ["Wednesday", "Rabu"], ["Thursday", "Kamis"], ["Friday", "Jumat"], ["Saturday", "Sabtu"], ["Sunday", "Minggu"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Mulai</span><input type="time" value={itemDraft.start} onChange={event => setItemDraft(current => ({ ...current, start: event.target.value }))} className={field} /></label>
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Selesai (opsional)</span><input type="time" value={itemDraft.end} onChange={event => setItemDraft(current => ({ ...current, end: event.target.value }))} className={field} /></label>
            <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tempat / media (opsional)</span><input value={itemDraft.room} onChange={event => setItemDraft(current => ({ ...current, room: event.target.value }))} placeholder="Sekretariat atau Zoom" className={field} /></label>
          </>}
          {invalidUrl && <p className="text-xs font-medium text-destructive sm:col-span-2">Masukkan alamat tautan yang valid.</p>}
          <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={saveItem}><Save /> Simpan isi</Button><Button variant="ghost" size="sm" onClick={() => setAddingItem(false)}><X /> Batal</Button></div>
        </section>}

        <div className="grid gap-3 md:grid-cols-2">
          {selected.items.map((item) => <OrganizationItemCard key={item.id} item={item} onToggle={() => actions.toggleItem(selected.id, item.id)} onRemove={() => actions.removeItem(selected.id, item.id)} />)}
          {!selected.items.length && <div className="md:col-span-2"><EmptyState icon={FileText} eyebrow={selected.name} title="Ruang organisasi masih kosong" description="Tambahkan tautan, tugas, rutinitas, rapat rutin, SOP, atau catatan lain yang ingin kamu kelola." actions={[{ label: "Tambah isi pertama", icon: Plus, onClick: () => setAddingItem(true) }]} compact /></div>}
        </div>
      </>}
    </>}
  </div>;
}

function OrganizationItemCard({ item, onToggle, onRemove }: { item: OrganizationItem; onToggle: () => void; onRemove: () => void }) {
  const Icon = item.type === "Tugas" ? CheckCircle2 : recurringTypes.includes(item.type) ? Repeat2 : item.type === "Tautan" ? Link2 : FileText;
  const day = item.day === "Everyday" ? "Setiap hari" : item.day ? ({ Monday: "Senin", Tuesday: "Selasa", Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat", Saturday: "Sabtu", Sunday: "Minggu" } as Record<string, string>)[item.day] ?? item.day : "";
  return <article className={`academic-card p-4 ${item.done ? "opacity-60" : ""}`}>
    <div className="flex items-start gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-academic"><Icon className="size-5" /></div>
      <div className="min-w-0 flex-1"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{item.type}</span><h3 className="mt-2 text-sm font-bold">{item.title}</h3>{item.description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>}</div>
      <Button variant="ghost" size="icon" aria-label={`Hapus ${item.title}`} onClick={onRemove}><Trash2 /></Button>
    </div>
    {(day || item.start || item.room) && <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3 text-xs text-muted-foreground">{day && <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{day}</span>}{item.start && <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{item.start}{item.end ? ` – ${item.end}` : ""}</span>}{item.room && <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{item.room}</span>}</div>}
    <div className="mt-3 flex gap-2">{item.url && <Button asChild variant="secondary" size="sm"><a href={item.url} target="_blank" rel="noreferrer"><ExternalLink /> Buka tautan</a></Button>}{item.type === "Tugas" && <Button variant={item.done ? "secondary" : "academic"} size="sm" onClick={onToggle}><CheckCircle2 /> {item.done ? "Sudah selesai" : "Tandai selesai"}</Button>}</div>
  </article>;
}

function CourseArchive({ course, semester, onBack, updateCourse }: { course: ArchiveCourse; semester: Semester; onBack: () => void; updateCourse: (patch: Partial<ArchiveCourse>) => void }) {
  return <div>
    <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-semibold text-academic"><ArrowLeft className="size-4" />Kembali ke perpustakaan</button>

    <header className="academic-card mb-6 overflow-hidden">
      <div className={`h-2 ${course.accent}`} />
      <div className="p-5 md:p-6">
        <p className="text-xs font-semibold uppercase text-academic">{course.code} · {semester.label}</p>
        <h1 className="mt-2 text-xl font-bold md:text-2xl">{course.title}</h1>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-2"><UserRound className="size-4 shrink-0 text-academic" />{course.lecturer}</span>
          <span className="flex items-center gap-2"><UserRound className="size-4 shrink-0 text-academic" />Asisten · {course.assistant}</span>
        </div>
      </div>
    </header>

    <Tabs defaultValue="info">
      <TabsList className="mb-5 w-full justify-start overflow-x-auto">
        <TabsTrigger value="info">Informasi</TabsTrigger>
        <TabsTrigger value="links">Tautan Kelas</TabsTrigger>
        <TabsTrigger value="materials">Materi</TabsTrigger>
        <TabsTrigger value="work">Tugas Saya</TabsTrigger>
        <TabsTrigger value="notes">Catatan</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <section className="academic-card p-5">
          <h2 className="text-base font-bold">Informasi Mata Kuliah</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{course.syllabus}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { icon: GraduationCap, label: "SKS", value: `${course.sks} SKS` },
              { icon: CalendarDays, label: "Jadwal", value: `${course.day} · ${course.time}` },
              { icon: MapPin, label: "Ruangan", value: course.room },
              { icon: UserRound, label: "Asisten", value: course.assistant },
            ].map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 rounded-xl bg-muted p-3">
              <Icon className="size-4 shrink-0 text-academic" />
              <div className="min-w-0"><p className="text-[11px] text-muted-foreground">{label}</p><p className="truncate text-sm font-semibold">{value}</p></div>
            </div>)}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="links">
        <ClassLinksPanel links={course.links} onChange={links => updateCourse({ links })} />
      </TabsContent>

      <TabsContent value="materials">
        <ItemPanel
          title="Materi Pembelajaran" subtitle="Buku, slide, soal latihan, artikel, dan referensi."
          items={course.materials} types={resourceTypes} onChange={materials => updateCourse({ materials })}
        />
      </TabsContent>

      <TabsContent value="work">
        <ItemPanel
          title="Tugas Saya" subtitle="Rangkuman, jawaban, berkas proyek, dan refleksi yang kamu buat."
          items={course.work} types={workTypes} onChange={work => updateCourse({ work })}
        />
      </TabsContent>

      <TabsContent value="notes">
        <NotesPanel notes={course.notes} onChange={notes => updateCourse({ notes })} />
      </TabsContent>
    </Tabs>
  </div>;
}

function ClassLinksPanel({ links, onChange }: { links: ClassLink[]; onChange: (links: ClassLink[]) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Google Drive");
  const invalid = url.trim().length > 0 && !isValidUrl(url);

  const save = () => {
    if (!isValidUrl(url)) return;
    onChange([...links, { id: Date.now(), title: title.trim() || hostOf(normalizeUrl(url)), url: normalizeUrl(url), category }]);
    setTitle(""); setUrl(""); setOpen(false);
  };

  return <section className="academic-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold">Tautan Kelas</h2><p className="mt-1 text-xs text-muted-foreground">Drive, sheet, classroom, dan ruang pertemuan untuk mata kuliah ini.</p></div>
      <Button variant="yellow" size="sm" onClick={() => setOpen(value => !value)}><Plus /> Tambah Tautan</Button>
    </div>

    {open && <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-input p-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Judul</span><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Google Drive Mata Kuliah" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Kategori</span><select value={category} onChange={e => setCategory(e.target.value)} className={field}>{["Google Drive", "Google Sheets", "Classroom", "LMS", "Zoom", "Notion", "Website"].map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">URL</span><input value={url} onChange={e => setUrl(e.target.value)} placeholder="drive.google.com/…" className={field} /></label>
      {invalid && <p className="text-xs font-medium text-destructive sm:col-span-2">Masukkan alamat yang valid, mis. drive.google.com/drive/folders/123</p>}
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={save}><Save /> Simpan Tautan</Button><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Batal</Button></div>
    </div>}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {links.length ? links.map(link => <article key={link.id} className="rounded-xl border border-border bg-muted p-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-academic"><Link2 className="size-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{link.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground"><span className="rounded-full bg-background px-2 py-0.5">{link.category}</span>{hostOf(link.url)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><ExternalLink className="size-3.5" />Buka Tautan</a>
          <button onClick={() => onChange(links.filter(item => item.id !== link.id))} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"><Trash2 className="size-3.5" />Hapus</button>
        </div>
      </article>) : <div className="sm:col-span-2"><EmptyState
        icon={Link2}
        eyebrow="Tautan Kelas"
        title="Simpan semua tautan kelas di satu tempat"
        description="Simpan Google Drive mata kuliah, spreadsheet kelas, halaman LMS, atau ruang pertemuan rutin agar tidak perlu mencari lagi di riwayat chat."
        actions={[{ label: "Tambah tautan pertama", icon: Plus, onClick: () => setOpen(true) }]}
        hints={["Drive dan Sheets untuk materi bersama", "Zoom atau Classroom untuk sesi mingguan"]}
        compact
      /></div>}
    </div>
  </section>;
}

function ItemPanel({ title, subtitle, items, types, onChange }: { title: string; subtitle: string; items: ArchiveItem[]; types: string[]; onChange: (items: ArchiveItem[]) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [draft, setDraft] = useState({ title: "", description: "", type: types[0]!, url: "" });
  const [file, setFile] = useState<{ name: string; meta: string; url: string } | null>(null);
  const invalid = draft.url.trim().length > 0 && !isValidUrl(draft.url);

  const save = () => {
    if (!draft.title.trim()) return;
    if (draft.url.trim() && !isValidUrl(draft.url)) return;
    const item: ArchiveItem = draft.url.trim()
      ? { id: Date.now(), title: draft.title.trim(), description: draft.description.trim() || "External reference.", type: draft.type, kind: "link", url: normalizeUrl(draft.url) }
      : { id: Date.now(), title: draft.title.trim(), description: draft.description.trim() || "Saved resource.", type: draft.type, kind: "file", meta: file?.meta ?? "File", url: file?.url ?? "" };
    onChange([item, ...items]);
    setDraft({ title: "", description: "", type: types[0]!, url: "" });
    setFile(null);
    setOpen(false);
  };

  const shown = filter === "All" ? items : items.filter(item => item.type === filter);

  return <section className="academic-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div>
      <Button variant="yellow" size="sm" onClick={() => setOpen(value => !value)}><Plus /> Tambah Materi</Button>
    </div>

    <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {["All", ...types].map(item => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === item ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{item}</button>)}
    </div>

    {open && <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-input p-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Judul</span><input autoFocus value={draft.title} onChange={e => setDraft(current => ({ ...current, title: e.target.value }))} placeholder="Judul materi" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Jenis</span><select value={draft.type} onChange={e => setDraft(current => ({ ...current, type: e.target.value }))} className={field}>{types.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Deskripsi</span><textarea value={draft.description} onChange={e => setDraft(current => ({ ...current, description: e.target.value }))} rows={2} placeholder="Untuk apa materi ini?" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">URL Eksternal</span><input value={draft.url} onChange={e => setDraft(current => ({ ...current, url: e.target.value }))} placeholder="lib.ui.ac.id/…" className={field} /></label>
      <label className="flex flex-col"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Unggah Berkas</span>
        <span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground">
          <Paperclip className="size-4 shrink-0 text-academic" />
          <span className="min-w-0 flex-1 truncate">{file?.name ?? "Unggah berkas"}</span>
          <input type="file" className="sr-only" onChange={e => { const picked = e.target.files?.[0]; if (picked) setFile({ name: picked.name, meta: `${picked.name.split(".").pop()?.toUpperCase() ?? "FILE"} · ${formatSize(picked.size)}`, url: URL.createObjectURL(picked) }); e.target.value = ""; }} />
        </span>
      </label>
      {invalid && <p className="text-xs font-medium text-destructive sm:col-span-2">Masukkan alamat yang valid, mis. drive.google.com/file/123</p>}
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={save}><Save /> Simpan Materi</Button><Button variant="ghost" size="sm" onClick={() => setOpen(false)}><X /> Batal</Button></div>
    </div>}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {shown.length ? shown.map(item => <article key={item.id} className="rounded-xl border border-border bg-muted p-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-academic">{item.kind === "link" ? <Link2 className="size-5" /> : item.type === "Books" ? <BookOpen className="size-5" /> : <FileText className="size-5" />}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground"><span className="rounded-full bg-background px-2 py-0.5">{item.type}</span>{item.kind === "link" ? hostOf(item.url) : item.meta}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {item.kind === "link"
            ? <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><ExternalLink className="size-3.5" />Buka Tautan</a>
            : <a href={item.url || "#"} download={item.title} className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><Download className="size-3.5" />Unduh</a>}
          <button onClick={() => onChange(items.filter(entry => entry.id !== item.id))} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"><Trash2 className="size-3.5" />Hapus</button>
        </div>
      </article>) : <div className="sm:col-span-2"><EmptyState
        icon={FileText}
        eyebrow={title}
        title={filter === "All" ? `Mulai bangun ${title.toLowerCase()} kamu` : `Belum ada yang disimpan di ${filter}`}
        description={subtitle}
        actions={[
          { label: "Tambah materi", icon: Plus, onClick: () => setOpen(true) },
          ...(filter === "All" ? [] : [{ label: "Tampilkan semua jenis", onClick: () => setFilter("All") }]),
        ]}
        hints={["Unggah berkas atau tempel tautan — keduanya dapat dicari", "Beri deskripsi singkat pada setiap item agar mudah diingat"]}
        compact
      /></div>}
    </div>
  </section>;
}

function NotesPanel({ notes, onChange }: { notes: ArchiveNote[]; onChange: (notes: ArchiveNote[]) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", topic: "", body: "", link: "" });
  const [attachment, setAttachment] = useState("");
  const invalid = draft.link.trim().length > 0 && !isValidUrl(draft.link);

  const save = () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    if (draft.link.trim() && !isValidUrl(draft.link)) return;
    const note: ArchiveNote = {
      id: Date.now(), title: draft.title.trim(), topic: draft.topic.trim() || "General", body: draft.body.trim(),
      ...(attachment ? { attachment } : {}),
      ...(draft.link.trim() ? { link: normalizeUrl(draft.link) } : {}),
    };
    onChange([note, ...notes]);
    setDraft({ title: "", topic: "", body: "", link: "" });
    setAttachment("");
    setOpen(false);
  };

  return <section className="academic-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold">Catatan</h2><p className="mt-1 text-xs text-muted-foreground">Catatan pengetahuan kamu, dengan berkas dan tautan terkait.</p></div>
      <Button variant="yellow" size="sm" onClick={() => setOpen(value => !value)}><Plus /> Catatan Baru</Button>
    </div>

    {open && <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-input p-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Judul</span><input autoFocus value={draft.title} onChange={e => setDraft(current => ({ ...current, title: e.target.value }))} placeholder="Judul catatan" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Topik</span><input value={draft.topic} onChange={e => setDraft(current => ({ ...current, topic: e.target.value }))} placeholder="Minggu 5" className={field} /></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Catatan</span><textarea value={draft.body} onChange={e => setDraft(current => ({ ...current, body: e.target.value }))} rows={4} placeholder="Tulis catatan belajar kamu…" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tautan terkait</span><input value={draft.link} onChange={e => setDraft(current => ({ ...current, link: e.target.value }))} placeholder="notion.so/…" className={field} /></label>
      <label className="flex flex-col"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Lampiran</span>
        <span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground">
          <Paperclip className="size-4 shrink-0 text-academic" />
          <span className="min-w-0 flex-1 truncate">{attachment || "Lampirkan berkas"}</span>
          <input type="file" className="sr-only" onChange={e => { const picked = e.target.files?.[0]; if (picked) setAttachment(picked.name); e.target.value = ""; }} />
        </span>
      </label>
      {invalid && <p className="text-xs font-medium text-destructive sm:col-span-2">Masukkan alamat yang valid untuk tautan terkait.</p>}
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={save}><Save /> Simpan Catatan</Button><Button variant="ghost" size="sm" onClick={() => setOpen(false)}><X /> Batal</Button></div>
    </div>}

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {notes.length ? notes.map(note => <article key={note.id} className="rounded-xl border border-border bg-muted p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="truncate text-sm font-bold">{note.title}</h3><p className="mt-1 text-[10px] font-semibold uppercase text-academic">{note.topic}</p></div>
          <button onClick={() => onChange(notes.filter(item => item.id !== note.id))} className="text-muted-foreground" aria-label="Hapus catatan"><Trash2 className="size-4" /></button>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{note.body}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {note.attachment && <span className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><Paperclip className="size-3.5" />{note.attachment}</span>}
          {note.link && <a href={note.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><ExternalLink className="size-3.5" />Buka Sumber</a>}
        </div>
      </article>) : <div className="md:col-span-2"><EmptyState
        icon={NotebookPen}
        eyebrow="Catatan"
        title="Pemahaman kamu tersimpan di sini"
        description="Tulis apa yang kamu pahami dengan kata-katamu sendiri setelah setiap sesi. Catatan bisa memiliki lampiran dan tautan terkait, dan akan muncul di pencarian global."
        actions={[{ label: "Tulis catatan pertama", icon: Plus, onClick: () => setOpen(true) }]}
        hints={["Satu catatan per topik atau minggu paling efektif", "Lampirkan slide atau bacaan sumbernya"]}
        compact
      /></div>}
    </div>
  </section>;
}
