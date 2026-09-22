import { CalendarCheck2, Flame, Trash2 } from "lucide-react";
import { clearStudySessions, removeStudySession, useStudySessions } from "@/lib/study-log";
import { Button } from "@/components/ui/button";

const pad = (value: number) => String(value).padStart(2, "0");
const clock = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return hours ? `${hours} jam ${pad(minutes)} mnt` : `${minutes} mnt`;
};

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const dayFormat = new Intl.DateTimeFormat("id-ID", { weekday: "narrow", timeZone: "Asia/Jakarta" });
const TARGET_MINUTES_PER_WEEK = 150;

// Senin 00:00 WIB minggu ini dalam epoch ms
function startOfJakartaWeek(): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(Date.now());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const mondayOffset = (dayIndex + 6) % 7;
  const jakartaMidnightUtc = Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day"))) - 7 * 3600 * 1000;
  return jakartaMidnightUtc - mondayOffset * 86400 * 1000;
}

export function StudyHistory() {
  const sessions = useStudySessions();
  const weekStart = startOfJakartaWeek();
  const weekSessions = sessions.filter((item) => item.at >= weekStart);
  const weekSeconds = weekSessions.reduce((total, item) => total + item.seconds, 0);
  const weekMinutes = Math.floor(weekSeconds / 60);
  const productive = weekMinutes >= TARGET_MINUTES_PER_WEEK;

  // Total fokus per hari (Senin–Minggu) untuk grafik mini
  const dayTotals = Array.from({ length: 7 }, (_, index) => {
    const dayStart = weekStart + index * 86400 * 1000;
    const dayEnd = dayStart + 86400 * 1000;
    return sessions
      .filter((item) => item.at >= dayStart && item.at < dayEnd)
      .reduce((total, item) => total + item.seconds, 0);
  });
  const maxDay = Math.max(1, ...dayTotals);

  return (
    <section className="academic-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="size-5 text-academic" />
          <h2 className="text-base font-bold">Riwayat sesi belajar</h2>
        </div>
        {sessions.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clearStudySessions()}>
            <Trash2 className="size-4" /> Hapus semua
          </Button>
        )}
      </div>

      <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-4 ${productive ? "bg-accent" : "bg-muted"}`}>
        <span className={`grid size-10 place-items-center rounded-xl ${productive ? "bg-primary/15 text-academic" : "bg-background text-muted-foreground"}`}>
          <Flame className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {productive ? "Minggu ini produktif! Pertahankan." : "Minggu ini belum produktif"}
          </p>
          <p className="text-xs text-muted-foreground">
            {weekSessions.length} sesi · total fokus {clock(weekSeconds)} dari target {TARGET_MINUTES_PER_WEEK} mnt/minggu
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${productive ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
          {Math.round((weekMinutes / TARGET_MINUTES_PER_WEEK) * 100)}%
        </span>
      </div>

      <div className="mt-4 grid grid-cols-7 items-end gap-1.5">
        {dayTotals.map((seconds, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end">
              <div
                className={`w-full rounded-t-md ${seconds > 0 ? "bg-primary" : "bg-muted"}`}
                style={{ height: seconds > 0 ? `${Math.max(8, Math.round((seconds / maxDay) * 100))}%` : "8%" }}
                title={clock(seconds)}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{dayFormat.format(weekStart + index * 86400 * 1000)}</span>
          </div>
        ))}
      </div>

      {sessions.length === 0 ? (
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          Belum ada sesi tercatat. Selesaikan satu putaran fokus di pengatur waktu, atau simpan sesi dari stopwatch.
        </p>
      ) : (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {sessions.slice(0, 30).map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{session.method}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{dateFormat.format(session.at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-display text-sm font-bold tabular-nums text-academic">{clock(session.seconds)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus sesi ${session.method}`}
                  onClick={() => removeStudySession(session.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
