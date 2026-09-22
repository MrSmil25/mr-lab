import { CalendarDays, CheckCircle2, FileText, Plus, Sparkles, Timer, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type Goal = { id: number; label: string; done: boolean };

export function WeeklyReview({
  completedTasks, totalTasks, studySessions, classesAttended, resourcesAdded,
}: {
  completedTasks: number;
  totalTasks: number;
  studySessions: number;
  classesAttended: number;
  resourcesAdded: number;
}) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [draft, setDraft] = useState("");

  const addGoal = () => {
    const label = draft.trim();
    if (!label) return;
    setGoals(items => [...items, { id: Date.now(), label, done: false }]);
    setDraft("");
  };
  const toggle = (id: number) => setGoals(items => items.map(goal => goal.id === id ? { ...goal, done: !goal.done } : goal));
  const remove = (id: number) => setGoals(items => items.filter(goal => goal.id !== id));

  const rate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    { label: "Tugas selesai", value: `${completedTasks}/${totalTasks}`, icon: CheckCircle2 },
    { label: "Sesi belajar", value: String(studySessions), icon: Timer },
    { label: "Kelas dihadiri", value: String(classesAttended), icon: CalendarDays },
    { label: "Materi ditambahkan", value: String(resourcesAdded), icon: FileText },
  ];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold md:text-lg">Evaluasi mingguan</h2>
      </div>
      <div className="academic-card grid gap-5 p-5 md:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Tingkat penyelesaian minggu ini</p>
              <p className="mt-1 font-display text-3xl font-bold text-academic">{rate}%</p>
            </div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-academic"><Sparkles className="size-3.5 text-warning" />Minggu yang konsisten</p>
          </div>
          <Progress value={rate} className="mt-4 h-2" />
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl bg-muted p-3">
                <Icon className="size-4 text-academic" />
                <p className="mt-2 font-display text-lg font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Target minggu depan</p>
          <div className="mt-3 space-y-2">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada target untuk minggu depan.</p>
            ) : goals.map(goal => (
              <div key={goal.id} className="flex items-start gap-3 rounded-xl bg-muted p-3">
                <button onClick={() => toggle(goal.id)} aria-label={`Selesaikan ${goal.label}`} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${goal.done ? "border-academic bg-academic text-academic-foreground" : "border-input bg-background"}`}>
                  {goal.done && <CheckCircle2 className="size-3.5" />}
                </button>
                <p className={`min-w-0 flex-1 text-sm ${goal.done ? "text-muted-foreground line-through" : "font-medium"}`}>{goal.label}</p>
                <button onClick={() => remove(goal.id)} aria-label={`Hapus ${goal.label}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => event.key === "Enter" && addGoal()} placeholder="Tambah target untuk minggu depan" className="h-9" />
            <Button variant="academic" size="sm" onClick={addGoal}><Plus /></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
