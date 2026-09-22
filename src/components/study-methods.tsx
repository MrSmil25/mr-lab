import { Brain, Coffee, Pause, Play, RotateCcw, Save, Timer, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StudyHistory } from "@/components/study-history";
import { StudyNotes } from "@/components/study-notes";
import { StudyTodoList } from "@/components/study-todo";
import { logStudySession } from "@/lib/study-log";

type Method = {
  id: string;
  name: string;
  tagline: string;
  focus: number;
  shortBreak: number;
  longBreak: number;
  rounds: number;
  icon: typeof Timer;
  steps: string[];
};

const methods: Method[] = [
  {
    id: "pomodoro",
    name: "Pomodoro",
    tagline: "25 menit fokus · 5 menit istirahat",
    focus: 25, shortBreak: 5, longBreak: 15, rounds: 4, icon: Timer,
    steps: [
      "Pilih satu tugas saja untuk satu sesi.",
      "Fokus penuh 25 menit tanpa membuka ponsel.",
      "Istirahat 5 menit, berdiri dan bergerak.",
      "Setelah 4 putaran, istirahat panjang 15 menit.",
    ],
  },
  {
    id: "52-17",
    name: "52/17",
    tagline: "52 menit kerja · 17 menit jeda",
    focus: 52, shortBreak: 17, longBreak: 30, rounds: 3, icon: Zap,
    steps: [
      "Cocok untuk mengerjakan tugas panjang atau laporan.",
      "Kerja tanpa gangguan selama 52 menit.",
      "Jeda 17 menit benar-benar lepas dari layar.",
    ],
  },
  {
    id: "deep-work",
    name: "Deep Work 90",
    tagline: "90 menit fokus dalam · 20 menit pulih",
    focus: 90, shortBreak: 20, longBreak: 30, rounds: 2, icon: Brain,
    steps: [
      "Untuk materi sulit: analisis, coding, atau menulis skripsi.",
      "Matikan notifikasi dan siapkan semua bahan dulu.",
      "Setelah 90 menit, pulihkan energi 20 menit.",
    ],
  },
  {
    id: "flowtime",
    name: "Flowtime",
    tagline: "Fokus sampai lelah · pakai stopwatch",
    focus: 45, shortBreak: 10, longBreak: 20, rounds: 3, icon: Coffee,
    steps: [
      "Mulai stopwatch dan belajar selama masih nyaman.",
      "Berhenti saat konsentrasi turun, catat durasinya.",
      "Istirahat kira-kira seperlima dari waktu fokus.",
    ],
  },
];

const pad = (value: number) => String(value).padStart(2, "0");
const clock = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

type Phase = "focus" | "shortBreak" | "longBreak";
const phaseLabel: Record<Phase, string> = { focus: "Fokus", shortBreak: "Istirahat singkat", longBreak: "Istirahat panjang" };

function useTicker(running: boolean, onTick: () => void) {
  const saved = useRef(onTick);
  saved.current = onTick;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => saved.current(), 1000);
    return () => clearInterval(timer);
  }, [running]);
}

function MethodTimer({ method }: { method: Method }) {
  const [minutes, setMinutes] = useState({ focus: method.focus, shortBreak: method.shortBreak, longBreak: method.longBreak });
  const [phase, setPhase] = useState<Phase>("focus");
  const [left, setLeft] = useState(method.focus * 60);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [totalFocus, setTotalFocus] = useState(0);

  const phaseSeconds = minutes[phase] * 60;
  const progress = phaseSeconds ? Math.min(100, Math.round(((phaseSeconds - left) / phaseSeconds) * 100)) : 0;

  const goTo = (next: Phase, nextRound = round) => {
    setPhase(next);
    setRound(nextRound);
    setLeft(minutes[next] * 60);
  };

  useTicker(running, () => {
    setLeft((value) => {
      if (value > 1) {
        if (phase === "focus") setTotalFocus((total) => total + 1);
        return value - 1;
      }
      if (phase === "focus") {
        setTotalFocus((total) => total + 1);
        logStudySession(method.name, minutes.focus * 60);
        const done = round >= method.rounds;
        setPhase(done ? "longBreak" : "shortBreak");
        setRound(done ? 1 : round);
        return (done ? minutes.longBreak : minutes.shortBreak) * 60;
      }
      setPhase("focus");
      setRound((value_) => (phase === "longBreak" ? 1 : Math.min(method.rounds, value_ + 1)));
      return minutes.focus * 60;
    });
  });

  const setPhaseMinutes = (key: Phase, value: number) => {
    const safe = Math.max(1, Math.min(180, value || 1));
    setMinutes((current) => ({ ...current, [key]: safe }));
    if (key === phase && !running) setLeft(safe * 60);
  };

  const reset = () => {
    setRunning(false);
    setPhase("focus");
    setRound(1);
    setLeft(minutes.focus * 60);
    setTotalFocus(0);
  };

  return (
    <div className="academic-card overflow-hidden">
      <div className={`h-1.5 ${phase === "focus" ? "bg-primary" : "bg-academic"}`} />
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] md:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{phaseLabel[phase]}</span>
            <span className="text-xs text-muted-foreground">Putaran {round} dari {method.rounds}</span>
          </div>
          <p className="mt-4 font-display text-6xl font-bold tabular-nums text-academic md:text-7xl">{clock(left)}</p>
          <Progress value={progress} className="mt-4 h-2" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="academic" onClick={() => setRunning((value) => !value)}>
              {running ? <><Pause className="size-4" /> Jeda</> : <><Play className="size-4" /> Mulai</>}
            </Button>
            <Button variant="outline" onClick={() => goTo(phase === "focus" ? "shortBreak" : "focus")}>Lewati sesi</Button>
            <Button variant="ghost" onClick={reset}><RotateCcw className="size-4" /> Ulang</Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Total waktu fokus hari ini di sesi ini: <span className="font-semibold text-academic">{clock(totalFocus)}</span></p>
        </div>

        <div className="space-y-3 rounded-2xl bg-muted p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Atur durasi (menit)</p>
          {(["focus", "shortBreak", "longBreak"] as Phase[]).map((key) => (
            <label key={key} className="grid grid-cols-[minmax(0,1fr)_84px] items-center gap-3 text-sm">
              <span className="truncate">{phaseLabel[key]}</span>
              <Input
                value={String(minutes[key])}
                inputMode="numeric"
                onChange={(event) => setPhaseMinutes(key, Number(event.target.value))}
                className="h-9 bg-background text-sm"
              />
            </label>
          ))}
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Cara pakai</p>
            <ul className="mt-2 space-y-1.5">
              {method.steps.map((step) => (
                <li key={step} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  return (
    <section className="academic-card p-5">
      <div className="mb-4 flex items-center gap-2"><Timer className="size-5 text-academic" /><h2 className="text-base font-bold">Stopwatch belajar</h2></div>
      <p className="font-display text-5xl font-bold tabular-nums text-academic">{clock(elapsed)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="academic" size="sm" onClick={() => setRunning((value) => !value)}>
          {running ? <><Pause className="size-4" /> Jeda</> : <><Play className="size-4" /> Mulai</>}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setLaps((items) => [elapsed, ...items])} disabled={!elapsed}>Catat putaran</Button>
        <Button variant="outline" size="sm" onClick={() => logStudySession("Stopwatch belajar", elapsed)} disabled={!elapsed}>
          <Save className="size-4" /> Simpan ke riwayat
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setRunning(false); setElapsed(0); setLaps([]); }}><RotateCcw className="size-4" /> Ulang</Button>
      </div>
      {laps.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
          {laps.map((lap, index) => (
            <li key={`${lap}-${index}`} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Putaran {laps.length - index}</span>
              <span className="font-display font-bold tabular-nums text-academic">{clock(lap)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StudyMethodsView() {
  const [activeId, setActiveId] = useState(methods[0]!.id);
  const active = useMemo(() => methods.find((method) => method.id === activeId) ?? methods[0]!, [activeId]);

  return (
    <div className="page-enter space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase text-academic">Ruang belajar</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">Sistem belajar & pengatur waktu</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Pilih metode belajar yang cocok hari ini, lalu jalankan pengatur waktunya. Durasi bisa kamu ubah sendiri.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {methods.map((method) => {
          const Icon = method.icon;
          const selected = method.id === active.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setActiveId(method.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${selected ? "border-academic bg-accent/50" : "border-border bg-surface hover:border-academic/50"}`}
            >
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-academic"><Icon className="size-4" /></span>
              <p className="mt-3 text-sm font-bold">{method.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{method.tagline}</p>
            </button>
          );
        })}
      </div>

      <StudyTodoList />
      <MethodTimer key={active.id} method={active} />
      <Stopwatch />
      <StudyHistory />
      <StudyNotes />
    </div>
  );
}
