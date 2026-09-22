import { Check, History, ListTodo, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTodos, type TodoItem } from "@/lib/todo-log";

const dateLabel = (value: number) =>
  new Date(value).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function HistoryDialog({ done }: { done: TodoItem[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, TodoItem[]>();
    for (const item of [...done].sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))) {
      const key = dateLabel(item.doneAt ?? item.createdAt);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()];
  }, [done]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><History className="size-4" /> Riwayat</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat to do list</DialogTitle>
          <DialogDescription>Semua hal yang sudah kamu selesaikan, dikelompokkan per tanggal.</DialogDescription>
        </DialogHeader>
        {grouped.length ? (
          <div className="space-y-4">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{day} · {items.length} selesai</p>
                <ul className="mt-2 space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span className="min-w-0 break-words">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada yang diselesaikan. Centang tugas pertamamu hari ini.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function StudyTodoList() {
  const { items, add, toggle, remove } = useTodos();
  const [draft, setDraft] = useState("");

  const open = items.filter((item) => !item.doneAt);
  const done = items.filter((item) => item.doneAt);
  const doneToday = done.filter((item) => new Date(item.doneAt ?? 0).toDateString() === new Date().toDateString());

  const submit = () => {
    add(draft);
    setDraft("");
  };

  return (
    <section className="academic-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListTodo className="size-5 text-academic" />
          <h2 className="text-base font-bold">To do list hari ini</h2>
        </div>
        <HistoryDialog done={done} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Apa yang mau kamu kerjakan hari ini?" className="h-10 text-sm" />
        <Button type="submit" variant="academic" size="sm" disabled={!draft.trim()}><Plus className="size-4" /> Simpan</Button>
      </form>

      {open.length ? (
        <ul className="mt-4 space-y-1.5">
          {open.map((item) => (
            <li key={item.id} className="group flex items-start gap-3 rounded-lg px-1 py-1.5">
              <button
                type="button"
                aria-label={`Tandai selesai: ${item.title}`}
                onClick={() => toggle(item.id)}
                className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-input transition-colors hover:border-academic hover:bg-accent"
              />
              <span className="min-w-0 flex-1 break-words text-sm">{item.title}</span>
              <button type="button" aria-label="Hapus" onClick={() => remove(item.id)} className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">Belum ada yang dicatat. Tulis satu hal kecil untuk dikerjakan hari ini.</p>
      )}

      {doneToday.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Selesai hari ini · {doneToday.length}</p>
          <ul className="mt-2 space-y-1.5">
            {doneToday.slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-1">
                <button
                  type="button"
                  aria-label={`Batalkan: ${item.title}`}
                  onClick={() => toggle(item.id)}
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success text-[10px] font-bold text-white"
                >
                  <Check className="size-3" />
                </button>
                <span className="min-w-0 flex-1 break-words text-sm text-muted-foreground line-through">{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
