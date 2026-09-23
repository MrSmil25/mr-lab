import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useScopedStore } from "@/lib/scoped-storage";

type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

const STORAGE_KEY = "study-notes";
const EMPTY: Note[] = [];

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export function StudyNotes() {
  const [notes, setNotes] = useScopedStore<Note[]>(STORAGE_KEY, EMPTY);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const addNote = () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle && !trimmedBody) return;
    setNotes([
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: trimmedTitle || "Tanpa judul",
        body: trimmedBody,
        createdAt: Date.now(),
      },
      ...notes,
    ]);
    setTitle("");
    setBody("");
  };

  return (
    <section className="academic-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <NotebookPen className="size-5 text-academic" />
          <h2 className="text-base font-bold">Catatan belajar</h2>
        </div>
        {notes.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setNotes([])}>
            <Trash2 className="size-4" /> Hapus semua
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Judul catatan (mis. Ringkasan Statistika Bab 3)"
        />
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Tulis poin penting, rumus, atau rencana belajar..."
          rows={3}
        />
        <Button variant="academic" size="sm" onClick={addNote} disabled={!title.trim() && !body.trim()}>
          <Plus className="size-4" /> Simpan catatan
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          Belum ada catatan. Tulis satu di atas untuk mulai.
        </p>
      ) : (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {notes.map((note) => (
            <li key={note.id} className="rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{note.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{dateFormat.format(note.createdAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus catatan ${note.title}`}
                  onClick={() => setNotes((items) => items.filter((item) => item.id !== note.id))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {note.body && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{note.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
