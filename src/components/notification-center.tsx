import { Bell, CalendarDays, Clock3, GraduationCap, ListTodo, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDaysIso, dayKeyFromName, dayKeyOfIso, formatDayMonthId, jakartaFromTimestamp, minutesOf, toTime24, type JakartaNow } from "@/lib/jakarta-time";

export type NotificationTask = {
  id: number;
  title: string;
  course: string;
  due: string;
  done: boolean;
  dueIso?: string | undefined;
  dueTime?: string | undefined;
  priority?: "High" | "Medium" | "Low" | undefined;
};
export type NotificationClass = { id: number; title: string; start: string; location?: string; course?: string; day: string };
export type NotificationMilestone = { id: string; type: string; title: string; detail?: string | null | undefined; startsAt: string; endsAt?: string | null | undefined };

export type NotificationCategory = "Course" | "Task" | "Academic" | "System";
export type NotificationPriority = "High" | "Medium" | "Low";

export type Notification = {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  detail: string;
  when: string;
  /** Minutes until the event starts, when it happens today. */
  minutesUntil: number | null;
};

const categoryStyle: Record<NotificationCategory, { icon: typeof Bell; tone: string }> = {
  Course: { icon: CalendarDays, tone: "bg-accent text-academic" },
  Task: { icon: ListTodo, tone: "bg-destructive/10 text-destructive" },
  Academic: { icon: GraduationCap, tone: "bg-warning/15 text-warning" },
  System: { icon: Settings2, tone: "bg-success/15 text-success" },
};

const priorityTone: Record<NotificationPriority, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/15 text-warning",
  Low: "bg-muted text-muted-foreground",
};

const SYSTEM_TYPES = ["system", "update", "curriculum"];
const READ_KEY = "harmony.notifications.read";

/** Read ids kept on the device — no extra user system, no duplicated accounts. */
function loadRead(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Builds the notification feed from the student's real academic data:
 * today's class schedule, task deadlines, and academic milestones such as KRS
 * periods and exams. Nothing is invented — an empty database means an empty feed.
 */
export function useNotifications(
  tasks: NotificationTask[],
  classes: NotificationClass[],
  milestones: NotificationMilestone[],
  now: JakartaNow,
) {
  const items = useMemo<Notification[]>(() => {
    const tomorrow = addDaysIso(now.iso, 1);
    const todayKey = dayKeyOfIso(now.iso);
    const tomorrowKey = dayKeyOfIso(tomorrow);
    const feed: Notification[] = [];

    // 1. Course schedule — classes today and tomorrow.
    for (const item of classes) {
      const dayKey = dayKeyFromName(item.day);
      if (!dayKey || (dayKey !== todayKey && dayKey !== tomorrowKey)) continue;
      const start = toTime24(item.start);
      if (!start) continue;
      const isToday = dayKey === todayKey;
      const minutesUntil = isToday ? minutesOf(start) - now.minutesOfDay : null;
      if (isToday && minutesUntil !== null && minutesUntil < 0) continue;
      const soon = minutesUntil !== null && minutesUntil <= 60;
      feed.push({
        id: `course-${item.id}-${isToday ? now.iso : tomorrow}`,
        category: "Course",
        priority: soon ? "High" : isToday ? "Medium" : "Low",
        title: soon ? `${item.title} starts in ${minutesUntil} minute${minutesUntil === 1 ? "" : "s"}` : item.title,
        detail: `${item.location ?? "Campus"}${item.course ? ` · ${item.course}` : ""}`,
        when: `${isToday ? "Today" : "Tomorrow"} · ${start}`,
        minutesUntil,
      });
    }

    // 2. Task deadlines — overdue, due today, due tomorrow.
    for (const task of tasks) {
      if (task.done || !task.dueIso) continue;
      const time = task.dueTime ?? "23:59";
      if (task.dueIso < now.iso) {
        feed.push({
          id: `task-${task.id}-overdue`,
          category: "Task",
          priority: "High",
          title: `${task.title} is overdue`,
          detail: task.course,
          when: `Was due ${formatDayMonthId(task.dueIso)}`,
          minutesUntil: null,
        });
        continue;
      }
      if (task.dueIso === now.iso) {
        feed.push({
          id: `task-${task.id}-today`,
          category: "Task",
          priority: "High",
          title: `${task.title} due today`,
          detail: task.course,
          when: `Today · ${time}`,
          minutesUntil: minutesOf(time) - now.minutesOfDay,
        });
        continue;
      }
      if (task.dueIso === tomorrow) {
        feed.push({
          id: `task-${task.id}-tomorrow`,
          category: "Task",
          priority: task.priority === "High" ? "High" : "Medium",
          title: `${task.title} due tomorrow`,
          detail: task.course,
          when: `Tomorrow · ${time}`,
          minutesUntil: null,
        });
      }
    }

    // 3 & 4. Academic activities, KRS periods and system updates from milestones.
    for (const milestone of milestones) {
      const { iso, time } = jakartaFromTimestamp(milestone.startsAt);
      const endIso = milestone.endsAt ? jakartaFromTimestamp(milestone.endsAt).iso : null;
      const active = iso <= now.iso && (endIso ?? iso) >= now.iso;
      if (!active && (iso < now.iso || iso > addDaysIso(now.iso, 7))) continue;
      const isSystem = SYSTEM_TYPES.includes(milestone.type.toLowerCase());
      const startsToday = iso === now.iso;
      feed.push({
        id: `milestone-${milestone.id}`,
        category: isSystem ? "System" : "Academic",
        priority: isSystem ? "Low" : startsToday || active ? "High" : iso === tomorrow ? "Medium" : "Low",
        title: startsToday ? `${milestone.title} starts today` : milestone.title,
        detail: milestone.detail || milestone.type,
        when: active && !startsToday ? `Ongoing until ${formatDayMonthId(endIso ?? iso)}` : `${formatDayMonthId(iso)} · ${time}`,
        minutesUntil: startsToday ? minutesOf(time) - now.minutesOfDay : null,
      });
    }

    const rank: Record<NotificationPriority, number> = { High: 0, Medium: 1, Low: 2 };
    return feed.sort((a, b) => rank[a.priority] - rank[b.priority] || (a.minutesUntil ?? 9_999) - (b.minutesUntil ?? 9_999));
  }, [tasks, classes, milestones, now.iso, now.minutesOfDay]);

  const [read, setRead] = useState<string[]>(() => loadRead());
  useEffect(() => {
    setRead(loadRead());
  }, []);

  const persist = useCallback((next: string[]) => {
    setRead(next);
    try {
      window.localStorage.setItem(READ_KEY, JSON.stringify(next.slice(-200)));
    } catch {
      /* storage unavailable — read state stays in memory */
    }
  }, []);

  const markRead = useCallback((id: string) => persist(Array.from(new Set([...read, id]))), [persist, read]);
  const markAllRead = useCallback(() => persist(Array.from(new Set([...read, ...items.map((item) => item.id)]))), [persist, read, items]);

  const unreadCount = items.filter((item) => !read.includes(item.id)).length;
  return { items, read, unreadCount, markRead, markAllRead };
}

export function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"} className="relative grid size-9 place-items-center rounded-full bg-muted text-academic transition-colors hover:bg-accent">
      <Bell className="size-4" />
      {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{count}</span>}
    </button>
  );
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  read = [],
  onRead,
  onReadAll,
}: {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  read?: string[];
  onRead?: (id: string) => void;
  onReadAll?: () => void;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  if (!open) return null;
  const visible = notifications.filter((item) => !dismissed.includes(item.id));
  const unread = visible.filter((item) => !read.includes(item.id)).length;

  return (
    <div className="fixed inset-0 z-50 bg-academic/40 backdrop-blur-sm" onClick={onClose}>
      <aside className="ml-auto flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Notifications</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{unread > 0 ? `${unread} unread of ${visible.length}` : `${visible.length} academic reminders`}</p>
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && onReadAll && (
              <button onClick={onReadAll} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-academic hover:bg-muted">Mark all read</button>
            )}
            <button onClick={onClose} aria-label="Close notifications" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
          </div>
        </header>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {!visible.length && <p className="py-10 text-center text-sm text-muted-foreground">No new notifications</p>}
          {visible.map((item) => {
            const { icon: Icon, tone } = categoryStyle[item.category];
            const isRead = read.includes(item.id);
            return (
              <article
                key={item.id}
                onClick={() => !isRead && onRead?.(item.id)}
                className={`academic-card grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-4 ${isRead ? "opacity-60" : ""}`}
              >
                <span className={`grid size-9 place-items-center rounded-xl ${tone}`}><Icon className="size-4" /></span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold">
                    {!isRead && <span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-label="Unread" />}
                    <span className="truncate">{item.title}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-academic">
                    <Clock3 className="size-3" />{item.when}
                    <span className={`rounded-full px-1.5 py-0.5 ${priorityTone[item.priority]}`}>{item.priority}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">{item.category}</span>
                  </p>
                </div>
                <button
                  onClick={(event) => { event.stopPropagation(); setDismissed((items) => [...items, item.id]); }}
                  aria-label={`Dismiss ${item.title}`}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                ><X className="size-3.5" /></button>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
