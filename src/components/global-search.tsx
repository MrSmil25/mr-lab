import { BookOpen, FileText, Library, ListTodo, NotebookPen, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { libraryIndex } from "@/data/library-index";

export type SearchCourse = {
  code: string; title: string; lecturer: string; day: string; time: string; room: string;
  materials: { id: number; title: string; type: string; description: string }[];
  notes: { id: number; title: string; topic: string; body: string }[];
};
export type SearchTask = { id: number; title: string; course: string; due: string; status: string };

type Hit = { id: string; title: string; subtitle: string; action?: () => void };
type Group = { label: string; icon: typeof BookOpen; hits: Hit[] };

const match = (query: string, ...fields: (string | undefined)[]) =>
  fields.filter(Boolean).some(field => field!.toLowerCase().includes(query));

export function GlobalSearch({
  open, onClose, courses, tasks, onOpenCourse, onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  courses: SearchCourse[];
  tasks: SearchTask[];
  onOpenCourse: (code: string) => void;
  onNavigate: (view: "tasks" | "library" | "courses") => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = useMemo<Group[]>(() => {
    if (!q) return [];
    const courseHits: Hit[] = courses
      .filter(course => match(q, course.title, course.code, course.lecturer, course.room))
      .map(course => ({
        id: `course-${course.code}`,
        title: course.title,
        subtitle: `${course.code} · ${course.lecturer} · ${course.day} ${course.time}`,
        action: () => { onOpenCourse(course.code); onClose(); },
      }));

    const materialHits: Hit[] = courses.flatMap(course =>
      course.materials.filter(item => match(q, item.title, item.type, item.description)).map(item => ({
        id: `material-${course.code}-${item.id}`,
        title: item.title,
        subtitle: `${item.type} · ${course.title}`,
        action: () => { onOpenCourse(course.code); onClose(); },
      })));

    const noteHits: Hit[] = courses.flatMap(course =>
      course.notes.filter(note => match(q, note.title, note.topic, note.body)).map(note => ({
        id: `note-${course.code}-${note.id}`,
        title: note.title,
        subtitle: `${note.topic} · ${course.title}`,
        action: () => { onOpenCourse(course.code); onClose(); },
      })));

    const taskHits: Hit[] = tasks
      .filter(task => match(q, task.title, task.course, task.status))
      .map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        subtitle: `${task.course} · due ${task.due} · ${task.status}`,
        action: () => { onNavigate("tasks"); onClose(); },
      }));

    const libraryHits: Hit[] = libraryIndex
      .filter(item => match(q, item.title, item.type, item.course))
      .map(item => ({
        id: `library-${item.id}`,
        title: item.title,
        subtitle: `${item.type} · ${item.course} · ${item.detail}`,
        action: () => { onNavigate("library"); onClose(); },
      }));

    return [
      { label: "Courses", icon: BookOpen, hits: courseHits },
      { label: "Materials", icon: FileText, hits: materialHits },
      { label: "Tasks", icon: ListTodo, hits: taskHits },
      { label: "Notes", icon: NotebookPen, hits: noteHits },
      { label: "Library resources", icon: Library, hits: libraryHits },
    ].filter(group => group.hits.length);
  }, [q, courses, tasks, onOpenCourse, onNavigate, onClose]);

  if (!open) return null;
  const total = groups.reduce((sum, group) => sum + group.hits.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-academic/40 p-4 backdrop-blur-sm sm:p-10" onClick={onClose}>
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-academic" />
          <Input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search courses, materials, tasks, notes, library…" className="h-9 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" />
          <button onClick={onClose} aria-label="Close search" className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {!q && <p className="px-2 py-6 text-center text-sm text-muted-foreground">Type to search across your whole academic workspace.</p>}
          {q && !total && <p className="px-2 py-6 text-center text-sm text-muted-foreground">No academic results for “{query}”.</p>}
          {groups.map(({ label, icon: Icon, hits }) => (
            <section key={label} className="mb-3 last:mb-0">
              <p className="mb-1.5 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase text-muted-foreground"><Icon className="size-3.5 text-academic" />{label} · {hits.length}</p>
              <div className="space-y-1">
                {hits.slice(0, 6).map(hit => (
                  <button key={hit.id} onClick={hit.action} className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted">
                    <p className="truncate text-sm font-semibold">{hit.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{hit.subtitle}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
