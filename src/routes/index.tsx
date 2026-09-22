import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft, Bell, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock3,
  Download, ExternalLink, FileText, GraduationCap, Home, Layers, Library, Link2, ListTodo,
  MapPin, Milestone, MoreHorizontal, NotebookPen, Paperclip, Pencil, Plus, Repeat2, Save, Search, Settings, Target, Timer, Trash2, UserRound, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import logoAsset from "@/assets/mr-labs-logo.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LibraryView } from "@/components/library-view";
import { StudyMethodsView } from "@/components/study-methods";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcademicPerformance, CoursePerformance } from "@/components/performance";

import { AcademicEventCard, StudyCommandCenter, initialStudySessions, type PlannedSession } from "@/components/study-command-center";
import { AcademicJourney, JourneyCard } from "@/components/academic-journey";
import { ExamCenter, exams, type Exam } from "@/components/exam-prep";
import { GlobalSearch } from "@/components/global-search";
import { NotificationBell, NotificationPanel, useNotifications } from "@/components/notification-center";
import { QuickAdd } from "@/components/quick-add";
import { WeeklyReview } from "@/components/weekly-review";
import { studentProfile } from "@/data/profile";
import { Onboarding } from "@/components/onboarding";
import { degreeProgress, mergeSetup, useSetup, type StudentSetup } from "@/data/setup";
import { toast } from "sonner";
import { courseByCode, type CurriculumCourse } from "@/data/curriculum";
import { academicYearLabel, useSemesterData, type AssistantSession, type CourseLink } from "@/data/semester";
import { AssistantSessionList, AssistantSessionsPanel, CourseLinksPanel, SemesterArchivePanel, SemesterWorkspaceCard } from "@/components/semester-workspace";
import { EmptyState } from "@/components/empty-state";
import { SettingsView } from "@/components/settings";
import type { AcademicExport } from "@/lib/export-data";
import { useAuth } from "@/lib/auth";
import { GpaEyeButton, GpaValue } from "@/components/gpa-visibility";
import { AuthScreen } from "@/components/auth-screen";
import { CurriculumExplorer } from "@/components/curriculum-explorer";
import { KrsPlanner } from "@/components/krs-planner";
import { useCurriculum, useDashboard, useLibrary, useStudentCourses, type DashboardRow, type StudentCourse } from "@/data/academic";
import { parseDueLabelToIso } from "@/lib/jakarta-time";
import { useAcademicMilestones, useStudentTasks, type MilestoneRow, type TaskRow } from "@/data/tasks";
import { useCourseOptions, useCourseSchedules, type ScheduleInput, type ScheduleRow } from "@/data/schedules";
import { DAY_KEYS, addDaysIso, shiftMonthIso, dayKeyFromName, dayKeyOfIso, formatDateId, formatDayMonthId, jakartaFromTimestamp, jakartaNow, minutesOf, monthNameId, nextMinuteDelay, parseDueDate, relativeDueLabel, toJakartaTimestamp, toTime24, weekOf, type DayKey } from "@/lib/jakarta-time";
import { buildReminders, buildTimeline, type AgendaEvent, type TimelineItem } from "@/lib/academic-agenda";
import { academicSummary } from "@/lib/gpa";
import { useOrganizations, type Organization } from "@/data/organizations";
import { useProfileAvatar } from "@/data/profile-avatar";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ROUTINE_DAY_LABELS, ROUTINE_DAYS, ROUTINE_TYPES, useRoutines, type Routine, type RoutineDay, type RoutineType } from "@/data/routines";
import { OTHER_SCHEDULE_TYPES, useOtherSchedules, type OtherSchedule, type OtherScheduleType } from "@/data/other-schedules";


type View = "home" | "courses" | "curriculum" | "planner" | "calendar" | "tasks" | "library" | "study" | "settings";

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Nama hari dalam bahasa Indonesia, dipetakan dari nama hari bahasa Inggris yang tersimpan di data. */
export const dayLabelId: Record<string, string> = {
  Sunday: "Minggu", Monday: "Senin", Tuesday: "Selasa", Wednesday: "Rabu",
  Thursday: "Kamis", Friday: "Jumat", Saturday: "Sabtu",
};
export const toDayId = (day: string) => dayLabelId[day] ?? day;

/** Local clock for greeting and date, resolved after hydration to avoid SSR drift. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const hour = now?.getHours() ?? 8;
  return {
    greeting: hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam",
    dayName: now ? weekdayNames[now.getDay()]! : "Wednesday",
    dateLabel: now ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }) : "",
  };
}

type TaskCategory = "Accounting" | "Marketing" | "Entrepreneurship" | "Research";
type TaskStatus = "Not started" | "In progress" | "Completed";
type ChecklistItem = { id: number; label: string; done: boolean };
type TaskResource = { id: number; kind: "file" | "link"; title: string; ext?: string; size?: number; url?: string };
type Task = {
  id: number; remoteId?: string; title: string; course: string; courseCode?: string; category: TaskCategory;
  due: string; dueDate: string; dueIso?: string; dueTime?: string; priority: "High" | "Medium" | "Low"; status: TaskStatus; done: boolean;
  description: string; resources: TaskResource[]; checklist: ChecklistItem[];
};
type CourseTask = { id: number; title: string; due: string; priority: "High" | "Medium"; status: "Not started" | "In progress" | "Completed" };
type CourseNote = { id: number; title: string; topic: string; body: string; attachment?: string };
type CourseMaterial = { id: number; title: string; type: "Textbook" | "PDF" | "Slides" | "External link" | "Article"; description: string; attachment: string };
type CourseEvent = { type: "Lecture" | "Assistant" | "Exam"; title: string; day: string; time: string; room: string; date?: string };
type Course = {
  code: string; title: string; sks: number; section?: string; lecturer: string; assistant: string;
  day: string; time: string; room: string; accent: string;
  tasks: CourseTask[]; materials: CourseMaterial[]; notes: CourseNote[]; events: CourseEvent[];
  /** Rincian yang tersimpan di Supabase untuk mata kuliah ini. */
  status?: string; grade?: string | null; semester?: number | null;
  resourceCount?: number; fileCount?: number; noteCount?: number;
};
type UpcomingOtherSchedule = OtherSchedule & { sourceId: number; removable: boolean };

/** Label status mata kuliah dalam bahasa Indonesia. */
const courseStatusLabel = (status?: string) => {
  const value = (status ?? "").toLowerCase();
  if (["completed", "passed", "lulus"].includes(value)) return "Selesai";
  if (["ongoing", "in_progress", "active", "taking"].includes(value)) return "Sedang berjalan";
  return "Direncanakan";
};

const materialSet: CourseMaterial[] = [];

const courses: Course[] = [];



type EventType = "Lecture" | "Assistant" | "Deadline" | "Study" | "Milestone" | "Routine" | "Organization" | "Todo";
type CalendarEvent = { id: string; type: EventType; day: string; date?: string; title: string; start: string; end?: string; location?: string; course?: string; person?: string; priority?: Task["priority"]; detail?: string };


const eventStyles: Record<EventType, { bar: string; dot: string; chip: string; label: string; icon: typeof Clock3 }> = {
  Lecture: { bar: "bg-primary", dot: "bg-primary", chip: "bg-primary/20 text-academic", label: "Kuliah", icon: GraduationCap },
  Assistant: { bar: "bg-academic", dot: "bg-academic", chip: "bg-academic/12 text-academic", label: "Sesi asistensi", icon: UserRound },
  Deadline: { bar: "bg-destructive", dot: "bg-destructive", chip: "bg-destructive/12 text-destructive", label: "Tenggat", icon: FileText },
  Study: { bar: "bg-success", dot: "bg-success", chip: "bg-success/12 text-success", label: "Belajar mandiri", icon: BookOpen },
  Milestone: { bar: "bg-warning", dot: "bg-warning", chip: "bg-warning/15 text-academic", label: "Agenda akademik", icon: Milestone },
  Routine: { bar: "bg-academic/60", dot: "bg-academic/60", chip: "bg-academic/10 text-academic", label: "Rutinitas", icon: Clock3 },
  Organization: { bar: "bg-primary/70", dot: "bg-primary/70", chip: "bg-primary/15 text-academic", label: "Organisasi", icon: Layers },
  Todo: { bar: "bg-muted-foreground", dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground", label: "To-do", icon: ListTodo },
};

const taskCategories: TaskCategory[] = ["Accounting", "Marketing", "Entrepreneurship", "Research"];

const courseOptions: { course: string; courseCode: string; category: TaskCategory }[] = [
  { course: "Akuntansi Manajemen untuk Bisnis", courseCode: "ECAC600056", category: "Accounting" },
  { course: "Manajemen Produk dan Harga", courseCode: "ECMN600040", category: "Marketing" },
  { course: "Bisnis Internasional", courseCode: "ECMN600020", category: "Entrepreneurship" },
  { course: "Metode Riset Bisnis", courseCode: "ECMN600018", category: "Research" },
];

const priorityStyles: Record<Task["priority"], string> = {
  High: "bg-destructive/12 text-destructive",
  Medium: "bg-primary/25 text-foreground",
  Low: "bg-success/12 text-success",
};

const statusStyles: Record<TaskStatus, string> = {
  "Not started": "bg-muted text-muted-foreground",
  "In progress": "bg-academic/12 text-academic",
  Completed: "bg-success/12 text-success",
};

/** Label berbahasa Indonesia untuk nilai yang tersimpan dalam bahasa Inggris. */
const priorityLabel: Record<Task["priority"], string> = { High: "tinggi", Medium: "sedang", Low: "rendah" };
const taskStatusLabel: Record<TaskStatus, string> = { "Not started": "Belum mulai", "In progress": "Sedang dikerjakan", Completed: "Selesai" };
const categoryLabel: Record<TaskCategory, string> = { Accounting: "Akuntansi", Marketing: "Pemasaran", Entrepreneurship: "Kewirausahaan", Research: "Riset" };

/** Maps a saved Supabase task row onto the task shape the screens already use. */
function taskFromRow(row: TaskRow, index: number, todayIso: string): Task {
  const due = row.due_at ? jakartaFromTimestamp(row.due_at) : null;
  const category = (taskCategories as string[]).includes(row.category ?? "") ? (row.category as TaskCategory) : "Research";
  const priority = (["High", "Medium", "Low"] as const).find((value) => value === row.priority) ?? "Medium";
  const status = (["Not started", "In progress", "Completed"] as const).find((value) => value === row.status) ?? (row.done ? "Completed" : "Not started");
  return {
    id: index + 1,
    remoteId: row.id,
    title: row.title,
    course: row.course_name ?? row.course_code ?? "Tanpa mata kuliah",
    courseCode: row.course_code ?? "",
    category,
    due: due ? relativeDueLabel(due.iso, todayIso) : "Tanpa tenggat",
    dueDate: due ? `${due.iso} · ${due.time}` : "",
    ...(due ? { dueIso: due.iso, dueTime: due.time } : {}),
    priority,
    status: row.done ? "Completed" : status,
    done: row.done,
    description: row.description ?? "Belum ada deskripsi.",
    resources: [],
    checklist: [],
  };
}

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "MR Labs — Ruang Akademik Personal" },
    { name: "description", content: "MR Labs, ruang akademik personal untuk mata kuliah, jadwal, tugas, dan materi belajar." },
    { property: "og:title", content: "MR Labs — Ruang Akademik Personal" },
    { property: "og:description", content: "Kelola mata kuliah, jadwal, tugas, dan materi belajar dalam satu tempat." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AppRoot,
});

/** Shows the sign-in screen until an account is available, then the workspace. */
function AppRoot() {
  const { ready: authReady, user } = useAuth();
  if (!authReady) {
    return <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-sm text-muted-foreground">Membuka ruang akademikmu…</div>;
  }
  if (!user) return <AuthScreen />;
  return <AcademicApp key={user.id} userId={user.id} />;
}

function AcademicApp({ userId }: { userId: string }) {
  const [view, setView] = useState<View>("home");
  const [workspace, setWorkspace] = useState<Course | null>(null);
  const [taskOverrides, setTaskOverrides] = useState<Record<string, Partial<Task>>>({});
  const [exam, setExam] = useState<Exam | null>(null);
  const [journey, setJourney] = useState(false);
  const [studySessions, setStudySessions] = useState<PlannedSession[]>(initialStudySessions);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [resourcesAdded, setResourcesAdded] = useState(2);
  const [notesAdded, setNotesAdded] = useState(0);
  const { ready, setup, save: saveSetup } = useSetup();
  /** Editor profil akademik: dibuka dengan data yang sudah tersimpan, bukan kosong. */
  const [setupEditor, setSetupEditor] = useState<{ initial: StudentSetup | null } | null>(null);
  const openSetupEditor = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSetupEditor({ initial: setup });
    void import("@/data/academic")
      .then((academic) => academic.fetchRemoteSetup())
      .catch(() => null)
      .then((remote) => {
        const merged = mergeSetup(setup, (remote as Partial<StudentSetup> | null) ?? null);
        if (merged) setSetupEditor({ initial: merged });
      });
  };
  const semesterData = useSemesterData();
  const { dashboard, refresh: refreshDashboard } = useDashboard();
  const profileAvatar = useProfileAvatar();
  const { courses: liveCourses, refresh: refreshLiveCourses } = useStudentCourses();
  const { rows: curriculumRows, loading: curriculumLoading, refresh: refreshCurriculum } = useCurriculum();
  const library = useLibrary();
  const organizationData = useOrganizations();
  const otherScheduleData = useOtherSchedules();
  const routineData = useRoutines();
  const clock = useJakartaClock();
  const { rows: taskRows, create: createTaskRow, update: updateTaskRow, remove: removeTaskRow } = useStudentTasks();
  
  const { rows: milestoneRows } = useAcademicMilestones();
  const { rows: scheduleRows } = useCourseSchedules();
  const tasks = useMemo<Task[]>(
    () => taskRows.map((row, index) => ({ ...taskFromRow(row, index, clock.iso), ...taskOverrides[row.id] })),
    [taskRows, taskOverrides, clock.iso],
  );
  /** Ringkasan IPK dan SKS, dihitung dari mata kuliah milik mahasiswa di Supabase. */
  const summary = useMemo(
    () => academicSummary(liveCourses.map((course) => ({ sks: course.sks, grade: course.grade, status: course.status }))),
    [liveCourses],
  );

  const myCourses = useMemo<Course[]>(() => {
    const accents = ["bg-primary", "bg-academic", "bg-success", "bg-warning"];
    const ongoing = liveCourses.filter((course) => !["COMPLETED", "completed"].includes(course.status));
    if (ongoing.length) {
      return ongoing.map((course, index) => {
        const config = setup?.active.find((item) => item.code === course.code);
        const timetable = scheduleRows.find((row) => row.courseId === course.courseId || row.courseCode === course.code);
        const start = course.start || timetable?.start || config?.start || "";
        const end = course.end || timetable?.end || config?.end || "";
        const time = start ? (end ? `${start} – ${end}` : start) : "—";
        const day = course.day || timetable?.dayLabelEn || config?.day || "Belum dijadwalkan";
        const room = course.room || timetable?.room || config?.room || "Ruang menyusul";
        const lecturer = course.lecturer || config?.lecturer || "Belum diumumkan";
        return {
          code: course.code,
          title: course.name,
          sks: course.sks,
          section: config?.section ?? course.section ?? "A",
          lecturer,
          assistant: config?.assistant || "Belum diumumkan",
          day,
          time,
          room,
          accent: accents[index % accents.length] ?? "bg-academic",
          status: course.status,
          grade: course.grade,
          semester: course.semester,
          resourceCount: course.resourceCount,
          fileCount: course.fileCount,
          noteCount: course.noteCount,
          tasks: [],
          materials: materialSet,
          notes: [{ id: 1, title: "Rincian mata kuliah", topic: courseStatusLabel(course.status), body: `${course.name} berbobot ${course.sks} SKS. Tersimpan ${course.resourceCount} materi, ${course.fileCount} berkas, dan ${course.noteCount} catatan untuk mata kuliah ini.` }],
          events: [{ type: "Lecture" as const, title: `Kuliah mingguan — ${course.name}`, day, time, room }],
        } satisfies Course;
      });

    }
    if (!setup || !setup.active.length) return courses;
    return setup.active.map((config, index) => {
      const meta = courseByCode.get(config.code);
      const base = courses.find((item) => item.code === config.code);
      const time = `${config.start} – ${config.end}`;
      return {
        code: config.code,
        title: meta?.name ?? base?.title ?? config.code,
        sks: meta?.sks ?? base?.sks ?? 3,
        section: config.section,
        lecturer: config.lecturer.trim() || "Belum diumumkan",
        assistant: config.assistant.trim() || "Belum diumumkan",
        day: config.day,
        time,
        room: config.room.trim() || "Ruang menyusul",
        accent: accents[index % accents.length] ?? "bg-academic",
        tasks: base?.tasks ?? [],
        materials: materialSet,
        notes: base?.notes ?? [{ id: 1, title: "Rencana kuliah", topic: `Kelas ${config.section}`, body: `${meta?.name ?? config.code} berlangsung ${toDayId(config.day)}, ${time} di ${config.room || "ruang yang akan diumumkan"}.` }],
        events: [
          { type: "Lecture" as const, title: `Kuliah mingguan — kelas ${config.section}`, day: config.day, time, room: config.room || "Ruang menyusul" },
          ...(base?.events.filter((event) => event.type !== "Lecture") ?? []),
        ],
      } satisfies Course;
    });
  }, [setup, liveCourses, scheduleRows]);
  const addStudySession = (session: Omit<PlannedSession, "id">) => setStudySessions((items) => [...items, { ...session, id: Date.now() }]);
  const removeStudySession = (id: number) => setStudySessions((items) => items.filter((item) => item.id !== id));

  const notifications = useNotifications(
    tasks.map((task) => ({ id: task.id, title: task.title, course: task.course, due: task.due, done: task.done, dueIso: task.dueIso, dueTime: task.dueTime, priority: task.priority })),
    myCourses.map((course, index) => ({ id: index + 1, title: course.title, start: course.time.split(" – ")[0] ?? course.time, location: course.room, course: course.code, day: course.day })),
    milestoneRows.map((row) => ({ id: row.id, type: row.milestone_type, title: row.title, detail: row.description ?? row.course_code, startsAt: row.starts_at, endsAt: row.ends_at })),
    clock,
  );

  const navigate = (next: View) => { setWorkspace(null); setExam(null); setJourney(false); setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openCurriculumCourse = (item: CurriculumCourse) => {
    const existing = myCourses.find((course) => course.code === item.code);
    setWorkspace(existing ?? {
      code: item.code, title: item.name, sks: item.sks,
      lecturer: "Belum diumumkan", assistant: "Belum diumumkan",
      day: "Belum dijadwalkan", time: "—", room: "—", accent: "bg-academic",
      tasks: [], materials: materialSet,
      notes: [{ id: 1, title: "Rencana kuliah", topic: `Semester ${item.semester}`, body: `${item.name} termasuk kelompok ${item.group} dan berbobot ${item.sks} SKS.` }],
      events: [{ type: "Lecture", title: "Jadwal terbit setelah pengisian KRS", day: "TBA", time: "—", room: "—" }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleTask = (id: number) => {
    const task = tasks.find((item) => item.id === id);
    if (!task?.remoteId) return;
    void updateTaskRow(task.remoteId, { done: !task.done, status: !task.done ? "Completed" : "In progress" });
  };
  const updateTask = (id: number, patch: Partial<Task>) => {
    const task = tasks.find((item) => item.id === id);
    if (!task?.remoteId) return;
    setTaskOverrides((current) => ({ ...current, [task.remoteId!]: { ...current[task.remoteId!], ...patch } }));
    const remotePatch: Partial<Omit<TaskRow, "id">> = {};
    if (patch.title !== undefined) remotePatch.title = patch.title;
    if (patch.description !== undefined) remotePatch.description = patch.description;
    if (patch.priority !== undefined) remotePatch.priority = patch.priority;
    if (patch.status !== undefined) { remotePatch.status = patch.status; remotePatch.done = patch.status === "Completed"; }
    if (patch.done !== undefined) remotePatch.done = patch.done;
    if (patch.dueIso !== undefined) remotePatch.due_at = patch.dueIso ? toJakartaTimestamp(patch.dueIso, patch.dueTime ?? "23:59") : null;
    if (Object.keys(remotePatch).length) void updateTaskRow(task.remoteId, remotePatch);
  };
  const addTask = (task: Task) => {
    void createTaskRow({
      title: task.title,
      course_code: task.courseCode ?? null,
      course_name: task.course,
      category: task.category,
      description: task.description,
      due_at: task.dueIso ? toJakartaTimestamp(task.dueIso, task.dueTime ?? "23:59") : null,
      priority: task.priority,
      status: task.status,
      done: task.done,
    });
  };
  const deleteTask = (id: number) => {
    const task = tasks.find((item) => item.id === id);
    if (task?.remoteId) void removeTaskRow(task.remoteId);
  };

  const exportData = useMemo<AcademicExport>(() => {
    const stats = degreeProgress(setup?.completed ?? []);
    return {
      courses: myCourses.map((course) => ({ code: course.code, title: course.title, sks: course.sks, ...(course.section ? { section: course.section } : {}), lecturer: course.lecturer, assistant: course.assistant, day: course.day, time: course.time, room: course.room })),
      tasks: tasks.map((task) => ({ title: task.title, course: task.course, due: task.dueDate || task.due, priority: task.priority, status: task.status, done: task.done })),
      notes: myCourses.flatMap((course) => course.notes.map((note) => ({ title: note.title, topic: note.topic, course: course.title, body: note.body }))),
      resources: myCourses.flatMap((course) => course.materials.map((material) => ({ title: material.title, type: material.type, course: course.title, detail: material.attachment }))),
      progress: { currentSemester: setup?.currentSemester ?? studentProfile.currentSemester, completedSks: stats.completedSks, remainingSks: stats.remainingSks, totalSks: stats.totalSks, percent: stats.percent, completedCourses: setup?.completed ?? [] },
    };
  }, [myCourses, tasks, setup]);

  const openCourseByCode = (code: string) => {
    const found = myCourses.find((course) => course.code === code);
    if (found) { setExam(null); setJourney(false); setWorkspace(found); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };
  const openExamForCourse = (code: string) => {
    const found = exams.find((item) => item.courseCode === code);
    if (found) { setWorkspace(null); setExam(found); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  if (ready && (!setup || setupEditor)) {
    const initial = setupEditor?.initial ?? null;
    return (
      <Onboarding
        key={`${initial?.completed.length ?? 0}-${initial?.active.length ?? 0}`}
        initial={initial}
        onComplete={(next) => {
          saveSetup(next);
          setSetupEditor(null);
          if (initial) toast.success("Academic profile updated");
          window.setTimeout(() => {
            void refreshCurriculum();
            void refreshLiveCourses();
            void refreshDashboard();
          }, 1200);
        }}
        {...(setup ? { onCancel: () => setSetupEditor(null) } : {})}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-8">
      <DesktopHeader view={view} navigate={navigate} onSearch={() => setSearchOpen(true)} onNotifications={() => setNotifOpen(true)} notificationCount={notifications.unreadCount} onSettings={() => navigate("settings")} avatarUrl={profileAvatar.avatarUrl} profileName={dashboard?.student_name || setup?.name || studentProfile.name} />
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 md:py-8">
        {exam ? <StudyCommandCenter event={exam} onBack={() => setExam(null)} sessions={studySessions} onAddSession={addStudySession} onRemoveSession={removeStudySession} /> : workspace ? <CourseWorkspace course={workspace} onBack={() => setWorkspace(null)} onOpenExam={openExamForCourse} links={semesterData.links.filter((link) => link.code === workspace.code)} onAddLink={semesterData.addLink} onRemoveLink={semesterData.removeLink} sessions={semesterData.sessions.filter((session) => session.code === workspace.code)} onAddSession={semesterData.addSession} onRemoveSession={semesterData.removeSession} /> : journey ? <AcademicJourney onBack={() => setJourney(false)} onOpenCourse={openCurriculumCourse} setup={setup} credits={{ completedSks: dashboard?.completed_credits ?? null, requiredSks: dashboard?.minimum_graduation_credit ?? null }} /> : (
          <div key={view} className="page-enter">
            {view === "home" && <HomeView tasks={tasks} toggleTask={toggleTask} navigate={navigate} onOpenExam={setExam} onOpenJourney={() => { setJourney(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} onSearch={() => setSearchOpen(true)} onNotifications={() => setNotifOpen(true)} notificationCount={notifications.unreadCount} studySessions={studySessions.length} resourcesAdded={resourcesAdded + notesAdded} profile={setup} myCourses={myCourses} onEditSetup={openSetupEditor} semesterData={semesterData} organizations={organizationData.organizations} otherSchedules={otherScheduleData.schedules} onAddOtherSchedule={otherScheduleData.addSchedule} onRemoveOtherSchedule={otherScheduleData.removeSchedule} onAddRoutine={routineData.addRoutine} onSettings={() => navigate("settings")} dashboard={dashboard} summary={summary} clock={clock} onOpenCourse={setWorkspace} avatarUrl={profileAvatar.avatarUrl} />}
            {view === "courses" && <CoursesView onOpen={setWorkspace} courses={myCourses} semesterLabel={setup ? `Semester ${setup.currentSemester}` : `Semester ${dashboard?.current_semester ?? 1}`} todayName={clock.dayKey} summary={summary} />}
            {view === "curriculum" && <CurriculumExplorer rows={curriculumRows} loading={curriculumLoading} dashboard={dashboard} onOpenSetup={openSetupEditor} />}
            {view === "planner" && <KrsPlanner rows={curriculumRows} loading={curriculumLoading} dashboard={dashboard} userId={userId} onOpenSetup={openSetupEditor} onSaved={() => { void refreshCurriculum(); void refreshLiveCourses(); void refreshDashboard(); }} />}
            {view === "calendar" && <CalendarView studySessions={studySessions} assistantSessions={semesterData.sessions} tasks={tasks} milestones={milestoneRows} routines={routineData.routines} organizations={organizationData.organizations} otherSchedules={otherScheduleData.schedules} onRemoveRoutine={routineData.removeRoutine} />}
            {view === "tasks" && <TasksView tasks={tasks} toggleTask={toggleTask} updateTask={updateTask} addTask={addTask} deleteTask={deleteTask} navigate={navigate} courses={myCourses} todayIso={clock.iso} />}
            {view === "library" && <LibraryView library={library} organizations={organizationData.organizations} organizationActions={organizationData} />}
            {view === "study" && <StudyMethodsView />}
            {view === "settings" && <SettingsView setup={setup} data={exportData} progress={degreeProgress(setup?.completed ?? [])} onBack={() => navigate("home")} onEditSetup={openSetupEditor} avatarUrl={profileAvatar.avatarUrl} hasAvatar={profileAvatar.hasAvatar} onUploadAvatar={profileAvatar.upload} onRemoveAvatar={profileAvatar.remove} />}
          </div>
        )}
      </main>
      {!workspace && !exam && !journey && <BottomNav view={view} navigate={navigate} />}

      <QuickAdd
        courses={myCourses.map((course) => course.title)}
        organizations={organizationData.organizations.map((organization) => organization.name)}
        onAddRoutine={routineData.addRoutine}
        onAddTask={({ title, link, course, organization, dueIso, dueTime }) => {
          const match = myCourses.find((item) => item.title === course);
          const label = link === "organization" ? organization : link === "none" ? "To-do pribadi" : course;
          const code = link === "organization" ? "ORG" : link === "none" ? "TODO" : match?.code ?? "";
          const time = dueTime || "23:59";
          const dueLabel = dueIso ? formatDayMonthId(dueIso) : "Tanpa tenggat";
          addTask({
            id: Date.now(), title, course: label, courseCode: code, category: "Research",
            due: dueLabel, dueDate: dueIso ? `${dueIso} · ${time}` : "", ...(dueIso ? { dueIso, dueTime: time } : {}),
            priority: "Medium", status: "Not started", done: false,
            description: "Dibuat lewat tambah cepat.", resources: [], checklist: [],
          });
        }}
        onAddNote={() => setNotesAdded((count) => count + 1)}
        onAddResource={() => setResourcesAdded((count) => count + 1)}
        onAddSession={({ day, date, time, duration, topic }) => addStudySession({ eventId: exam?.id ?? 1, day, date, time, duration, topic })}
        onAddCourse={({ name, provider, sks, day, time, room }) => {
          if (!setup) return;
          const custom = {
            code: `EXTRA-${Date.now()}`, name, faculty: provider, sks,
            lecturer: provider, day: (day as StudentSetup["active"][number]["day"]), start: time.split(" – ")[0] ?? "08:00",
            end: time.split(" – ")[1] ?? "10:00", room, countsTowardGraduation: false,
          };
          saveSetup({ ...setup, customCourses: [...(setup.customCourses ?? []), custom] });
        }}
      />

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        courses={myCourses}
        tasks={tasks.map((task) => ({ id: task.id, title: task.title, course: task.course, due: task.due, status: task.status }))}
        onOpenCourse={openCourseByCode}
        onNavigate={navigate}
      />
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications.items} read={notifications.read} onRead={notifications.markRead} onReadAll={notifications.markAllRead} />
    </div>
  );
}

function Brand() {
  return <div className="flex min-w-0 items-center gap-3"><img src={logoAsset} alt="Logo MR Labs" className="h-10 w-auto max-w-40 shrink-0 object-contain" /><span className="sr-only">MR Labs</span></div>;
}

function DesktopHeader({ view, navigate, onSearch, onNotifications, notificationCount, onSettings, avatarUrl, profileName }: { view: View; navigate: (view: View) => void; onSearch: () => void; onNotifications: () => void; notificationCount: number; onSettings: () => void; avatarUrl: string | null; profileName: string }) {
  const inOthers = otherNavItems.some((item) => item.id === view);
  return <header className="sticky top-0 z-30 hidden border-b border-border bg-surface/95 backdrop-blur md:block"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6"><Brand /><nav className="flex gap-1">{navItems.map(({ id, label }) => <Button key={id} variant={view === id ? "academic" : "ghost"} onClick={() => navigate(id)}>{label}</Button>)}
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant={inOthers ? "academic" : "ghost"}>Lainnya <ChevronDown className="size-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {otherNavItems.map(({ id, label, icon: Icon }) => <DropdownMenuItem key={id} onSelect={() => navigate(id)} className="gap-2 text-sm font-semibold"><Icon className="size-4 text-academic" />{label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  </nav><div className="flex items-center gap-2"><button onClick={onSearch} aria-label="Cari" className="grid size-9 place-items-center rounded-full bg-muted text-academic transition-colors hover:bg-accent"><Search className="size-4" /></button><NotificationBell count={notificationCount} onClick={onNotifications} /><button onClick={onSettings} aria-label="Pengaturan" className={`grid size-9 place-items-center rounded-full transition-colors ${view === "settings" ? "bg-academic text-academic-foreground" : "bg-muted text-academic hover:bg-accent"}`}><Settings className="size-4" /></button><button onClick={onSettings} aria-label="Profil kamu" className="rounded-full"><ProfileAvatar src={avatarUrl} name={profileName} className="size-9" /></button></div></div></header>;
}


const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Beranda", icon: Home }, { id: "courses", label: "Mata Kuliah", icon: BookOpen }, { id: "calendar", label: "Kalender", icon: CalendarDays }, { id: "library", label: "Pustaka", icon: Library }, { id: "study", label: "Belajar", icon: Timer },
];

const otherNavItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "tasks", label: "Tugas", icon: ListTodo }, { id: "curriculum", label: "Kurikulum", icon: Layers }, { id: "planner", label: "Perencana", icon: Target },
];

const allNavItems = [...navItems, ...otherNavItems];

function BottomNav({ view, navigate }: { view: View; navigate: (view: View) => void }) {
  const inOthers = otherNavItems.some((item) => item.id === view);
  return <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-surface/95 px-1 pt-2 shadow-[0_-8px_24px_color-mix(in_oklab,var(--academic)_8%,transparent)] backdrop-blur md:hidden">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => navigate(id)} aria-label={label} className={`flex min-w-0 flex-col items-center gap-1 py-1 text-[9px] font-semibold transition-colors ${view === id ? "text-academic" : "text-muted-foreground"}`}><span className={`grid size-8 place-items-center rounded-xl ${view === id ? "bg-primary" : ""}`}><Icon className="size-4" /></span><span className="w-full truncate px-0.5 text-center">{label}</span></button>)}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Lainnya" className={`flex min-w-0 flex-col items-center gap-1 py-1 text-[9px] font-semibold transition-colors ${inOthers ? "text-academic" : "text-muted-foreground"}`}>
          <span className={`grid size-8 place-items-center rounded-xl ${inOthers ? "bg-primary" : ""}`}><MoreHorizontal className="size-4" /></span>
          <span className="w-full truncate px-0.5 text-center">Lainnya</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-44">
        {otherNavItems.map(({ id, label, icon: Icon }) => <DropdownMenuItem key={id} onSelect={() => navigate(id)} className="gap-2 text-sm font-semibold"><Icon className="size-4 text-academic" />{label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  </nav>;
}

function MobileTop({ eyebrow, title, action }: { eyebrow: string; title: React.ReactNode; action?: React.ReactNode }) {
  return <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 md:hidden"><div className="min-w-0"><p className="mb-1 text-xs font-semibold uppercase text-academic">{eyebrow}</p><h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold leading-8">{title}</h1></div>{action}</div>;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) { return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-bold md:text-lg">{title}</h2>{action}</div>; }

function HomeView({ tasks, toggleTask, navigate, onOpenExam, onOpenJourney, onSearch, onNotifications, notificationCount, studySessions, resourcesAdded, profile, myCourses, onEditSetup, semesterData, organizations, otherSchedules, onAddOtherSchedule, onRemoveOtherSchedule, onAddRoutine, onSettings, dashboard, summary, clock, onOpenCourse, avatarUrl }: { tasks: Task[]; toggleTask: (id: number) => void; navigate: (view: View) => void; onOpenExam: (exam: Exam) => void; onOpenJourney: () => void; onSearch: () => void; onNotifications: () => void; notificationCount: number; studySessions: number; resourcesAdded: number; profile: StudentSetup | null; myCourses: Course[]; onEditSetup: () => void; semesterData: ReturnType<typeof useSemesterData>; organizations: Organization[]; otherSchedules: OtherSchedule[]; onAddOtherSchedule: (schedule: Omit<OtherSchedule, "id">) => void; onRemoveOtherSchedule: (id: number) => void; onAddRoutine: (routine: Omit<Routine, "id">) => void; onSettings: () => void; dashboard: DashboardRow | null; summary: ReturnType<typeof academicSummary>; clock: ReturnType<typeof jakartaNow>; onOpenCourse: (course: Course) => void; avatarUrl: string | null }) {
  const { dayName } = useNow();
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"once" | "weekly" | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<UpcomingOtherSchedule | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<Omit<OtherSchedule, "id">>({ type: "Kegiatan lainnya", title: "", date: addDaysIso(clock.iso, 1), start: "", end: "", location: "", organizer: "", description: "", url: "" });
  const [routineDraft, setRoutineDraft] = useState<{ title: string; type: RoutineType; organization: string; days: RoutineDay[]; start: string; end: string; location: string }>({ title: "", type: "Rutinitas pribadi", organization: "", days: [], start: "", end: "", location: "" });
  const openTasks = tasks.filter((task) => !task.done);
  const featuredTask = openTasks[0];
  const quickActions = allNavItems.filter((item) => item.id !== "home");
  const todayName = dayName;
  const todayAgenda = [
    ...myCourses.filter((course) => course.day === todayName).map((course) => ({
      id: `course-${course.code}`, kind: "Kelas", title: course.title, section: `Kelas ${course.section ?? "-"}`,
      start: toTime24(course.time.split("–")[0]?.trim()) ?? "23:59", end: toTime24(course.time.split("–")[1]?.trim()) ?? "",
      room: course.room, person: course.lecturer, course,
    })),
    ...semesterData.sessions.filter((session) => session.day === todayName || dayKeyFromName(session.day) === clock.dayKey).map((session) => ({
      id: `assistant-${session.id}`, kind: "Asistensi", title: courseByCode.get(session.code)?.name ?? session.code, section: `Kelas ${session.section}`,
      start: toTime24(session.start) ?? "23:59", end: toTime24(session.end) ?? "", room: session.room || "Online", person: session.assistant, course: myCourses.find((course) => course.code === session.code),
    })),
    ...organizations.flatMap((organization) => organization.items.filter((item) => item.type === "Rapat rutin" && (item.day === "Everyday" || item.day === todayName || dayKeyFromName(item.day ?? "") === clock.dayKey)).map((item) => ({
      id: `organization-${organization.id}-${item.id}`, kind: "Rapat organisasi", title: item.title, section: organization.name,
      start: toTime24(item.start) ?? "23:59", end: toTime24(item.end) ?? "", room: item.room || "Tempat menyusul", person: organization.role || "Organisasi", course: undefined,
    }))),
    ...otherSchedules.filter((item) => item.date === clock.iso).map((item) => ({
      id: `other-${item.id}`, kind: item.type, title: item.title, section: item.organizer || item.type,
      start: toTime24(item.start) ?? "23:59", end: toTime24(item.end) ?? "", room: item.location || "Tempat menyusul", person: item.organizer || "Kegiatan", course: undefined,
    })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  // Kelas berikutnya dihitung dari waktu Jakarta saat ini: kelas yang sudah
  // lewat pekan ini otomatis bergeser ke pekan depan.
  const upcoming = myCourses
    .map((course) => {
      const key = dayKeyFromName(course.day);
      const [startRaw, endRaw] = course.time.split("–").map((part) => part.trim());
      const start = minutesOf(toTime24(startRaw) ?? "00:00");
      const end = minutesOf(toTime24(endRaw) ?? "23:59");
      const todayIndex = DAY_KEYS.indexOf(clock.dayKey);
      const courseIndex = key ? DAY_KEYS.indexOf(key) : -1;
      let dayDiff = courseIndex < 0 ? 99 : (courseIndex - todayIndex + 7) % 7;
      if (dayDiff === 0 && end <= clock.minutesOfDay) dayDiff = 7;
      const iso = dayDiff < 99 ? addDaysIso(clock.iso, dayDiff) : null;
      const label = dayDiff === 0 ? "Hari ini" : dayDiff === 1 ? "Besok" : todayIndex + dayDiff <= 6 ? "Minggu ini" : "Minggu depan";
      return {
        course,
        order: dayDiff * 1440 + start,
        dayDiff,
        label,
        day: `${toDayId(course.day)}${iso ? ` · ${formatDayMonthId(iso)}` : ""} · Kelas ${course.section ?? "-"}`,
        time: course.time,
        title: course.title,
        room: course.room,
        color: course.accent,
      };
    })
    .filter((item) => item.dayDiff > 0)
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);

  const nextDateForDay = (day: string) => {
    const key = dayKeyFromName(day);
    if (!key) return null;
    let diff = (DAY_KEYS.indexOf(key) - DAY_KEYS.indexOf(clock.dayKey) + 7) % 7;
    if (diff === 0) diff = 7;
    return addDaysIso(clock.iso, diff);
  };
  const scheduleLabel = (iso: string) => {
    if (iso === addDaysIso(clock.iso, 1)) return "Besok";
    return iso <= addDaysIso(clock.iso, 6) ? "Minggu ini" : "Minggu depan";
  };
  const otherUpcoming = [
    ...otherSchedules.filter((item) => item.date > clock.iso).map((item) => ({ ...item, sourceId: item.id, removable: true })),
    ...semesterData.sessions.flatMap((session) => {
      const date = nextDateForDay(session.day);
      return date ? [{ id: -session.id, sourceId: -session.id, removable: false, type: "Asistensi" as OtherScheduleType, title: courseByCode.get(session.code)?.name ?? session.code, date, start: toTime24(session.start) ?? session.start, end: toTime24(session.end) ?? session.end, location: session.room || "Online", organizer: session.assistant, description: `Kelas ${session.section}`, ...(session.link ? { url: session.link } : {}) }] : [];
    }),
    ...organizations.flatMap((organization) => organization.items.flatMap((item) => {
      if (!item.day || !["Rapat rutin", "Rutinitas harian", "Rutinitas mingguan"].includes(item.type)) return [];
      const date = item.day === "Everyday" ? addDaysIso(clock.iso, 1) : nextDateForDay(item.day);
      if (!date) return [];
      return [{ id: -(organization.id + item.id), sourceId: -(organization.id + item.id), removable: false, type: (item.type === "Rapat rutin" ? "Rapat" : "Pekerjaan organisasi") as OtherScheduleType, title: item.title, date, start: item.start ?? "", end: item.end ?? "", location: item.room || "Tempat menyusul", organizer: organization.name, description: item.description, ...(item.url ? { url: item.url } : {}) }];
    })),
  ].sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)).slice(0, 8);

  const saveOtherSchedule = () => {
    if (!scheduleDraft.title.trim() || !scheduleDraft.date || scheduleDraft.date <= clock.iso || !scheduleDraft.start) return;
    onAddOtherSchedule({ ...scheduleDraft, title: scheduleDraft.title.trim(), location: scheduleDraft.location.trim(), organizer: scheduleDraft.organizer.trim(), description: scheduleDraft.description.trim(), ...(scheduleDraft.url?.trim() ? { url: scheduleDraft.url.trim().startsWith("http") ? scheduleDraft.url.trim() : `https://${scheduleDraft.url.trim()}` } : { url: "" }) });
    setScheduleDraft({ type: "Kegiatan lainnya", title: "", date: addDaysIso(clock.iso, 1), start: "", end: "", location: "", organizer: "", description: "", url: "" });
    setAddingSchedule(false);
  };
  const saveWeeklyRoutine = () => {
    if (!routineDraft.title.trim() || !routineDraft.days.length) return;
    onAddRoutine({ title: routineDraft.title.trim(), type: routineDraft.type, ...(routineDraft.type === "Organisasi" && routineDraft.organization ? { organization: routineDraft.organization } : {}), days: routineDraft.days, ...(routineDraft.start ? { start: routineDraft.start } : {}), ...(routineDraft.end ? { end: routineDraft.end } : {}), ...(routineDraft.location.trim() ? { location: routineDraft.location.trim() } : {}) });
    setRoutineDraft({ title: "", type: "Rutinitas pribadi", organization: "", days: [], start: "", end: "", location: "" });
    setScheduleMode(null);
    setAddingSchedule(false);
  };

  const studentName = dashboard?.student_name || profile?.name || studentProfile.name;
  const semesterNumber = dashboard?.current_semester ?? profile?.currentSemester ?? studentProfile.currentSemester;
  const localProgress = degreeProgress(profile?.completed ?? []);
  const progressStats = dashboard && (dashboard.completed_credits ?? 0) > 0
    ? {
        completedSks: dashboard.completed_credits ?? 0,
        totalSks: dashboard.minimum_graduation_credit ?? localProgress.totalSks,
        remainingSks: dashboard.remaining_credits ?? 0,
        percent: dashboard.graduation_percentage ?? 0,
      }
    : localProgress;
  const activeSks = myCourses.reduce((total, course) => total + course.sks, 0);

  return <div>
    <div className="mb-4 flex items-center justify-end gap-2 md:hidden">
      <button onClick={onSearch} aria-label="Cari" className="grid size-9 place-items-center rounded-full bg-muted text-academic"><Search className="size-4" /></button>
      <NotificationBell count={notificationCount} onClick={onNotifications} />
      <button onClick={onSettings} aria-label="Profil dan pengaturan" className="rounded-full"><ProfileAvatar src={avatarUrl} name={studentName} className="size-9" /></button>
    </div>

    <div className="space-y-8">
      <section><SectionHeader title="Jadwal hari ini" action={<button onClick={() => navigate("calendar")} className="text-xs font-semibold text-academic">Jadwal lengkap</button>} />{todayAgenda.length ? <div className="academic-card divide-y divide-border">{todayAgenda.map((item) => <button type="button" key={item.id} disabled={!item.course} onClick={() => { if (!item.course) return; onOpenCourse(item.course); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="grid w-full grid-cols-[4.5rem_minmax(0,1fr)] gap-4 p-4 text-left transition-colors enabled:hover:bg-muted/50 disabled:cursor-default sm:items-center"><div><p className="font-display text-sm font-bold text-academic">{item.start}</p>{item.end && <p className="mt-1 text-[10px] text-muted-foreground">sampai {item.end}</p>}</div><div className="min-w-0 border-l-2 border-primary pl-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{item.section}</span>{item.kind !== "Kelas" && <span className="text-[10px] font-semibold uppercase text-muted-foreground">{item.kind}</span>}</div><h3 className="mt-2 text-sm font-bold">{item.title}</h3><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-academic" />{item.room}</span><span className="flex items-center gap-1.5"><UserRound className="size-3.5 text-academic" />{item.person}</span></div></div></button>)}</div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Tidak ada jadwal hari ini. Waktu yang tepat untuk belajar mandiri.</div>}</section>

      <section><SectionHeader title="Kelas berikutnya" action={<button onClick={() => navigate("calendar")} className="text-xs font-semibold text-academic">Jadwal lengkap</button>} />{upcoming.length ? <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{upcoming.map((item) => { const [dayDate, classLabel] = item.day.split(" · Kelas "); return <button type="button" key={item.time + item.title} onClick={() => { onOpenCourse(item.course); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="academic-card relative min-w-[78%] snap-start overflow-hidden text-left transition-transform hover:-translate-y-0.5 sm:min-w-72"><div className={`absolute inset-x-0 top-0 h-2 ${item.color}`} /><div className="p-4"><div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-5 gap-y-1 text-xs"><span className="font-semibold text-academic">{item.label}</span><span className="text-muted-foreground">{dayDate}</span><span className="col-start-2 text-muted-foreground">Kelas {classLabel ?? "-"}</span></div><h3 className="mt-4 min-h-10 text-sm font-bold leading-5">{item.title}</h3><div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{item.time}</span><span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{item.room}</span></div><span className="mt-3 flex items-center justify-between text-xs font-semibold text-academic">Lihat rincian<ChevronRight className="size-4" /></span></div></button>; })}</div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada kelas yang tercatat. Tambahkan mata kuliah semester ini lebih dulu.</div>}</section>

      <section><SectionHeader title="Jadwal lainnya" action={<Button variant="ghost" size="sm" onClick={() => setAddingSchedule(true)}><Plus /> Tambah jadwal</Button>} />{otherUpcoming.length ? <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{otherUpcoming.map((item) => <button type="button" key={`${item.id}-${item.date}`} onClick={() => setSelectedSchedule(item)} className="academic-card min-w-[78%] snap-start overflow-hidden text-left transition-transform hover:-translate-y-0.5 sm:min-w-72"><div className="-mx-px -mt-px h-2 w-[calc(100%+2px)] bg-success" /><div className="p-4"><div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-5 gap-y-1 text-xs"><span className="font-semibold text-academic">{scheduleLabel(item.date)}</span><span className="text-muted-foreground">{formatDateId(item.date)}</span><span className="col-start-2 text-muted-foreground">{item.type}</span></div><h3 className="mt-4 min-h-10 text-sm font-bold leading-5">{item.title}</h3><div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{item.start || "Waktu menyusul"}{item.end ? `–${item.end}` : ""}</span><span className="flex min-w-0 items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{item.location || "Tempat menyusul"}</span></span></div><span className="mt-3 flex items-center justify-between text-xs font-semibold text-academic">Lihat rincian<ChevronRight className="size-4" /></span></div></button>)}</div> : <div className="academic-card flex flex-wrap items-center justify-between gap-4 p-5"><div><h3 className="text-sm font-bold">Belum ada jadwal nonkelas</h3><p className="mt-1 text-xs text-muted-foreground">Tambahkan asistensi, rapat, lomba, konferensi, wawancara, atau kegiatan lainnya.</p></div><Button variant="yellow" size="sm" onClick={() => setAddingSchedule(true)}><Plus /> Tambah jadwal</Button></div>}</section>

      <Dialog open={addingSchedule} onOpenChange={(open) => { setAddingSchedule(open); if (!open) setScheduleMode(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Tambah jadwal lainnya</DialogTitle><DialogDescription>{scheduleMode === null ? "Apakah kegiatan ini berulang atau hanya sekali?" : scheduleMode === "weekly" ? "Atur rutinitas yang berulang otomatis setiap minggu." : "Catat kegiatan nonkelas untuk satu tanggal."}</DialogDescription></DialogHeader>
        {scheduleMode === null ? <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setScheduleMode("weekly")} className="rounded-lg border border-border p-5 text-left transition-colors hover:border-academic hover:bg-accent"><Repeat2 className="mb-4 size-6 text-academic" /><h3 className="text-sm font-bold">Berulang setiap minggu</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Untuk rutinitas pada hari yang sama setiap minggu.</p></button>
          <button type="button" onClick={() => setScheduleMode("once")} className="rounded-lg border border-border p-5 text-left transition-colors hover:border-academic hover:bg-accent"><CalendarDays className="mb-4 size-6 text-academic" /><h3 className="text-sm font-bold">Hanya sekali</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Untuk kegiatan pada satu tanggal tertentu.</p></button>
        </div> : scheduleMode === "weekly" ? <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Jenis rutinitas</span><select value={routineDraft.type} onChange={(event) => setRoutineDraft((current) => ({ ...current, type: event.target.value as RoutineType }))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">{ROUTINE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Judul</span><input value={routineDraft.title} onChange={(event) => setRoutineDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Nama rutinitas" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label>
          {routineDraft.type === "Organisasi" && <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Organisasi</span><select value={routineDraft.organization} onChange={(event) => setRoutineDraft((current) => ({ ...current, organization: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"><option value="">Pilih organisasi</option>{organizations.map((organization) => <option key={organization.id} value={organization.name}>{organization.name}</option>)}</select></label>}
          <div className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Hari</span><div className="flex flex-wrap gap-2">{ROUTINE_DAYS.map((day) => <button key={day} type="button" onClick={() => setRoutineDraft((current) => ({ ...current, days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day] }))} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${routineDraft.days.includes(day) ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{ROUTINE_DAY_LABELS[day]}</button>)}</div></div>
          <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Mulai (opsional)</span><input type="time" value={routineDraft.start} onChange={(event) => setRoutineDraft((current) => ({ ...current, start: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Selesai (opsional)</span><input type="time" value={routineDraft.end} onChange={(event) => setRoutineDraft((current) => ({ ...current, end: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label>
          <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tempat / media (opsional)</span><input value={routineDraft.location} onChange={(event) => setRoutineDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Lokasi atau Zoom" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label>
        </div> : <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Jenis</span><select value={scheduleDraft.type} onChange={(event) => setScheduleDraft((current) => ({ ...current, type: event.target.value as OtherScheduleType }))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">{OTHER_SCHEDULE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Judul</span><input value={scheduleDraft.title} onChange={(event) => setScheduleDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Nama kegiatan" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tanggal</span><input type="date" min={addDaysIso(clock.iso, 1)} value={scheduleDraft.date} onChange={(event) => setScheduleDraft((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Mulai</span><input type="time" value={scheduleDraft.start} onChange={(event) => setScheduleDraft((current) => ({ ...current, start: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Selesai (opsional)</span><input type="time" value={scheduleDraft.end} onChange={(event) => setScheduleDraft((current) => ({ ...current, end: event.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label><label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tempat / media</span><input value={scheduleDraft.location} onChange={(event) => setScheduleDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Lokasi atau Zoom" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label><label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Organisasi / penanggung jawab</span><input value={scheduleDraft.organizer} onChange={(event) => setScheduleDraft((current) => ({ ...current, organizer: event.target.value }))} placeholder="Opsional" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label><label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Deskripsi</span><textarea value={scheduleDraft.description} onChange={(event) => setScheduleDraft((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Catatan kegiatan (opsional)" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label><label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tautan</span><input value={scheduleDraft.url} onChange={(event) => setScheduleDraft((current) => ({ ...current, url: event.target.value }))} placeholder="meet.google.com/… (opsional)" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm" /></label></div>}
        <DialogFooter>{scheduleMode !== null && <Button variant="ghost" onClick={() => setScheduleMode(null)}>Kembali</Button>}<Button variant="ghost" onClick={() => { setScheduleMode(null); setAddingSchedule(false); }}>Batal</Button>{scheduleMode === "once" && <Button variant="academic" onClick={saveOtherSchedule} disabled={!scheduleDraft.title.trim() || !scheduleDraft.start || scheduleDraft.date <= clock.iso}><Save /> Simpan jadwal</Button>}{scheduleMode === "weekly" && <Button variant="academic" onClick={saveWeeklyRoutine} disabled={!routineDraft.title.trim() || !routineDraft.days.length}><Save /> Simpan rutinitas</Button>}</DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={Boolean(selectedSchedule)} onOpenChange={(open) => { if (!open) setSelectedSchedule(null); }}><DialogContent>{selectedSchedule && <><DialogHeader><DialogTitle>{selectedSchedule.title}</DialogTitle><DialogDescription>{selectedSchedule.type} · {formatDateId(selectedSchedule.date)}</DialogDescription></DialogHeader><div className="grid gap-3 text-sm"><p className="flex items-center gap-2"><Clock3 className="size-4 text-academic" />{selectedSchedule.start || "Waktu menyusul"}{selectedSchedule.end ? ` – ${selectedSchedule.end}` : ""}</p><p className="flex items-center gap-2"><MapPin className="size-4 text-academic" />{selectedSchedule.location || "Tempat menyusul"}</p>{selectedSchedule.organizer && <p className="flex items-center gap-2"><UserRound className="size-4 text-academic" />{selectedSchedule.organizer}</p>}{selectedSchedule.description && <p className="rounded-lg bg-muted p-3 leading-6 text-muted-foreground">{selectedSchedule.description}</p>}</div><DialogFooter>{selectedSchedule.url && <Button asChild variant="secondary"><a href={selectedSchedule.url} target="_blank" rel="noreferrer"><ExternalLink /> Buka tautan</a></Button>}{selectedSchedule.removable && <Button variant="destructive" onClick={() => { onRemoveOtherSchedule(selectedSchedule.sourceId); setSelectedSchedule(null); }}><Trash2 /> Hapus</Button>}</DialogFooter></>}</DialogContent></Dialog>

      {semesterData.sessions.length ? <section><SectionHeader title="Sesi asistensi" /><AssistantSessionList sessions={semesterData.sessions} showCourse /></section> : null}


      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]"><section><SectionHeader title="Pusat tugas" action={<button onClick={() => navigate("tasks")} className="text-xs font-semibold text-academic">Semua tugas · {openTasks.length}</button>} />{featuredTask ? <article className="academic-card p-5"><div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"><button onClick={() => toggleTask(featuredTask.id)} aria-label={`Selesaikan ${featuredTask.title}`} className="mt-0.5 grid size-6 place-items-center rounded-full border border-input bg-background" /><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-base font-bold">{featuredTask.title}</h3><p className="mt-1 text-xs text-muted-foreground">{featuredTask.course}</p></div><div className="flex gap-2"><span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-academic">Tenggat {featuredTask.due}</span><span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold text-destructive">{featuredTask.priority}</span></div></div><div className="mt-5 flex items-center gap-3"><Progress value={featuredTask.checklist.length ? Math.round((featuredTask.checklist.filter((item) => item.done).length / featuredTask.checklist.length) * 100) : 0} className="h-2 flex-1" /><span className="text-xs font-bold text-academic">{featuredTask.checklist.length ? Math.round((featuredTask.checklist.filter((item) => item.done).length / featuredTask.checklist.length) * 100) : 0}%</span></div></div></div></article> : <EmptyState
        icon={ListTodo}
        eyebrow="Pusat tugas"
        title={tasks.length ? "Semua tugas sudah selesai" : "Belum ada tugas yang dicatat"}
        description={tasks.length ? "Tidak ada yang menunggu saat ini. Susun jadwal belajar atau lihat rencana minggu depan." : "Tambahkan tugas pertamamu supaya tenggat, checklist, dan materi kuliah tersimpan rapi di satu tempat."}
        actions={[
          { label: tasks.length ? "Rencanakan minggu ini" : "Buat tugas pertama", icon: Plus, onClick: () => navigate("tasks") },
          { label: "Buka kalender", icon: CalendarDays, onClick: () => navigate("calendar") },
        ]}
        hints={["Tugas bisa memuat checklist, berkas, dan tautan", "Tombol tambah cepat (+) membuat tugas dari halaman mana pun"]}
        compact
      />}</section>

        <section><SectionHeader title="Progres akademik" /><div className="academic-card p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Progres studi · Semester {semesterNumber}</p><p className="mt-1 font-display text-3xl font-bold">{progressStats.percent}%</p></div><div className="grid size-16 place-items-center rounded-full border-8 border-accent text-xs font-bold text-academic">{progressStats.percent}%</div></div><Progress value={progressStats.percent} className="mt-5 h-2" /><div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl bg-muted p-3"><p className="flex items-center justify-between gap-1 text-xs text-muted-foreground">IPK<GpaEyeButton /></p><GpaValue value={summary.gpa ? summary.gpa.toFixed(2) : "—"} className="mt-1 block text-sm font-bold" /></div><Metric label="SKS lulus" value={String(progressStats.completedSks)} /><Metric label="SKS berjalan" value={String(activeSks)} /><Metric label="Mata kuliah aktif" value={String(myCourses.length)} /><Metric label="Tugas tersisa" value={String(openTasks.length)} /><Metric label="Sisa SKS" value={String(progressStats.remainingSks)} /></div><button onClick={onOpenJourney} className="mt-4 w-full rounded-xl bg-muted py-2.5 text-xs font-semibold text-academic">Lihat perjalanan akademik</button></div></section></div>


      <SemesterArchivePanel archive={semesterData.archive} suggestion={{ semester: semesterNumber, academicYear: academicYearLabel(profile?.entryYear ?? studentProfile.entryYear, semesterNumber), courses: myCourses.map((course) => course.code), sks: activeSks, resources: resourcesAdded, completedTasks: tasks.filter((task) => task.done).length }} onAdd={semesterData.addArchive} onRemove={semesterData.removeArchive} />


      <JourneyCard onOpen={onOpenJourney} setup={profile ?? null} credits={{ completedSks: progressStats.completedSks, requiredSks: progressStats.totalSks }} />

      <AcademicEventCard onPrepare={onOpenExam} />

      <ExamCenter onOpen={onOpenExam} />

      <AcademicPerformance />

      <WeeklyReview completedTasks={tasks.filter(task => task.done).length} totalTasks={tasks.length} studySessions={studySessions} classesAttended={todayAgenda.filter((item) => item.kind === "Kelas").length} resourcesAdded={resourcesAdded} />

      <section><SectionHeader title="Aksi cepat" /><div className="grid grid-cols-4 gap-2 sm:gap-3">{quickActions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => navigate(id)} className="academic-card flex min-w-0 flex-col items-center gap-2 px-2 py-4 text-center transition-transform hover:-translate-y-0.5"><span className="grid size-9 place-items-center rounded-xl bg-accent text-academic"><Icon className="size-4" /></span><span className="w-full truncate text-[11px] font-semibold sm:text-xs">{label}</span></button>)}</div></section>
    </div>
  </div>;
}


function DashboardStat({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl bg-academic-foreground/10 p-3"><p className="truncate text-[9px] opacity-70">{label}</p><p className="mt-1 truncate text-xs font-bold">{value}</p></div>; }

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>; }

function CoursesView({ onOpen, courses, semesterLabel, todayName, summary }: { onOpen: (course: Course) => void; courses: Course[]; semesterLabel: string; todayName: DayKey; summary: ReturnType<typeof academicSummary> }) {
  const todayCount = courses.filter((course) => dayKeyFromName(course.day) === todayName).length;
  const totalSks = courses.reduce((total, course) => total + course.sks, 0);

  return <div>
    <MobileTop eyebrow={semesterLabel} title="Mata Kuliah Saya" />
    <div className="mb-7 hidden md:block"><p className="text-sm text-academic">{semesterLabel}</p><h1 className="mt-1 text-3xl font-bold">Mata Kuliah Saya</h1></div>
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 rounded-full bg-academic px-3 py-1.5 text-xs font-semibold text-academic-foreground">Semester berjalan · {courses.length} mata kuliah</span>
      <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">{totalSks} SKS diambil</span>
      <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">Hari ini · {todayCount} kelas</span>
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">IPK <GpaValue value={summary.gpa ? summary.gpa.toFixed(2) : "—"} /><GpaEyeButton /></span>
    </div>
    {courses.length === 0
      ? <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada mata kuliah yang kamu ambil. Tambahkan lewat perencana KRS.</div>
      : <div className="grid gap-4 sm:grid-cols-2">{courses.map(course => <button key={course.code} onClick={() => onOpen(course)} className="academic-card group overflow-hidden text-left transition-transform hover:-translate-y-0.5">
        <div className={`h-2 ${course.accent}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-academic">{course.code}{course.section && <span className="grid size-5 shrink-0 place-items-center rounded-md bg-academic text-[10px] font-bold text-academic-foreground">{course.section}</span>}</span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{course.sks} SKS</span>
          </div>
          <h2 className="mt-3 min-h-12 text-base font-bold leading-6">{course.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold">
            <span className="rounded-full bg-accent px-2 py-1 text-academic">{courseStatusLabel(course.status)}</span>
            {course.semester ? <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">Semester {course.semester}</span> : null}
            {course.grade ? <span className="rounded-full bg-success/12 px-2 py-1 text-success">Nilai {course.grade}</span> : null}
          </div>
          <div className="mt-4"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Dosen</p><p className="mt-1 line-clamp-1 text-sm font-medium">{course.lecturer}</p></div>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-border pt-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Jadwal kuliah</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold"><CalendarDays className="size-3.5 shrink-0 text-academic" />{toDayId(course.day)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5 shrink-0" />{course.time}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Ruang</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold"><MapPin className="size-3.5 text-academic" />{course.room}</p>
              <span className="mt-2 inline-flex rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{(course.resourceCount ?? 0) + (course.fileCount ?? 0)} materi · {course.noteCount ?? 0} catatan</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-academic"><span>Buka ruang kerja</span><ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></div>
        </div>
      </button>)}</div>}
  </div>;
}

function CourseWorkspace({ course, onBack, onOpenExam, links, onAddLink, onRemoveLink, sessions, onAddSession, onRemoveSession }: { course: Course; onBack: () => void; onOpenExam: (code: string) => void; links: CourseLink[]; onAddLink: (link: Omit<CourseLink, "id">) => void; onRemoveLink: (id: number) => void; sessions: AssistantSession[]; onAddSession: (session: Omit<AssistantSession, "id">) => void; onRemoveSession: (id: number) => void }) {
  const courseExam = exams.find((item) => item.courseCode === course.code);
  const [notes, setNotes] = useState(course.notes);
  const [courseTasks, setCourseTasks] = useState(course.tasks);
  const [materials, setMaterials] = useState(course.materials);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState({ title: "", topic: "", body: "", attachment: "" });
  const assistantEvent = course.events.find(event => event.type === "Assistant");
  const completedTasks = courseTasks.filter(task => task.status === "Completed").length;
  const progress = courseTasks.length ? Math.round((completedTasks / courseTasks.length) * 100) : 0;
  const openTasks = courseTasks.filter(task => task.status !== "Completed");
  const resetNoteForm = () => { setShowNoteForm(false); setEditingNote(null); setNoteDraft({ title: "", topic: "", body: "", attachment: "" }); };
  const saveNote = () => { if (!noteDraft.title.trim() || !noteDraft.body.trim()) return; if (editingNote !== null) setNotes(items => items.map(note => note.id === editingNote ? { ...note, ...noteDraft, title: noteDraft.title.trim(), body: noteDraft.body.trim() } : note)); else setNotes(items => [{ id: Date.now(), ...noteDraft, title: noteDraft.title.trim(), body: noteDraft.body.trim() }, ...items]); resetNoteForm(); };
  const editNote = (note: CourseNote) => { setEditingNote(note.id); setNoteDraft({ title: note.title, topic: note.topic, body: note.body, attachment: note.attachment ?? "" }); setShowNoteForm(true); };
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskDraft, setTaskDraft] = useState({ title: "", due: "" });
  const saveCourseTask = () => { const title = taskDraft.title.trim(); if (!title) return; setCourseTasks(items => [{ id: Date.now(), title, due: taskDraft.due.trim() || "This week", priority: "Medium", status: "Not started" }, ...items]); setTaskDraft({ title: "", due: "" }); setShowTaskForm(false); };
  const completeCourseTask = (id: number) => setCourseTasks(items => items.map(task => task.id === id ? { ...task, status: task.status === "Completed" ? "Not started" : "Completed" } : task));
  return <div className="page-enter"><Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2"><ArrowLeft /> Mata kuliah</Button><div className="mb-6 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground md:p-8"><div className="flex items-center justify-between"><span className="text-xs font-semibold opacity-75">{course.code}</span><span className="rounded-lg bg-academic-foreground/15 px-2.5 py-1 text-xs font-semibold">{course.sks} SKS</span></div><h1 className="mt-5 max-w-3xl text-2xl font-bold md:text-3xl">{course.title}</h1><div className="mt-6 grid gap-4 border-t border-academic-foreground/15 pt-5 text-xs sm:grid-cols-2 lg:grid-cols-4"><HeaderInfo label="Dosen" value={course.lecturer} /><HeaderInfo label="Asisten dosen" value={course.assistant} /><HeaderInfo label="Jadwal mingguan" value={`${course.day}, ${course.time}`} /><HeaderInfo label="Ruang" value={course.room} /></div></div><Tabs defaultValue="overview"><TabsList className="mb-5 flex h-auto w-full justify-start overflow-x-auto bg-transparent p-0"><TabsTrigger value="overview">Ringkasan</TabsTrigger><TabsTrigger value="materials">Materi</TabsTrigger><TabsTrigger value="notes">Catatan</TabsTrigger><TabsTrigger value="tasks">Tugas</TabsTrigger><TabsTrigger value="performance">Nilai</TabsTrigger><TabsTrigger value="schedule">Jadwal</TabsTrigger><TabsTrigger value="links">Tautan</TabsTrigger><TabsTrigger value="assistant">Asistensi</TabsTrigger><TabsTrigger value="exam">Persiapan ujian</TabsTrigger></TabsList><TabsContent value="overview"><div className="grid gap-4 md:grid-cols-2"><InfoCard title="Ringkasan mata kuliah" icon={BookOpen}><p className="text-sm leading-6 text-muted-foreground">Ruang pribadimu untuk merangkai materi mingguan, menyiapkan kelas, dan menyimpan seluruh materi serta tenggat {course.title} di satu tempat.</p><Info label="Kode mata kuliah" value={course.code} /><Info label="Bobot" value={`${course.sks} SKS`} /><Info label="Status" value={courseStatusLabel(course.status)} /></InfoCard><InfoCard title="Progres saat ini" icon={CheckCircle2}><div className="flex items-end justify-between"><div><p className="font-display text-3xl font-bold">{progress}%</p><p className="mt-1 text-xs text-muted-foreground">{completedTasks} dari {courseTasks.length} tugas selesai</p></div><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{openTasks.length} tersisa</span></div><Progress value={progress} className="h-2" /></InfoCard><InfoCard title="Tim pengajar" icon={UserRound}><Info label="Dosen" value={course.lecturer} /><Info label="Asisten dosen" value={course.assistant} /><Info label="Sesi asistensi" value={assistantEvent ? `${assistantEvent.day}, ${assistantEvent.time} · ${assistantEvent.room}` : "Belum dijadwalkan"} /></InfoCard><InfoCard title="Tenggat terdekat" icon={Clock3}>{openTasks.length ? openTasks.map(task => <div key={task.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">Tenggat {task.due}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${task.priority === "High" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{task.priority}</span></div>) : <p className="text-sm text-muted-foreground">Tidak ada tenggat yang menunggu.</p>}</InfoCard></div></TabsContent><TabsContent value="materials"><MaterialsPanel materials={materials} setMaterials={setMaterials} /></TabsContent><TabsContent value="notes"><NotesPanel notes={notes} showForm={showNoteForm} editingNote={editingNote} draft={noteDraft} setDraft={setNoteDraft} onCreate={() => { resetNoteForm(); setShowNoteForm(true); }} onSave={saveNote} onCancel={resetNoteForm} onEdit={editNote} onDelete={id => setNotes(items => items.filter(note => note.id !== id))} /></TabsContent><TabsContent value="tasks"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-bold">Tugas mata kuliah</h2><p className="mt-1 text-xs text-muted-foreground">{openTasks.length} tugas masih perlu dikerjakan.</p></div><div className="flex items-center gap-3"><Button variant="yellow" size="sm" onClick={() => setShowTaskForm(true)}><Plus /> Tambah tugas</Button><span className="text-sm font-bold text-academic">{progress}%</span></div></div><Progress value={progress} className="mb-5 h-2" />{showTaskForm && <div className="academic-card mb-4 p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]"><input aria-label="Judul tugas" value={taskDraft.title} onChange={event => setTaskDraft(current => ({ ...current, title: event.target.value }))} placeholder="Judul tugas" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><input aria-label="Tenggat" value={taskDraft.due} onChange={event => setTaskDraft(current => ({ ...current, due: event.target.value }))} placeholder="24 Sep" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setShowTaskForm(false)}>Batal</Button><Button variant="academic" size="sm" onClick={saveCourseTask}><Save />Simpan tugas</Button></div></div>}{courseTasks.length ? <div className="space-y-3">{courseTasks.map(task => <CourseTaskRow key={task.id} task={task} onToggle={() => completeCourseTask(task.id)} />)}</div> : <EmptyState icon={ListTodo} eyebrow="Tugas mata kuliah" title="Belum ada tugas untuk mata kuliah ini" description="Catat tugas, studi kasus, dan kuis yang diumumkan di kelas agar tenggatnya tersimpan rapi." actions={[{ label: "Buat tugas", icon: Plus, onClick: () => setShowTaskForm(true) }]} hints={["Salin tenggat langsung dari silabus", "Latihan mingguan juga dihitung", "Tugas yang selesai mengisi bar progres di atas"]} />}</TabsContent><TabsContent value="performance"><CoursePerformance courseTitle={course.title} /></TabsContent><TabsContent value="schedule"><SchedulePanel events={course.events} />{sessions.length ? <div className="mt-6"><h2 className="mb-3 text-base font-bold">Sesi asistensi</h2><AssistantSessionList sessions={sessions} onRemove={onRemoveSession} /></div> : null}</TabsContent><TabsContent value="links"><CourseLinksPanel code={course.code} links={links} onAdd={onAddLink} onRemove={onRemoveLink} /></TabsContent><TabsContent value="assistant"><AssistantSessionsPanel code={course.code} section={course.section ?? "A"} assistant={course.assistant} sessions={sessions} onAdd={onAddSession} onRemove={onRemoveSession} /></TabsContent><TabsContent value="exam">{courseExam ? <div className="academic-card p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{courseExam.type}</span><h3 className="mt-3 text-lg font-bold">{courseExam.course}</h3><p className="mt-1 text-sm text-muted-foreground">{courseExam.date} · {courseExam.room}</p></div><span className="rounded-xl bg-academic px-3 py-2 text-xs font-semibold text-academic-foreground">{courseExam.daysLeft} hari lagi</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{courseExam.resources.slice(0, 3).map(resource => <div key={resource.id} className="rounded-xl bg-muted p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{resource.kind}</p><p className="mt-1 line-clamp-2 text-sm font-semibold">{resource.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{resource.source}</p></div>)}</div><Button variant="academic" className="mt-5" onClick={() => onOpenExam(course.code)}>Buka pusat persiapan belajar<ChevronRight /></Button></div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada ujian yang dijadwalkan untuk mata kuliah ini.</div>}</TabsContent></Tabs></div>;
}

function HeaderInfo({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="opacity-65">{label}</p><p className="mt-1 line-clamp-2 font-semibold">{value}</p></div>; }
function InfoCard({ title, icon: Icon, children }: { title: string; icon: typeof UserRound; children: React.ReactNode }) { return <section className="academic-card p-5"><div className="mb-5 flex items-center gap-2"><Icon className="size-5 text-academic" /><h2 className="text-base font-bold">{title}</h2></div><div className="space-y-4">{children}</div></section>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
function MaterialsPanel({ materials, setMaterials }: { materials: CourseMaterial[]; setMaterials: React.Dispatch<React.SetStateAction<CourseMaterial[]>> }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<{ title: string; type: CourseMaterial["type"]; description: string; attachment: string }>({ title: "", type: "PDF", description: "", attachment: "" });
  const saveMaterial = () => { if (!draft.title.trim() || !draft.description.trim()) return; setMaterials(items => [{ id: Date.now(), ...draft, title: draft.title.trim(), description: draft.description.trim(), attachment: draft.attachment || "Saved resource" }, ...items]); setDraft({ title: "", type: "PDF", description: "", attachment: "" }); setShowForm(false); };
  const iconFor = (type: CourseMaterial["type"]) => type === "Textbook" ? BookOpen : type === "External link" || type === "Article" ? Link2 : FileText;
  return <div><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-bold">Materi akademik</h2><p className="mt-1 text-xs text-muted-foreground">Bacaan, berkas, dan referensi untuk mata kuliah ini.</p></div><Button variant="yellow" size="sm" onClick={() => setShowForm(true)}><Plus /> Tambah materi</Button></div>{showForm && <div className="academic-card mb-4 p-4"><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Judul materi" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Judul materi" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><select aria-label="Jenis materi" value={draft.type} onChange={event => setDraft(current => ({ ...current, type: event.target.value as CourseMaterial["type"] }))} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">{["Textbook", "Slides", "PDF", "External link", "Article"].map(type => <option key={type}>{type}</option>)}</select></div><textarea aria-label="Deskripsi materi" value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} placeholder="Deskripsi singkat" className="mt-3 min-h-24 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-xs text-muted-foreground"><Paperclip className="size-4 text-academic" /><span className="min-w-0 flex-1 truncate">{draft.attachment || "Lampirkan berkas atau simpan tautan"}</span><input type="file" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) setDraft(current => ({ ...current, attachment: file.name })); }} /></label><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Batal</Button><Button variant="academic" size="sm" onClick={saveMaterial}><Save />Simpan materi</Button></div></div>}{materials.length ? <div className="academic-card divide-y divide-border">{materials.map(material => { const Icon = iconFor(material.type); const isLink = material.type === "External link" || material.type === "Article"; const ActionIcon = isLink ? ExternalLink : Download; return <article key={material.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-academic"><Icon className="size-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{material.title}</h3><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">{material.type}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{material.description}</p><p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-academic"><Paperclip className="size-3" />{material.attachment}</p></div><Button variant="ghost" size="sm" className="col-start-2 justify-self-start sm:col-start-auto sm:justify-self-auto"><ActionIcon />{isLink ? "Buka" : "Unduh"}</Button></article>; })}</div> : <EmptyState icon={FileText} eyebrow="Materi kuliah" title="Belum ada materi tersimpan" description="Simpan slide, bab buku, dan tautan bacaan mata kuliah ini di satu rak agar tidak perlu mencari di obrolan sebelum kelas." actions={[{ label: "Tambah materi pertama", icon: Plus, onClick: () => setShowForm(true) }]} hints={["Unggah slide tepat setelah kelas", "Simpan buku acuan dan babnya", "Tempel tautan artikel jurnal atau rekaman kelas"]} />}</div>;
}

function NotesPanel({ notes, showForm, editingNote, draft, setDraft, onCreate, onSave, onCancel, onEdit, onDelete }: { notes: CourseNote[]; showForm: boolean; editingNote: number | null; draft: { title: string; topic: string; body: string; attachment: string }; setDraft: React.Dispatch<React.SetStateAction<{ title: string; topic: string; body: string; attachment: string }>>; onCreate: () => void; onSave: () => void; onCancel: () => void; onEdit: (note: CourseNote) => void; onDelete: (id: number) => void }) { return <div><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-bold">Catatan belajar pribadi</h2><p className="mt-1 text-xs text-muted-foreground">Tersusun per topik, hanya untukmu.</p></div><Button variant="yellow" size="sm" onClick={onCreate}><Plus /> Catatan baru</Button></div>{showForm && <div className="academic-card mb-4 p-4"><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Judul catatan" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Judul catatan" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><input aria-label="Topik catatan" value={draft.topic} onChange={event => setDraft(current => ({ ...current, topic: event.target.value }))} placeholder="Topik, misalnya Minggu 5" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><textarea aria-label="Isi catatan" value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))} placeholder="Tulis catatan belajarmu…" className="mt-3 min-h-32 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-xs text-muted-foreground"><Paperclip className="size-4 text-academic" /><span className="min-w-0 flex-1 truncate">{draft.attachment || "Lampirkan berkas"}</span><input type="file" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) setDraft(current => ({ ...current, attachment: file.name })); }} /></label><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={onCancel}>Batal</Button><Button variant="academic" size="sm" onClick={onSave}><Save />{editingNote === null ? "Simpan catatan" : "Simpan perubahan"}</Button></div></div>}<div className="grid gap-3 md:grid-cols-2">{notes.map(note => <article key={note.id} className="academic-card p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{note.topic || "Umum"}</span><h3 className="mt-3 text-sm font-bold">{note.title}</h3></div><div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label={`Ubah ${note.title}`} onClick={() => onEdit(note)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Hapus ${note.title}`} onClick={() => onDelete(note.id)}><Trash2 /></Button></div></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{note.body}</p>{note.attachment && <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs font-medium text-academic"><Paperclip className="size-3.5" />{note.attachment}</p>}</article>)}{!notes.length && <div className="md:col-span-2"><EmptyState icon={NotebookPen} eyebrow="Catatan belajar" title="Catatanmu untuk mata kuliah ini dimulai di sini" description="Tulis inti setiap sesi selagi masih segar. Catatan tetap terhubung ke mata kuliah ini dan muncul di pencarian." actions={[{ label: "Tulis catatan pertama", icon: Plus, onClick: onCreate }]} hints={["Satu catatan per minggu memudahkan review ujian", "Tambahkan topik agar mudah disaring", "Lampirkan foto papan tulis atau berkas"]} /></div>}</div></div>; }

function CourseTaskRow({ task, onToggle }: { task: CourseTask; onToggle: () => void }) { const done = task.status === "Completed"; return <article className="academic-card grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><button onClick={onToggle} aria-label={done ? `Tandai ${task.title} belum selesai` : `Selesaikan ${task.title}`} className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${done ? "border-success bg-success text-academic-foreground" : "border-input bg-background"}`}>{done && <Check className="size-3.5" />}</button><div className="min-w-0"><h3 className={`text-sm font-semibold ${done ? "text-muted-foreground line-through" : ""}`}>{task.title}</h3><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">Tenggat {task.due}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${task.priority === "High" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>Prioritas {priorityLabel[task.priority]}</span></div></div><span className={`col-start-2 text-xs font-semibold sm:col-start-auto ${done ? "text-success" : task.status === "In progress" ? "text-academic" : "text-muted-foreground"}`}>{taskStatusLabel[task.status]}</span></article>; }

function SchedulePanel({ events }: { events: CourseEvent[] }) { return <div><div className="mb-4"><h2 className="text-base font-bold">Jadwal mata kuliah</h2><p className="mt-1 text-xs text-muted-foreground">Kuliah, sesi asistensi, dan agenda akademik.</p></div><div className="academic-card divide-y divide-border">{events.map(event => <article key={`${event.type}-${event.title}`} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center"><div><p className="font-display text-sm font-bold text-academic">{event.time.split(" – ")[0]}</p><p className="mt-1 text-[10px] text-muted-foreground">{event.day}</p></div><div className="min-w-0 border-l-2 border-primary pl-4"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{event.type}</span><h3 className="mt-2 text-sm font-semibold">{event.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />{event.room}</p></div><div className="col-start-2 text-xs text-muted-foreground sm:col-start-auto sm:text-right"><p>{event.date ?? "Setiap minggu"}</p><p className="mt-1">{event.time}</p></div></article>)}</div></div>; }

/** Keeps the Jakarta date and time current, refreshing on every minute change. */
function useJakartaClock() {
  const [now, setNow] = useState(() => jakartaNow());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(jakartaNow());
      timer = setTimeout(tick, nextMinuteDelay());
    };
    timer = setTimeout(tick, nextMinuteDelay());
    return () => clearTimeout(timer);
  }, []);
  return now;
}

const SCHEDULE_DAYS: { key: DayKey; label: string }[] = [
  { key: "Mon", label: "Senin" }, { key: "Tue", label: "Selasa" }, { key: "Wed", label: "Rabu" },
  { key: "Thu", label: "Kamis" }, { key: "Fri", label: "Jumat" }, { key: "Sat", label: "Sabtu" }, { key: "Sun", label: "Minggu" },
];

const emptyScheduleDraft: ScheduleInput = { courseId: "", dayKey: "Mon", start: "08:00", end: "10:30", room: "" };

/** Add, edit, and delete the student's own rows in course_schedules. */
function ScheduleManager({ rows, options, error, onCreate, onUpdate, onRemove }: {
  rows: ScheduleRow[];
  options: { id: string; code: string; name: string }[];
  error: string | null;
  onCreate: (input: ScheduleInput) => Promise<string | null>;
  onUpdate: (id: string, input: ScheduleInput) => Promise<string | null>;
  onRemove: (id: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScheduleInput>(emptyScheduleDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => { setEditingId(null); setDraft(emptyScheduleDraft); setOpen(false); };

  const startEdit = (row: ScheduleRow) => {
    setEditingId(row.id);
    setDraft({ courseId: row.courseId ?? "", dayKey: row.dayKey, start: row.start, end: row.end ?? "", room: row.room });
    setOpen(true);
    setMessage(null);
  };

  const save = async () => {
    if (!draft.courseId) { setMessage("Pilih mata kuliah dulu."); return; }
    setSaving(true);
    const failure = editingId ? await onUpdate(editingId, draft) : await onCreate(draft);
    setSaving(false);
    if (failure) { setMessage(failure); return; }
    setMessage(editingId ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
    reset();
  };

  const field = "rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return <div className="mt-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">Kelola jadwal kuliahmu — tersimpan langsung di database.</p>
      <Button variant="yellow" size="sm" onClick={() => { setMessage(null); setEditingId(null); setDraft(emptyScheduleDraft); setOpen((value) => !value); }}>
        <Plus /> Tambah jadwal
      </Button>
    </div>

    {(message || error) && <p className="mt-3 text-xs text-muted-foreground">{message ?? `Gagal memuat jadwal: ${error}`}</p>}

    {open && <div className="academic-card mt-3 p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <select aria-label="Mata kuliah" value={draft.courseId} onChange={(event) => setDraft((current) => ({ ...current, courseId: event.target.value }))} className={`${field} sm:col-span-2`}>
          <option value="">Pilih mata kuliah</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.code ? `${option.code} · ` : ""}{option.name}</option>)}
        </select>
        <select aria-label="Hari" value={draft.dayKey} onChange={(event) => setDraft((current) => ({ ...current, dayKey: event.target.value as DayKey }))} className={field}>
          {SCHEDULE_DAYS.map((day) => <option key={day.key} value={day.key}>{day.label}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Jam mulai" type="time" value={draft.start} onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))} className={field} />
          <input aria-label="Jam selesai" type="time" value={draft.end} onChange={(event) => setDraft((current) => ({ ...current, end: event.target.value }))} className={field} />
        </div>
        <input aria-label="Ruang" value={draft.room} onChange={(event) => setDraft((current) => ({ ...current, room: event.target.value }))} placeholder="A.306" className={field} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={reset}>Batal</Button>
        <Button variant="academic" size="sm" disabled={saving} onClick={() => void save()}><Save /> {editingId ? "Simpan perubahan" : "Simpan jadwal"}</Button>
      </div>
    </div>}

    {rows.length > 0 && <div className="academic-card mt-3 divide-y divide-border">
      {rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{row.courseName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.dayLabelId} · {row.start}{row.end ? ` - ${row.end}` : ""}{row.room ? ` · ${row.room}` : ""}{row.courseCode ? ` · ${row.courseCode}` : ""}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" aria-label="Ubah jadwal" onClick={() => startEdit(row)}><Pencil /></Button>
          <Button variant="ghost" size="icon" aria-label="Hapus jadwal" onClick={() => void onRemove(row.id).then((failure) => setMessage(failure ?? "Jadwal dihapus."))}><Trash2 /></Button>
        </div>
      </div>)}
    </div>}
  </div>;
}



function CalendarView({ studySessions = [], assistantSessions = [], tasks = [], milestones = [], routines = [], organizations = [], otherSchedules = [], onRemoveRoutine }: { studySessions?: PlannedSession[]; assistantSessions?: AssistantSession[]; tasks?: Task[]; milestones?: MilestoneRow[]; routines?: Routine[]; organizations?: Organization[]; otherSchedules?: OtherSchedule[]; onRemoveRoutine?: (id: number) => void }) {
  const now = useJakartaClock();
  const [viewIso, setViewIso] = useState(now.iso);
  const week = useMemo(() => weekOf(viewIso), [viewIso]);
  const [selectedIso, setSelectedIso] = useState(now.iso);
  useEffect(() => {
    setSelectedIso((current) => (week.some((day) => day.iso === current) ? current : (week.some((day) => day.iso === now.iso) ? now.iso : week[0]!.iso)));
  }, [week, now.iso]);
  const [filter, setFilter] = useState<"All" | EventType>("All");
  const { rows: schedules, error: scheduleError, create: createSchedule, update: updateSchedule, remove: removeSchedule } = useCourseSchedules();
  const { courses: calendarCourses } = useStudentCourses();
  const courseOptions = useCourseOptions();
  const selected = week.find((day) => day.iso === selectedIso) ?? week.find((day) => day.iso === now.iso) ?? week[0]!;

  const allEvents = useMemo<CalendarEvent[]>(() => {
    const isoOf = (key: DayKey | null) => (key ? week.find((day) => day.key === key)?.iso : undefined);
    const events: CalendarEvent[] = [];

    // Weekly classes come only from course_schedules in Supabase.
    for (const item of schedules) {
      const iso = isoOf(item.dayKey);
      if (!iso) continue;
      events.push({
        id: `schedule-${item.id}`,
        type: "Lecture",
        day: item.dayKey,
        date: iso,
        title: item.courseName,
        start: item.start,
        ...(item.end ? { end: item.end } : {}),
        location: item.room || "Kampus",
        ...(item.courseCode ? { course: item.courseCode } : {}),
      });
    }

    // Mata kuliah yang jadwalnya diisi lewat "Mata Kuliah Saya" juga tampil di kalender.
    const scheduledCourseKeys = new Set(schedules.flatMap((item) => [item.courseId, item.courseCode].filter(Boolean) as string[]));
    for (const course of calendarCourses) {
      if (["COMPLETED", "completed"].includes(course.status)) continue;
      if (scheduledCourseKeys.has(course.courseId) || (course.code && scheduledCourseKeys.has(course.code))) continue;
      const key = dayKeyFromName(course.day);
      const iso = isoOf(key);
      if (!iso || !course.start) continue;
      events.push({
        id: `course-${course.id}`,
        type: "Lecture",
        day: key!,
        date: iso,
        title: course.name || course.code,
        start: course.start,
        ...(course.end ? { end: course.end } : {}),
        location: course.room || "Kampus",
        ...(course.code ? { course: course.code } : {}),
      });
    }

    for (const task of tasks) {
      if (task.done) continue;
      const iso = task.dueIso ?? parseDueDate(task.dueDate || task.due)?.iso;
      if (!iso) continue;
      const key = dayKeyOfIso(iso);
      const type: EventType = task.courseCode === "TODO" ? "Todo" : task.courseCode === "ORG" ? "Organization" : "Deadline";
      events.push({
        id: `task-${task.id}`,
        type,
        day: key,
        date: iso,
        title: task.title,
        start: task.dueTime ?? parseDueDate(task.dueDate || task.due)?.time ?? "23:59",
        location: type === "Deadline" ? "Batas pengumpulan" : type === "Organization" ? "Tugas organisasi" : "To-do pribadi",
        course: task.course,
        priority: task.priority,
        detail: task.category,
      });
    }

    // Rutinitas mingguan: muncul otomatis pada setiap hari yang dipilih.
    for (const routine of routines) {
      for (const dayKey of routine.days) {
        const iso = isoOf(dayKey as DayKey);
        if (!iso) continue;
        events.push({
          id: `routine-${routine.id}-${dayKey}`,
          type: "Routine",
          day: dayKey,
          date: iso,
          title: routine.title,
          start: routine.start || "00:00",
          ...(routine.end ? { end: routine.end } : {}),
          location: routine.location || (routine.start ? "Rutinitas mingguan" : "Sepanjang hari"),
          ...(routine.organization ? { course: routine.organization } : {}),
          detail: routine.type,
        });
      }
    }

    // Kegiatan organisasi yang punya jadwal berulang atau hari tertentu.
    for (const organization of organizations) {
      for (const item of organization.items) {
        const dayKey = item.day === "Everyday" ? null : dayKeyFromName(item.day ?? "");
        const days = item.day === "Everyday" ? week.map((day) => day.key) : dayKey ? [dayKey] : [];
        if (!days.length) continue;
        for (const key of days) {
          const iso = isoOf(key as DayKey);
          if (!iso) continue;
          events.push({
            id: `organization-${organization.id}-${item.id}-${key}`,
            type: "Organization",
            day: key,
            date: iso,
            title: item.title,
            start: toTime24(item.start ?? "") || "00:00",
            ...(toTime24(item.end ?? "") ? { end: toTime24(item.end ?? "")! } : {}),
            location: item.room || organization.name,
            course: organization.name,
            detail: item.type,
          });
        }
      }
    }

    // Agenda lain yang dibuat sendiri (rapat, lomba, wawancara, dll.).
    for (const schedule of otherSchedules) {
      const iso = parseDueDate(schedule.date)?.iso ?? schedule.date;
      const key = dayKeyOfIso(iso);
      if (!key) continue;
      events.push({
        id: `other-${schedule.id}`,
        type: "Organization",
        day: key,
        date: iso,
        title: schedule.title,
        start: toTime24(schedule.start) || "00:00",
        ...(toTime24(schedule.end) ? { end: toTime24(schedule.end)! } : {}),
        location: schedule.location || "Tempat menyusul",
        ...(schedule.organizer ? { course: schedule.organizer } : {}),
        detail: schedule.type,
      });
    }

    for (const milestone of milestones) {
      const at = jakartaFromTimestamp(milestone.starts_at);
      const key = dayKeyOfIso(at.iso);
      events.push({
        id: `milestone-${milestone.id}`,
        type: "Milestone",
        day: key,
        date: at.iso,
        title: milestone.title,
        start: at.time,
        location: milestone.course_code ?? milestone.milestone_type,
        ...(milestone.course_code ? { course: milestone.course_code } : {}),
        detail: milestone.milestone_type,
      });
    }

    for (const session of studySessions) {
      const key = dayKeyFromName(session.day);
      const start = toTime24(session.time);
      const iso = parseDueDate(session.date)?.iso ?? isoOf(key);
      if (!key || !start || !iso) continue;
      events.push({
        id: `study-${session.id}`,
        type: "Study",
        day: key,
        date: iso,
        title: `Belajar: ${session.topic}`,
        start,
        location: `${session.duration} sesi fokus`,
      });
    }

    for (const session of assistantSessions) {
      const key = dayKeyFromName(session.day);
      const start = toTime24(session.start);
      const iso = isoOf(key);
      if (!key || !start || !iso) continue;
      const end = toTime24(session.end);
      events.push({
        id: `assistant-${session.id}`,
        type: "Assistant",
        day: key,
        date: iso,
        title: `Asistensi · ${courseByCode.get(session.code)?.name ?? session.code}`,
        start,
        ...(end ? { end } : {}),
        location: session.room || "Online",
        course: `Kelas ${session.section}`,
        ...(session.assistant ? { person: session.assistant } : {}),
      });
    }

    return events;
  }, [schedules, calendarCourses, tasks, studySessions, assistantSessions, milestones, routines, organizations, otherSchedules, week]);

  const byIso = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const day of week) {
      map[day.iso] = allEvents
        .filter((event) => event.date === day.iso && (filter === "All" || event.type === filter))
        .sort((a, b) => a.start.localeCompare(b.start));
    }
    return map;
  }, [filter, allEvents, week]);

  const upcomingDeadlines = useMemo(
    () => allEvents.filter((event) => event.type === "Deadline" && (event.date ?? "") >= now.iso).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)).slice(0, 4),
    [allEvents, now.iso],
  );
  const filters: ("All" | EventType)[] = ["All", "Lecture", "Assistant", "Deadline", "Todo", "Routine", "Organization", "Study", "Milestone"];
  const reminders = useMemo(() => buildReminders(allEvents as AgendaEvent[], now), [allEvents, now]);
  const timeline = useMemo(() => buildTimeline(milestones.map((milestone) => {
    const at = jakartaFromTimestamp(milestone.starts_at);
    const end = milestone.ends_at ? jakartaFromTimestamp(milestone.ends_at).iso : undefined;
    return {
      id: milestone.id,
      label: milestone.milestone_type,
      title: milestone.title,
      ...(milestone.description ? { detail: milestone.description } : {}),
      date: at.iso,
      ...(end ? { endDate: end } : {}),
      start: at.time,
      daysAway: 0,
    } satisfies TimelineItem;
  }), now), [milestones, now]);
  const weeklyClasses = useMemo(() => week.map((day) => ({
    ...day,
    classes: allEvents.filter((event) => event.type === "Lecture" && event.date === day.iso).sort((a, b) => a.start.localeCompare(b.start)),
  })), [week, allEvents]);
  const hasClasses = weeklyClasses.some((day) => day.classes.length > 0);

  const [, viewMonth = "1"] = viewIso.split("-");
  const monthLabel = `${monthNameId(Number(viewMonth))} ${viewIso.slice(0, 4)}`;
  const weekRangeLabel = `${formatDayMonthId(week[0]!.iso)} – ${formatDayMonthId(week[6]!.iso)}`;

  return <div>
    <MobileTop eyebrow={monthLabel} title="Kalender Akademik" action={<Button variant="outline" size="icon" aria-label="Opsi kalender"><MoreHorizontal /></Button>} />
    <div className="mb-7 hidden items-end justify-between md:flex">
      <div><p className="text-sm text-academic">{formatDateId(now.iso)} · {now.time} WIB</p><h1 className="mt-1 text-3xl font-bold">Kalender Akademik</h1></div>
      <div className="flex gap-2"><span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-academic">{weekRangeLabel}</span><span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">{monthLabel}</span></div>
    </div>

    <div className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {filters.map(value => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === value ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{value === "All" ? "Semua" : eventStyles[value].label}</button>)}
    </div>

    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex gap-1">
        <Button variant="outline" size="icon" aria-label="Bulan sebelumnya" onClick={() => setViewIso(value => shiftMonthIso(value, -1))}><ChevronsLeft /></Button>
        <Button variant="outline" size="icon" aria-label="Minggu sebelumnya" onClick={() => setViewIso(value => addDaysIso(value, -7))}><ChevronLeft /></Button>
      </div>
      <div className="min-w-0 text-center">
        <p className="truncate text-sm font-bold">{weekRangeLabel}</p>
        <p className="text-[11px] text-muted-foreground">{monthLabel}{week.some((day) => day.iso === now.iso) ? " · Minggu ini" : ""}</p>
      </div>
      <div className="flex gap-1">
        {!week.some((day) => day.iso === now.iso) && <Button variant="ghost" size="sm" onClick={() => setViewIso(now.iso)}>Hari ini</Button>}
        <Button variant="outline" size="icon" aria-label="Minggu berikutnya" onClick={() => setViewIso(value => addDaysIso(value, 7))}><ChevronRight /></Button>
        <Button variant="outline" size="icon" aria-label="Bulan berikutnya" onClick={() => setViewIso(value => shiftMonthIso(value, 1))}><ChevronsRight /></Button>
      </div>
    </div>

    <div className="mb-5 grid grid-cols-7 gap-1.5 sm:gap-2">
      {week.map(day => {
        const count = byIso[day.iso]?.length ?? 0;
        const active = selected.iso === day.iso;
        const isToday = day.iso === now.iso;
        return <button key={day.iso} onClick={() => setSelectedIso(day.iso)} className={`rounded-xl py-2.5 text-center transition-colors ${active ? "bg-academic text-academic-foreground shadow-md" : "bg-surface text-muted-foreground"} ${isToday && !active ? "ring-1 ring-academic/40" : ""}`}>
          <span className="block text-[10px] font-semibold">{day.label.slice(0, 3)}</span>
          <span className="mt-1 block font-display text-base font-bold sm:text-lg">{day.date}</span>
          <span className={`mx-auto mt-1 block size-1.5 rounded-full ${count ? (active ? "bg-primary" : "bg-academic") : "bg-transparent"}`} />
        </button>;
      })}
    </div>

    <div className="md:hidden">
      <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{formatDateId(selected.iso)}</p>
      <div className="space-y-3">
        {byIso[selected.iso]?.length ? byIso[selected.iso]!.map(event => <div key={event.id}>
          {selected.iso === now.iso && minutesOf(event.start) > now.minutesOfDay && (byIso[selected.iso]!.filter(item => minutesOf(item.start) <= now.minutesOfDay).length === byIso[selected.iso]!.indexOf(event)) && <CurrentTimeLine time={now.time} />}
          <EventCard event={event} />
        </div>) : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada jadwal</div>}
      </div>
    </div>

    <div className="hidden gap-3 md:grid md:grid-cols-7">
      {week.map(day => {
        const isToday = day.iso === now.iso;
        const items = byIso[day.iso] ?? [];
        const beforeNow = items.filter(item => minutesOf(item.start) <= now.minutesOfDay).length;
        return <div key={day.iso} className={`min-h-[420px] rounded-2xl border p-2.5 ${isToday ? "border-academic/40 bg-accent/40" : "border-border bg-surface"}`}>
          <div className="mb-3 text-center">
            <p className="text-[11px] text-muted-foreground">{day.label.slice(0, 3)}</p>
            <p className={`font-display text-lg font-bold ${isToday ? "text-academic" : ""}`}>{day.date}</p>
          </div>
          <div className="space-y-2.5">
            {items.map((event, index) => <div key={event.id} className="space-y-2.5">
              {isToday && index === beforeNow && <CurrentTimeLine time={now.time} />}
              <EventCard event={event} compact />
            </div>)}
            {isToday && beforeNow === items.length && <CurrentTimeLine time={now.time} />}
            {!items.length && !isToday && <p className="pt-2 text-center text-[10px] text-muted-foreground">Belum ada jadwal</p>}
          </div>
        </div>;
      })}
    </div>

    <section className="mb-7 mt-7">
      <SectionHeader title="Rutinitas mingguan" action={<span className="text-xs text-muted-foreground">Berulang otomatis tiap minggu</span>} />
      {routines.length ? <div className="academic-card divide-y divide-border">
        {routines.map((routine) => <article key={routine.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{routine.type}</span>
              {routine.organization && <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">{routine.organization}</span>}
            </div>
            <p className="mt-2 truncate text-sm font-bold">{routine.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {routine.days.map((day) => ROUTINE_DAY_LABELS[day]).join(", ")}
              {routine.start ? ` · ${routine.start}${routine.end ? ` – ${routine.end}` : ""}` : " · Sepanjang hari"}
              {routine.location ? ` · ${routine.location}` : ""}
            </p>
          </div>
          {onRemoveRoutine && <Button variant="ghost" size="sm" onClick={() => onRemoveRoutine(routine.id)} aria-label={`Hapus rutinitas ${routine.title}`}><Trash2 /></Button>}
        </article>)}
      </div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada rutinitas. Tambahkan lewat tombol tambah cepat (+) → Rutinitas.</div>}
    </section>


    {reminders.length > 0 && <section className="mb-7">
      <SectionHeader title="Pengingat" action={<span className="text-xs font-semibold text-academic">{now.time} WIB</span>} />
      <div className="grid gap-3 sm:grid-cols-2">
        {reminders.map((reminder) => {
          const tone = reminder.kind === "class-soon" ? "bg-primary/15 text-academic" : reminder.kind === "milestone-soon" ? "bg-warning/15 text-academic" : "bg-destructive/10 text-destructive";
          return <article key={reminder.id} className="academic-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 p-4">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}><Bell className="size-4" /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{reminder.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{reminder.message}</p>
            </div>
          </article>;
        })}
      </div>
    </section>}

    <section className="mb-7">
      <SectionHeader title="Linimasa akademik" action={<span className="text-xs text-muted-foreground">KRS · ujian · deadline</span>} />
      {timeline.length ? <div className="academic-card divide-y divide-border">
        {timeline.map((item) => <article key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-warning/15 text-academic">
            <span className="font-display text-base font-bold leading-none">{Number(item.date.slice(8, 10))}</span>
            <span className="text-[9px] font-semibold uppercase">{monthNameId(Number(item.date.slice(5, 7))).slice(0, 3)}</span>
          </div>
          <div className="min-w-0">
            <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{item.label}</span>
            <p className="mt-2 truncate text-sm font-bold">{item.title}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{formatDayMonthId(item.date)}{item.endDate && item.endDate !== item.date ? ` – ${formatDayMonthId(item.endDate)}` : ""}{item.detail ? ` · ${item.detail}` : ""}</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">{item.daysAway <= 0 ? "Berjalan" : `${item.daysAway} hari`}</span>
        </article>)}
      </div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Belum ada milestone akademik tercatat.</div>}
    </section>

    <section className="mb-7">
      <SectionHeader title="Jadwal kuliah mingguan" action={<span className="text-xs text-muted-foreground">WIB · {weekRangeLabel}</span>} />
      {hasClasses ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {weeklyClasses.filter((day) => day.classes.length).map((day) => <article key={day.iso} className={`academic-card p-4 ${day.iso === now.iso ? "ring-1 ring-academic/40" : ""}`}>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold">{day.label}</p>
            <span className="text-xs text-muted-foreground">{formatDayMonthId(day.iso)}</span>
          </div>
          <ul className="space-y-3">
            {day.classes.map((item) => <li key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <span className="font-display text-sm font-bold text-academic">{item.start}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.course}{item.end ? ` · ${item.start} - ${item.end}` : ""}{item.location ? ` · ${item.location}` : ""}</p>
                {item.person && <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.person}</p>}
              </div>
            </li>)}
          </ul>
        </article>)}
      </div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">No class schedule available</div>}
      <ScheduleManager rows={schedules} options={courseOptions} error={scheduleError} onCreate={createSchedule} onUpdate={updateSchedule} onRemove={removeSchedule} />
    </section>





    <section className="mt-8">
      <SectionHeader title="Agenda berikutnya" />
      <div className="grid gap-3 sm:grid-cols-2">
        {upcomingDeadlines.length ? upcomingDeadlines.map(event => <article key={event.id} className="academic-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 p-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <span className="font-display text-base font-bold leading-none">{Number((event.date ?? "").slice(8, 10))}</span>
            <span className="text-[9px] font-semibold uppercase">{monthNameId(Number((event.date ?? "").slice(5, 7))).slice(0, 3)}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{event.title}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{event.course ? `${event.course} · ` : ""}{formatDayMonthId(event.date ?? now.iso)} · {event.start}</p>
          </div>
        </article>) : <div className="academic-card p-6 text-center text-sm text-muted-foreground sm:col-span-2">Belum ada jadwal</div>}
      </div>
    </section>

    <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
      <Legend color="bg-primary" label="Kuliah" />
      <Legend color="bg-academic" label="Sesi asistensi" />
      <Legend color="bg-destructive" label="Tenggat" />
      <Legend color="bg-success" label="Belajar mandiri" />
      <Legend color="bg-warning" label="Agenda akademik" />
    </div>
  </div>;
}

/** Live "now" marker drawn in the day column, updated every minute. */
function CurrentTimeLine({ time }: { time: string }) {
  return <div className="flex items-center gap-1.5" aria-label={`Waktu sekarang ${time}`}>
    <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
    <span className="h-px flex-1 bg-destructive" />
    <span className="font-display text-[10px] font-bold text-destructive">{time}</span>
  </div>;
}


function EventCard({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  const style = eventStyles[event.type];
  const Icon = style.icon;
  return <article className="academic-card overflow-hidden">
    <div className="flex">
      <div className={`w-1.5 shrink-0 ${style.bar}`} />
      <div className={`min-w-0 flex-1 ${compact ? "p-2.5" : "p-4"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={`font-display font-bold text-academic ${compact ? "text-[11px]" : "text-xs"}`}>{event.start}{event.end ? ` – ${event.end}` : ""}</span>
          {!compact && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.chip}`}><Icon className="size-3" />{style.label}</span>}
        </div>
        {compact && <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${style.chip}`}>{style.label}</span>}
        <h3 className={`mt-2 font-bold leading-5 ${compact ? "text-[11px]" : "text-sm"}`}>{event.title}</h3>
        <div className={`mt-2 space-y-1 text-muted-foreground ${compact ? "text-[10px]" : "text-xs"}`}>
          {event.location && <p className="flex items-center gap-1.5 truncate"><MapPin className="size-3 shrink-0" />{event.location}</p>}
          {event.person && <p className="flex items-center gap-1.5 truncate"><UserRound className="size-3 shrink-0" />{event.person}</p>}
          {event.course && <p className="flex items-center gap-1.5 truncate"><BookOpen className="size-3 shrink-0" />{event.course}</p>}
        </div>
      </div>
    </div>
  </article>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><span className={`size-2 rounded-full ${color}`} />{label}</span>; }


function TasksView({ tasks, toggleTask, updateTask, addTask, deleteTask, navigate, courses = [], todayIso }: { tasks: Task[]; toggleTask: (id: number) => void; updateTask: (id: number, patch: Partial<Task>) => void; addTask: (task: Task) => void; deleteTask?: (id: number) => void; navigate: (view: View) => void; courses?: Course[]; todayIso: string }) {
  const [filter, setFilter] = useState<"All" | TaskCategory>("All");
  const [openId, setOpenId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const scoped = useMemo(() => filter === "All" ? tasks : tasks.filter(task => task.category === filter), [tasks, filter]);
  const active = scoped.filter(task => !task.done);
  const today = active.filter(task => task.dueIso === todayIso);
  const upcoming = active.filter(task => task.dueIso !== todayIso);
  const completed = scoped.filter(task => task.done);
  const weekEnd = addDaysIso(todayIso, 7);
  const dueThisWeek = active.filter(task => task.dueIso && task.dueIso >= todayIso && task.dueIso <= weekEnd);
  const openTask = tasks.find(task => task.id === openId) ?? null;

  if (openTask) return <TaskDetail task={openTask} onBack={() => setOpenId(null)} updateTask={updateTask} toggleTask={toggleTask} navigate={navigate} />;

  return <div>
    <MobileTop eyebrow="Pusat tugas" title="Tugas" action={<Button variant="yellow" size="icon" onClick={() => setShowAdd(true)} aria-label="Buat tugas"><Plus /></Button>} />
    <div className="mb-7 hidden items-end justify-between md:flex"><div><p className="text-sm text-academic">Pusat tugas</p><h1 className="mt-1 text-3xl font-bold">Tugas</h1></div><Button variant="yellow" onClick={() => setShowAdd(true)}><Plus /> Buat tugas</Button></div>

    <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
      <SummaryStat label="Tugas aktif" value={active.length} tone="text-academic" />
      <SummaryStat label="Tenggat pekan ini" value={dueThisWeek.length} tone="text-destructive" />
      <SummaryStat label="Selesai" value={completed.length} tone="text-success" />
    </div>

    <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {(["All", ...taskCategories] as const).map(value => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${filter === value ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{value === "All" ? "Semua" : categoryLabel[value]}</button>)}
    </div>

    {showAdd && <CreateTaskForm courses={courses} todayIso={todayIso} onCancel={() => setShowAdd(false)} onCreate={task => { addTask(task); setShowAdd(false); }} />}

    {!scoped.length && !showAdd && <EmptyState
      icon={ListTodo}
      eyebrow={filter === "All" ? "Task center" : `${filter} tasks`}
      title={filter === "All" ? "No assignment tracked yet" : `Nothing filed under ${filter}`}
      description={filter === "All"
        ? "This is where every assignment, case, and paper of the semester lives — with its deadline, checklist, and course attached."
        : `You have no ${filter.toLowerCase()} work in this semester yet. Create one, or switch back to all tasks to see the rest.`}
      actions={filter === "All"
        ? [{ label: "Create assignment", icon: Plus, onClick: () => setShowAdd(true) }, { label: "Open a course", icon: BookOpen, onClick: () => navigate("courses") }]
        : [{ label: `Create ${filter.toLowerCase()} task`, icon: Plus, onClick: () => setShowAdd(true) }, { label: "Show all tasks", onClick: () => setFilter("All") }]}
      hints={["Set the due date so it appears in Today and Upcoming", "Break big papers into a checklist", "Link the task to its course to keep materials nearby"]}
      className="mb-8"
    />}

    {scoped.length > 0 && <section className="mb-8">
      <SectionHeader title="Hari ini" action={<span className="text-xs font-semibold text-muted-foreground">{today.length} perlu dikerjakan</span>} />
      <div className="grid gap-3 sm:grid-cols-2">
        {today.length ? today.map(task => <TaskCard key={task.id} task={task} toggleTask={toggleTask} onOpen={() => setOpenId(task.id)} />)
          : <div className="academic-card p-6 text-center sm:col-span-2"><CheckCircle2 className="mx-auto size-8 text-success" /><p className="mt-3 text-sm font-semibold">Tidak ada tenggat hari ini</p><p className="mt-1 text-xs text-muted-foreground">Manfaatkan waktu luang untuk mencicil tugas berikutnya.</p></div>}
      </div>
    </section>}

    {scoped.length > 0 && <section className="mb-8">
      <SectionHeader title="Akan datang" />
      {upcoming.length ? <div className="academic-card overflow-hidden">
        {upcoming.map((task, index) => <button key={task.id} onClick={() => setOpenId(task.id)} className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left ${index ? "border-t border-border" : ""}`}>
          <div className="w-14 shrink-0 text-center"><p className="font-display text-lg font-bold text-academic">{task.due.split(" ")[0]}</p><p className="text-[10px] font-semibold uppercase text-muted-foreground">{task.due.split(" ")[1] ?? ""}</p></div>
          <div className="min-w-0 border-l border-border pl-3"><p className="truncate text-sm font-bold">{task.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{task.course}</p></div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>{task.priority}</span>
        </button>)}
      </div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Tidak ada tugas mendatang pada saringan ini.</div>}
    </section>}

    {completed.length > 0 && <section>
      <SectionHeader title="Selesai" />
      <div className="academic-card divide-y divide-border">{completed.map(task => <button key={task.id} onClick={() => setOpenId(task.id)} className="flex w-full items-center gap-3 p-4 text-left"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-academic-foreground"><Check className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-muted-foreground line-through">{task.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{task.course}</span></span><ChevronRight className="size-4 text-muted-foreground" /></button>)}</div>
    </section>}
  </div>;
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="academic-card p-4"><p className={`font-display text-2xl font-bold ${tone}`}>{value}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</p></div>;
}

function TaskCard({ task, toggleTask, onOpen }: { task: Task; toggleTask: (id: number) => void; onOpen: () => void }) {
  const progress = task.checklist.length ? Math.round((task.checklist.filter(item => item.done).length / task.checklist.length) * 100) : 0;
  return <article className="academic-card overflow-hidden">
    <div className="flex">
      <div className={`w-1.5 shrink-0 ${task.priority === "High" ? "bg-destructive" : task.priority === "Medium" ? "bg-primary" : "bg-success"}`} />
      <div className="min-w-0 flex-1 p-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <button onClick={() => toggleTask(task.id)} aria-label={`Selesaikan ${task.title}`} className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-input bg-background" />
          <button onClick={onOpen} className="min-w-0 text-left">
            <h3 className="truncate text-sm font-bold">{task.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground"><BookOpen className="size-3 shrink-0" />{task.course}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-academic">Tenggat {task.due}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>Prioritas {priorityLabel[task.priority]}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[task.status]}`}>{taskStatusLabel[task.status]}</span>
            </div>
            {task.checklist.length > 0 && <div className="mt-4 flex items-center gap-3"><Progress value={progress} className="h-2 flex-1" /><span className="text-[11px] font-bold text-academic">{progress}%</span></div>}
          </button>
        </div>
      </div>
    </div>
  </article>;
}

function TaskDetail({ task, onBack, updateTask, toggleTask, navigate }: { task: Task; onBack: () => void; updateTask: (id: number, patch: Partial<Task>) => void; toggleTask: (id: number) => void; navigate: (view: View) => void }) {
  const progress = task.checklist.length ? Math.round((task.checklist.filter(item => item.done).length / task.checklist.length) * 100) : 0;
  const toggleItem = (itemId: number) => updateTask(task.id, { checklist: task.checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item) });
  const setStatus = (status: TaskStatus) => updateTask(task.id, { status, done: status === "Completed" });

  return <div>
    <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-semibold text-academic"><ArrowLeft className="size-4" />Kembali ke daftar tugas</button>
    <header className="academic-card mb-6 overflow-hidden">
      <div className={`h-2 ${task.priority === "High" ? "bg-destructive" : task.priority === "Medium" ? "bg-primary" : "bg-success"}`} />
      <div className="p-5 md:p-6">
        <p className="text-xs font-semibold uppercase text-academic">{categoryLabel[task.category]}</p>
        <h1 className="mt-2 text-xl font-bold md:text-2xl">{task.title}</h1>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-2"><BookOpen className="size-4 shrink-0 text-academic" />{task.course}{task.courseCode ? ` · ${task.courseCode}` : ""}</span>
          <span className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-academic" />Tenggat {task.dueDate}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>Prioritas {priorityLabel[task.priority]}</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[task.status]}`}>{taskStatusLabel[task.status]}</span>
        </div>
      </div>
    </header>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <div className="space-y-6">
        <section className="academic-card p-5"><h2 className="text-base font-bold">Deskripsi</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{task.description}</p></section>

        <section className="academic-card p-5">
          <div className="flex items-center justify-between"><h2 className="text-base font-bold">Daftar langkah</h2><span className="text-xs font-bold text-academic">{progress}%</span></div>
          <Progress value={progress} className="mt-3 h-2" />
          <div className="mt-4 space-y-2">{task.checklist.length ? task.checklist.map(item => <button key={item.id} onClick={() => toggleItem(item.id)} className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left"><span className={`grid size-5 shrink-0 place-items-center rounded-full border ${item.done ? "border-success bg-success text-academic-foreground" : "border-input bg-background"}`}>{item.done && <Check className="size-3" />}</span><span className={`min-w-0 flex-1 truncate text-sm ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}>{item.label}</span></button>) : <p className="text-sm text-muted-foreground">Belum ada langkah yang dicatat.</p>}</div>
        </section>

        <ResourcesPanel resources={task.resources} onChange={resources => updateTask(task.id, { resources })} />
      </div>

      <div className="space-y-6">
        <section className="academic-card p-5">
          <h2 className="text-base font-bold">Status</h2>
          <div className="mt-3 space-y-2">{(["Not started", "In progress", "Completed"] as TaskStatus[]).map(status => <button key={status} onClick={() => setStatus(status)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${task.status === status ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{taskStatusLabel[status]}{task.status === status && <Check className="size-4" />}</button>)}</div>
          <Button variant={task.done ? "outline" : "yellow"} className="mt-4 w-full" onClick={() => toggleTask(task.id)}>{task.done ? "Buka lagi tugas" : "Tandai selesai"}</Button>
        </section>

        <section className="academic-card p-5">
          <h2 className="text-base font-bold">Tautan cepat</h2>
          <div className="mt-3 space-y-2">
            <button onClick={() => navigate("courses")} className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left"><BookOpen className="size-4 shrink-0 text-academic" /><span className="min-w-0 flex-1 truncate text-sm font-medium">Ruang kerja mata kuliah</span><ChevronRight className="size-4 text-muted-foreground" /></button>
            <button onClick={() => navigate("calendar")} className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left"><CalendarDays className="size-4 shrink-0 text-academic" /><span className="min-w-0 flex-1 truncate text-sm font-medium">Lihat di kalender</span><ChevronRight className="size-4 text-muted-foreground" /></button>
            <button onClick={() => navigate("library")} className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left"><Library className="size-4 shrink-0 text-academic" /><span className="min-w-0 flex-1 truncate text-sm font-medium">Materi terkait</span><ChevronRight className="size-4 text-muted-foreground" /></button>
          </div>
        </section>
      </div>
    </div>
  </div>;
}

const fileKinds: Record<string, string> = { pdf: "PDF", doc: "DOC", docx: "DOCX", xls: "XLS", xlsx: "XLSX", ppt: "PPT", pptx: "PPTX", png: "Image", jpg: "Image", jpeg: "Image", webp: "Image", gif: "Image" };
const extOf = (name: string) => fileKinds[name.split(".").pop()?.toLowerCase() ?? ""] ?? "File";
const formatSize = (bytes?: number) => bytes === undefined ? "" : bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const normalizeUrl = (value: string) => { const trimmed = value.trim(); if (!trimmed) return ""; return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`; };
const isValidUrl = (value: string) => { try { const url = new URL(normalizeUrl(value)); return url.hostname.includes(".") && url.hostname.length > 3; } catch { return false; } };
const hostOf = (url?: string) => { try { return new URL(url ?? "").hostname.replace(/^www\./, ""); } catch { return "Link"; } };

function ResourcesPanel({ resources, onChange }: { resources: TaskResource[]; onChange: (resources: TaskResource[]) => void }) {
  const [showLink, setShowLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const invalid = linkUrl.trim().length > 0 && !isValidUrl(linkUrl);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added: TaskResource[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index, kind: "file", title: file.name, ext: extOf(file.name), size: file.size, url: URL.createObjectURL(file),
    }));
    onChange([...resources, ...added]);
  };

  const saveLink = () => {
    if (!isValidUrl(linkUrl)) return;
    const url = normalizeUrl(linkUrl);
    onChange([...resources, { id: Date.now(), kind: "link", title: linkTitle.trim() || hostOf(url), url }]);
    setLinkTitle(""); setLinkUrl(""); setShowLink(false);
  };

  const remove = (id: number) => onChange(resources.filter(item => item.id !== id));
  const field = "w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return <section className="academic-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold">Lampiran</h2><p className="mt-1 text-xs text-muted-foreground">Berkas, data, dan tautan referensi untuk tugas ini.</p></div>
      <div className="flex gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-foreground"><Paperclip className="size-3.5 text-academic" />Unggah berkas<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" className="sr-only" onChange={e => { addFiles(e.target.files); e.target.value = ""; }} /></label>
        <Button variant="outline" size="sm" onClick={() => setShowLink(value => !value)}><Link2 /> Tambah tautan</Button>
      </div>
    </div>

    {showLink && <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-input p-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Judul</span><input autoFocus value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Case Study Dataset" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">URL</span><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="drive.google.com/…" className={field} /></label>
      {invalid && <p className="text-xs font-medium text-destructive sm:col-span-2">Masukkan alamat yang valid, misalnya drive.google.com/file/123</p>}
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={saveLink}><Save /> Simpan tautan</Button><Button variant="ghost" size="sm" onClick={() => setShowLink(false)}>Batal</Button></div>
    </div>}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {resources.length ? resources.map(item => <article key={item.id} className="rounded-xl border border-border bg-muted p-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-academic">{item.kind === "file" ? <FileText className="size-5" /> : <Link2 className="size-5" />}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground"><span className="rounded-full bg-background px-2 py-0.5">{item.kind === "file" ? item.ext ?? extOf(item.title) : "Link"}</span>{item.kind === "file" ? formatSize(item.size) : hostOf(item.url)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {item.kind === "file"
            ? <a href={item.url ?? "#"} download={item.title} className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><Download className="size-3.5" />Unduh</a>
            : <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><ExternalLink className="size-3.5" />Buka tautan</a>}
          <button onClick={() => remove(item.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"><Trash2 className="size-3.5" />Hapus</button>
        </div>
      </article>) : <p className="text-sm text-muted-foreground sm:col-span-2">Belum ada lampiran. Unggah berkas tugas atau tambahkan tautan referensi.</p>}
    </div>
  </section>;
}

function CreateTaskForm({ onCreate, onCancel, courses = [], todayIso }: { onCreate: (task: Task) => void; onCancel: () => void; courses?: Course[]; todayIso: string }) {
  const [title, setTitle] = useState("");
  const [courseIndex, setCourseIndex] = useState(0);
  const [due, setDue] = useState(todayIso);
  const [dueTime, setDueTime] = useState("23:59");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [description, setDescription] = useState("");
  const [resources, setResources] = useState<TaskResource[]>([]);

  const options = courses.length
    ? courses.map((course) => ({ course: course.title, courseCode: course.code, category: "Research" as TaskCategory }))
    : courseOptions;

  const submit = () => {
    if (!title.trim()) return;
    const option = options[courseIndex] ?? options[0]!;
    const dueIso = /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : todayIso;
    onCreate({
      id: Date.now(), title: title.trim(), course: option.course, courseCode: option.courseCode, category: option.category,
      due: relativeDueLabel(dueIso, todayIso), dueDate: `${dueIso} · ${dueTime}`, dueIso, dueTime,
      priority, status: "Not started", done: false,
      description: description.trim() || "Belum ada deskripsi.",
      resources, checklist: [],
    });
  };

  const field = "w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
  return <section className="academic-card mb-6 p-5">
    <h2 className="text-base font-bold">Tugas baru</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Judul</span><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul tugas" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Mata kuliah</span><select value={courseIndex} onChange={e => setCourseIndex(Number(e.target.value))} className={field}>{options.map((option, index) => <option key={option.course} value={index}>{option.course}</option>)}</select></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tenggat</span><span className="flex gap-2"><input type="date" value={due} onChange={e => setDue(e.target.value)} className={field} /><input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className={`${field} max-w-28`} /></span></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Prioritas</span><select value={priority} onChange={e => setPriority(e.target.value as Task["priority"])} className={field}><option value="High">Tinggi</option><option value="Medium">Sedang</option><option value="Low">Rendah</option></select></label>
      <label className="flex flex-col"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Lampiran</span><span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground"><Paperclip className="size-4 shrink-0 text-academic" /><span className="min-w-0 flex-1 truncate">{resources.length ? `${resources.length} berkas dilampirkan` : "Unggah berkas"}</span><input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" className="sr-only" onChange={e => { const files = e.target.files; if (files?.length) setResources(current => [...current, ...Array.from(files).map((file, index) => ({ id: Date.now() + index, kind: "file" as const, title: file.name, ext: extOf(file.name), size: file.size, url: URL.createObjectURL(file) }))]); e.target.value = ""; }} /></span></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Deskripsi</span><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Apa yang perlu disiapkan?" className={field} /></label>
    </div>
    <div className="mt-4 flex gap-2"><Button variant="academic" onClick={submit}><Check /> Simpan tugas</Button><Button variant="outline" onClick={onCancel}><X /> Batal</Button></div>
  </section>;
}

