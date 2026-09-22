import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ClipboardList, Clock3, MapPin, Plus, Sparkles, Trash2, UserRound } from "lucide-react";
import logoAsset from "@/assets/mr-labs-logo.png";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { activateCurriculum, buildCustomCurriculum, courseAvailability, CUSTOM_PROGRAM_ID, sksTotal, usePrograms, useProgramCurriculum, type CatalogCourse } from "@/data/curriculum-catalog";
import { CLASS_DAYS, SECTIONS, type ActiveCourseConfig, type ClassDay, type CustomCourse, type Section, type StudentSetup } from "@/data/setup";

const steps = [
  { id: 1, label: "Identitas akademik", hint: "Siapa kamu" },
  { id: 2, label: "Kurikulum", hint: "Peta studimu" },
  { id: 3, label: "Semester berjalan", hint: "Posisimu sekarang" },
  { id: 4, label: "Mata kuliah lulus", hint: "Yang sudah kamu selesaikan" },
  { id: 5, label: "Semester ini", hint: "Yang kamu ambil sekarang" },
  { id: 6, label: "Pengaturan kelas", hint: "Kelas & jadwal" },
  { id: 7, label: "Mata kuliah tambahan", hint: "Di luar kurikulum" },
  { id: 8, label: "Dasbormu", hint: "Semua dalam satu tempat" },
];

const fieldClass = "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-academic";

/** Semester 0 holds courses that are optional to take, not part of a fixed term. */
const semesterLabel = (semester: number) => (semester === 0 ? "Semester 0 · opsional" : `Semester ${semester}`);

export function Onboarding({ onComplete, initial = null, onCancel }: { onComplete: (setup: StudentSetup) => void; initial?: StudentSetup | null; onCancel?: (() => void) | undefined }) {
  const editing = Boolean(initial);
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initial?.name ?? "");
  const [entryYear, setEntryYear] = useState(initial?.entryYear ?? new Date().getFullYear());
  const [semester, setSemester] = useState(initial?.currentSemester ?? 1);
  const [completed, setCompleted] = useState<string[]>(initial?.completed ?? []);
  const [activeCodes, setActiveCodes] = useState<string[]>((initial?.active ?? []).map((item) => item.code));
  const [configs, setConfigs] = useState<Record<string, ActiveCourseConfig>>(
    Object.fromEntries((initial?.active ?? []).map((item) => [item.code, item])),
  );
  const [customCourses, setCustomCourses] = useState<CustomCourse[]>(initial?.customCourses ?? []);

  const addCustomCourse = () =>
    setCustomCourses((list) => [
      ...list,
      { code: `EXT-${list.length + 1}`, name: "", faculty: "", sks: 3, lecturer: "", day: "Monday", start: "08:00", end: "10:30", room: "", countsTowardGraduation: true },
    ]);
  const patchCustomCourse = (index: number, patch: Partial<CustomCourse>) =>
    setCustomCourses((list) => list.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  const removeCustomCourse = (index: number) => setCustomCourses((list) => list.filter((_, position) => position !== index));

  const { programs } = usePrograms();
  const [programId, setProgramId] = useState<string | null>(initial?.customCurriculum ? CUSTOM_PROGRAM_ID : initial?.programId ?? null);
  const selectedProgram = programs.find((item) => item.id === programId) ?? programs[0] ?? null;
  const isCustom = selectedProgram?.id === CUSTOM_PROGRAM_ID;

  const [ownTotalSks, setOwnTotalSks] = useState(initial?.customCurriculum?.totalSks ?? 144);
  const [ownCourses, setOwnCourses] = useState<{ code: string; name: string; sks: number; semester: number }[]>(
    initial?.customCurriculum?.courses ?? [{ code: "OWN-1", name: "", sks: 3, semester: 1 }],
  );
  const addOwnCourse = () => setOwnCourses((list) => [...list, { code: `OWN-${list.length + 1}`, name: "", sks: 3, semester: 1 }]);
  const patchOwnCourse = (index: number, patch: Partial<{ code: string; name: string; sks: number; semester: number }>) =>
    setOwnCourses((list) => list.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  const removeOwnCourse = (index: number) => setOwnCourses((list) => list.filter((_, position) => position !== index));

  const { curriculum: remoteCatalog, loading: curriculumLoading } = useProgramCurriculum(isCustom ? null : selectedProgram);
  const ownCatalog = useMemo(() => buildCustomCurriculum({ totalSks: ownTotalSks, courses: ownCourses }), [ownTotalSks, ownCourses]);
  const catalog = isCustom ? ownCatalog : remoteCatalog;

  const [ownProgramName, setOwnProgramName] = useState(initial?.customCurriculum ? initial.program : "");
  const [ownFaculty, setOwnFaculty] = useState(initial?.customCurriculum ? initial.faculty : "");
  const [ownUniversity, setOwnUniversity] = useState(initial?.customCurriculum ? initial.university : "");

  const program = isCustom ? ownProgramName.trim() || "Kurikulum sendiri" : catalog.program.name;
  const faculty = isCustom ? ownFaculty : catalog.program.faculty;
  const university = isCustom ? ownUniversity : catalog.program.university;
  const courses = catalog.courses;
  const semesterGroups = catalog.semesterGroups;
  const courseByCode = useMemo(() => new Map(courses.map((course) => [course.code, course])), [courses]);

  const completedSks = sksTotal(completed);
  const progress = {
    completedSks,
    remainingSks: Math.max(0, catalog.totalSks - completedSks),
    percent: Math.min(100, Math.round((completedSks / catalog.totalSks) * 100)),
  };
  const suggestedNow = useMemo(() => courses.filter((course) => course.semester === semester), [courses, semester]);

  const todayName = CLASS_DAYS[(new Date().getDay() + 6) % 7] ?? "Monday";
  const todaySchedule = useMemo(() => {
    const fromCurriculum = activeCodes.flatMap((code) => {
      const config = configs[code];
      const course = courses.find((item) => item.code === code);
      if (!config || !course || config.day !== todayName) return [];
      return [{ key: code, title: course.name, start: config.start, end: config.end, room: config.room }];
    });
    const fromCustom = customCourses
      .filter((course) => course.name.trim() && course.day === todayName)
      .map((course, index) => ({ key: `extra-${index}`, title: course.name.trim(), start: course.start, end: course.end, room: course.room }));
    return [...fromCurriculum, ...fromCustom].sort((a, b) => a.start.localeCompare(b.start));
  }, [activeCodes, configs, courses, customCourses, todayName]);

  const toggleCompleted = (code: string) =>
    setCompleted((list) => (list.includes(code) ? list.filter((item) => item !== code) : [...list, code]));

  const toggleActive = (code: string) =>
    setActiveCodes((list) => {
      if (list.includes(code)) return list.filter((item) => item !== code);
      setConfigs((current) => current[code] ? current : {
        ...current,
        [code]: { code, section: "A", lecturer: "", assistant: "", day: "Monday", start: "08:00", end: "10:30", room: "" },
      });
      return [...list, code];
    });

  const patchConfig = (code: string, patch: Partial<ActiveCourseConfig>) =>
    setConfigs((current) => {
      const existing = current[code];
      if (!existing) return current;
      return { ...current, [code]: { ...existing, ...patch } };
    });

  const markSemesterCompleted = (target: number) => {
    const codes = courses.filter((course) => course.semester > 0 && course.semester <= target && course.category !== "Final Project" && course.category !== "Elective" && !course.note).map((course) => course.code);
    setCompleted((list) => Array.from(new Set([...list, ...codes])));
  };

  const canContinue =
    step === 1 ? name.trim().length > 1 :
    step === 2 ? (!isCustom || ownCourses.some((course) => course.name.trim().length > 0)) :
    step === 5 ? activeCodes.length > 0 :
    true;

  const finish = () => {
    activateCurriculum(catalog);
    const isRemoteProgram = !isCustom && !catalog.program.id.startsWith("fallback");
    onComplete({
      name: name.trim(), program, faculty, university, entryYear, currentSemester: semester,
      ...(isRemoteProgram ? { programId: catalog.program.id } : {}),
      ...(isCustom ? { customCurriculum: { totalSks: ownTotalSks, courses: catalog.courses.map((course) => ({ code: course.code, name: course.name, sks: course.sks, semester: course.semester })) } } : {}),
      completed, active: activeCodes.flatMap((code) => configs[code] ? [configs[code] as ActiveCourseConfig] : []),
      customCourses: customCourses
        .filter((course) => course.name.trim().length > 0)
        .map((course, index) => ({ ...course, code: course.code.trim() || `EXT-${index + 1}`, name: course.name.trim() })),
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          <img src={logoAsset} alt="Logo MR Labs" className="h-10 w-auto max-w-40 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold">{editing ? "PERBARUI DATA AKADEMIKMU" : "MARI ATUR KEHIDUPAN AKADEMIKMU"}</p>
            <p className="truncate text-xs text-muted-foreground">Langkah {step} dari {steps.length} · {steps[step - 1]?.label}</p>
          </div>
          {editing && onCancel && (
            <Button variant="ghost" size="sm" className="ml-auto shrink-0" onClick={onCancel}>Batal</Button>
          )}
        </div>
        <Progress value={(step / steps.length) * 100} className="h-1 rounded-none" />
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 py-7 pb-28">
        <div className="mb-7 hidden flex-wrap gap-2 md:flex">
          {steps.map((item) => (
            <span key={item.id} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${item.id === step ? "bg-academic text-academic-foreground" : item.id < step ? "bg-accent text-academic" : "bg-muted text-muted-foreground"}`}>
              {item.id < step ? <Check className="mr-1 inline size-3" /> : null}{item.label}
            </span>
          ))}
        </div>

        <div key={step} className="page-enter space-y-5">
          {step === 1 && (
            <section className="academic-card p-6">
              <StepTitle icon={UserRound} eyebrow="Langkah 1" title="Ceritakan siapa kamu" subtitle="Ini akan mempersonalisasi dasbor, perjalanan akademik, dan halaman performamu." />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nama lengkap"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Masukkan nama lengkap" className={fieldClass} /></Field>
                <Field label="Program studi">
                  <select value={selectedProgram?.id ?? ""} onChange={(event) => setProgramId(event.target.value)} className={fieldClass}>
                    {programs.map((item) => (
                      <option key={item.id} value={item.id}>{item.degree} {item.name} · Kurikulum {item.curriculumYear}</option>
                    ))}
                  </select>
                </Field>
                {isCustom && (
                  <Field label="Nama program studi"><input value={ownProgramName} onChange={(event) => setOwnProgramName(event.target.value)} placeholder="Misal: S1 Manajemen" className={fieldClass} /></Field>
                )}
                <Field label="Fakultas"><input value={faculty} onChange={(event) => setOwnFaculty(event.target.value)} readOnly={!isCustom} placeholder={isCustom ? "Masukkan nama fakultas" : ""} className={fieldClass} /></Field>
                <Field label="Universitas"><input value={university} onChange={(event) => setOwnUniversity(event.target.value)} readOnly={!isCustom} placeholder={isCustom ? "Masukkan nama universitas" : ""} className={fieldClass} /></Field>
                <Field label="Tahun masuk">
                  <select value={entryYear} onChange={(event) => setEntryYear(Number(event.target.value))} className={fieldClass}>
                    {Array.from({ length: 8 }, (_, index) => 2026 - index).map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </Field>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="academic-card p-6">
              <StepTitle icon={Sparkles} eyebrow="Langkah 3" title="Kamu sedang di semester berapa?" subtitle="Kami memakai ini untuk dasbor, perjalanan akademik, dan progres kurikulummu." />
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => index + 1).map((value) => (
                  <button key={value} onClick={() => setSemester(value)} className={`rounded-2xl border p-4 text-left transition-colors ${semester === value ? "border-academic bg-accent" : "border-input bg-surface hover:bg-muted"}`}>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Semester</p>
                    <p className={`mt-1 font-display text-2xl font-bold ${semester === value ? "text-academic" : ""}`}>{value}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{courses.filter((course) => course.semester === value).length} mata kuliah</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && isCustom && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={BookOpen} eyebrow="Langkah 2" title="Susun kurikulummu sendiri" subtitle="Tulis sendiri nama mata kuliah, jumlah SKS, dan target SKS kelulusan. Semester 0 berarti mata kuliah opsional." />
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Field label="Target SKS kelulusan"><input type="number" min={1} max={300} value={ownTotalSks} onChange={(event) => setOwnTotalSks(Number(event.target.value))} className={fieldClass} /></Field>
                  <Stat label="Mata kuliah" value={`${ownCourses.filter((course) => course.name.trim()).length}`} />
                  <Stat label="Total SKS tertulis" value={`${ownCourses.reduce((total, course) => total + (Number(course.sks) || 0), 0)} SKS`} />
                </div>
                <Button variant="academic" className="mt-4" onClick={addOwnCourse}><Plus className="size-4" />Tambah mata kuliah</Button>
              </div>
              {ownCourses.map((course, index) => (
                <div key={index} className="academic-card p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{course.name.trim() || `Mata kuliah ${index + 1}`}</p>
                    <button onClick={() => removeOwnCourse(index)} className="text-muted-foreground transition-colors hover:text-destructive" aria-label="Hapus mata kuliah"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2"><Field label="Nama mata kuliah"><input value={course.name} onChange={(event) => patchOwnCourse(index, { name: event.target.value })} placeholder="Masukkan nama mata kuliah" className={fieldClass} /></Field></div>
                    <Field label="Kredit (SKS)"><input type="number" min={0} max={12} value={course.sks} onChange={(event) => patchOwnCourse(index, { sks: Number(event.target.value) })} className={fieldClass} /></Field>
                    <Field label="Semester">
                      <select value={course.semester} onChange={(event) => patchOwnCourse(index, { semester: Number(event.target.value) })} className={fieldClass}>
                        {Array.from({ length: 9 }, (_, value) => value).map((value) => <option key={value} value={value}>{value === 0 ? "0 · opsional" : value}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              ))}
            </section>
          )}

          {step === 2 && !isCustom && (
            <section className="space-y-4">
              <div className="academic-card overflow-hidden">
                <div className="bg-academic p-6 text-academic-foreground">
                  <p className="text-xs font-semibold opacity-80">{curriculumLoading ? "MENDETEKSI KURIKULUM…" : "KURIKULUM TERDETEKSI OTOMATIS"}</p>
                  <h2 className="mt-2 text-2xl font-bold">{catalog.program.degree === "Sarjana (S1)" ? "Sarjana " : ""}{catalog.program.name} — {catalog.program.faculty.includes("Ekonomi") ? "FEB" : catalog.program.faculty} {catalog.program.university.includes("Indonesia") ? "UI" : catalog.program.university}</h2>
                  <p className="mt-1 text-sm opacity-85">Kurikulum {catalog.program.curriculumYear} · {catalog.totalSks} SKS untuk lulus</p>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  <Stat label="Program studi" value={`${catalog.program.name} (${catalog.program.degree})`} />
                  <Stat label="Tahun kurikulum" value={`${catalog.program.curriculumYear}`} />
                  <Stat label="Syarat kelulusan" value={`${catalog.totalSks} SKS`} />
                </div>
                <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-5">
                  {catalog.structure.map((item) => (
                    <div key={item.label} className="rounded-xl bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-sm font-bold">{item.sks} SKS</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="academic-card p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><BookOpen className="size-4 text-academic" />Peta jalan semester</p>
                <div className="mt-4 space-y-3">
                  {semesterGroups.map((group) => (
                    <div key={group.semester} className="rounded-xl bg-muted p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{semesterLabel(group.semester)}</p>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-academic">{sksTotal(group.courses.map((course) => course.code))} SKS</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{group.courses.map((course) => course.name).join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={CheckCircle2} eyebrow="Langkah 4" title="Mata kuliah mana yang sudah kamu selesaikan?" subtitle="Centang semua yang sudah lulus. Progres gelarmu langsung ter-update." />
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat label="Selesai" value={`${progress.completedSks} SKS`} />
                  <Stat label="Sisa" value={`${progress.remainingSks} SKS`} />
                  <Stat label="Progres gelar" value={`${progress.percent}%`} />
                </div>
                <Progress value={progress.percent} className="mt-4 h-2" />
                {semester > 1 && (
                  <button onClick={() => markSemesterCompleted(semester - 1)} className="mt-4 text-xs font-semibold text-academic">
                    Tandai semua sampai semester {semester - 1} sebagai selesai
                  </button>
                )}
              </div>
              {semesterGroups.map((group) => (
                <div key={group.semester} className="academic-card p-5">
                  <p className="text-sm font-bold">{semesterLabel(group.semester)}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {group.courses.map((course) => {
                      const picked = completed.includes(course.code);
                      return (
                        <button key={course.code} onClick={() => toggleCompleted(course.code)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${picked ? "border-academic bg-accent" : "border-input bg-surface hover:bg-muted"}`}>
                          <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${picked ? "border-academic bg-academic text-academic-foreground" : "border-input"}`}>{picked && <Check className="size-3.5" />}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold leading-5">{course.name}</span>
                            <span className="block text-[11px] text-muted-foreground">{course.code} · {course.sks} SKS · {course.group}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}

          {step === 5 && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={ClipboardList} eyebrow="Langkah 5" title="Apa yang kamu ambil semester ini?" subtitle={`Rekomendasi dari semester ${semester} kurikulum. Kamu juga bisa memilih dari semester lain di bawah.`} />
                <p className="mt-4 text-xs font-semibold text-academic">{activeCodes.length} dipilih · {sksTotal(activeCodes)} SKS</p>
              </div>
              <CoursePicker title={`Rekomendasi — semester ${semester}`} courses={suggestedNow} selected={activeCodes} completed={completed} onToggle={toggleActive} />
              {semesterGroups.filter((group) => group.semester !== semester).map((group) => (
                <CoursePicker key={group.semester} title={semesterLabel(group.semester)} courses={group.courses} selected={activeCodes} completed={completed} onToggle={toggleActive} />
              ))}
            </section>
          )}

          {step === 6 && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={Clock3} eyebrow="Langkah 6" title="Atur kelasmu" subtitle="Kelas, dosen, asisten, jadwal mingguan, dan ruangan untuk tiap mata kuliah aktif." />
              </div>
              {activeCodes.map((code) => {
                const course = courseByCode.get(code);
                const config = configs[code];
                if (!course || !config) return null;
                return (
                  <div key={code} className="academic-card overflow-hidden">
                    <div className="border-b border-border bg-muted px-5 py-3.5">
                      <p className="text-[11px] font-semibold text-academic">{course.code} · {course.sks} SKS</p>
                      <h3 className="mt-0.5 text-base font-bold">{course.name}</h3>
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Kelas</p>
                        <div className="mt-2 flex gap-2">
                          {SECTIONS.map((section) => (
                            <button key={section} onClick={() => patchConfig(code, { section: section as Section })} className={`grid size-10 place-items-center rounded-xl border text-sm font-bold transition-colors ${config.section === section ? "border-academic bg-academic text-academic-foreground" : "border-input bg-surface hover:bg-muted"}`}>{section}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Dosen"><input value={config.lecturer} onChange={(event) => patchConfig(code, { lecturer: event.target.value })} placeholder="Nama dosen" className={fieldClass} /></Field>
                        <Field label="Asisten dosen"><input value={config.assistant} onChange={(event) => patchConfig(code, { assistant: event.target.value })} placeholder="Nama asisten" className={fieldClass} /></Field>
                        <Field label="Hari">
                          <select value={config.day} onChange={(event) => patchConfig(code, { day: event.target.value as ClassDay })} className={fieldClass}>
                            {CLASS_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                          </select>
                        </Field>
                        <Field label="Ruangan"><input value={config.room} onChange={(event) => patchConfig(code, { room: event.target.value })} placeholder="Nomor ruangan" className={fieldClass} /></Field>
                        <Field label="Jam mulai"><input type="time" value={config.start} onChange={(event) => patchConfig(code, { start: event.target.value })} className={fieldClass} /></Field>
                        <Field label="Jam selesai"><input type="time" value={config.end} onChange={(event) => patchConfig(code, { end: event.target.value })} className={fieldClass} /></Field>
                      </div>
                      <p className="flex flex-wrap items-center gap-3 rounded-xl bg-muted px-3.5 py-2.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-academic">Kelas {config.section}</span>
                        <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{config.day} · {config.start} – {config.end}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{config.room || "Ruangan belum diisi"}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {step === 7 && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={Plus} eyebrow="Langkah 7" title="Ada mata kuliah di luar kurikulum?" subtitle="Kelas lintas fakultas, MBKM, atau pembelajaran tambahan. Lewati jika tidak ada." />
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat label="Mata kuliah tambahan" value={`${customCourses.length}`} />
                  <Stat label="SKS tambahan" value={`${customCourses.reduce((total, course) => total + (Number(course.sks) || 0), 0)} SKS`} />
                  <Stat label="Dihitung untuk kelulusan" value={`${customCourses.filter((course) => course.countsTowardGraduation).reduce((total, course) => total + (Number(course.sks) || 0), 0)} SKS`} />
                </div>
                <Button variant="academic" className="mt-4" onClick={addCustomCourse}><Plus className="size-4" />Tambah mata kuliah</Button>
              </div>

              {customCourses.map((course, index) => (
                <div key={index} className="academic-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border bg-muted px-5 py-3.5">
                    <p className="text-sm font-bold">{course.name.trim() || `Mata kuliah tambahan ${index + 1}`}</p>
                    <button onClick={() => removeCustomCourse(index)} className="text-muted-foreground transition-colors hover:text-destructive" aria-label="Hapus mata kuliah"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-2">
                    <Field label="Nama mata kuliah"><input value={course.name} onChange={(event) => patchCustomCourse(index, { name: event.target.value })} placeholder="Masukkan nama mata kuliah" className={fieldClass} /></Field>
                    <Field label="Fakultas"><input value={course.faculty} onChange={(event) => patchCustomCourse(index, { faculty: event.target.value })} placeholder="Masukkan nama fakultas" className={fieldClass} /></Field>
                    <Field label="Kredit (SKS)"><input type="number" min={1} max={12} value={course.sks} onChange={(event) => patchCustomCourse(index, { sks: Number(event.target.value) })} className={fieldClass} /></Field>
                    <Field label="Dosen"><input value={course.lecturer} onChange={(event) => patchCustomCourse(index, { lecturer: event.target.value })} placeholder="Nama dosen" className={fieldClass} /></Field>
                    <Field label="Hari">
                      <select value={course.day} onChange={(event) => patchCustomCourse(index, { day: event.target.value as ClassDay })} className={fieldClass}>
                        {CLASS_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                      </select>
                    </Field>
                    <Field label="Ruangan"><input value={course.room} onChange={(event) => patchCustomCourse(index, { room: event.target.value })} placeholder="Nomor ruangan" className={fieldClass} /></Field>
                    <Field label="Jam mulai"><input type="time" value={course.start} onChange={(event) => patchCustomCourse(index, { start: event.target.value })} className={fieldClass} /></Field>
                    <Field label="Jam selesai"><input type="time" value={course.end} onChange={(event) => patchCustomCourse(index, { end: event.target.value })} className={fieldClass} /></Field>
                    <label className="sm:col-span-2 flex items-center gap-3 rounded-xl bg-muted px-3.5 py-3 text-sm">
                      <input type="checkbox" checked={course.countsTowardGraduation} onChange={(event) => patchCustomCourse(index, { countsTowardGraduation: event.target.checked })} className="size-4 accent-current text-academic" />
                      <span className="font-semibold">Dihitung dalam kredit kelulusan</span>
                    </label>
                  </div>
                </div>
              ))}
            </section>
          )}

          {step === 8 && (
            <section className="space-y-4">
              <div className="academic-card overflow-hidden">
                <div className="bg-academic p-6 text-academic-foreground">
                  <p className="text-xs font-semibold opacity-80">SISTEM AKADEMIKMU SUDAH SIAP</p>
                  <h2 className="mt-2 text-2xl font-bold">{name.trim() || "Mahasiswa"} · Semester {semester}</h2>
                  <p className="mt-1 text-sm opacity-85">{catalog.program.name} · {faculty} · {university} · Angkatan {entryYear}</p>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-4">
                  <Stat label="Semester berjalan" value={`Semester ${semester}`} />
                  <Stat label="Kredit selesai" value={`${progress.completedSks} / ${catalog.totalSks} SKS`} />
                  <Stat label="Sisa" value={`${progress.remainingSks} SKS`} />
                  <Stat label="Progres gelar" value={`${progress.percent}%`} />
                </div>
                <div className="px-5 pb-5"><Progress value={progress.percent} className="h-2" /></div>
              </div>

              <div className="academic-card p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><ClipboardList className="size-4 text-academic" />Mata kuliah semester ini · {sksTotal(activeCodes) + customCourses.reduce((total, course) => total + (Number(course.sks) || 0), 0)} SKS</p>
                <div className="mt-3 space-y-2">
                  {activeCodes.map((code) => {
                    const course = courseByCode.get(code);
                    const config = configs[code];
                    if (!course || !config) return null;
                    return (
                      <div key={code} className="rounded-xl bg-muted p-3.5">
                        <p className="text-sm font-bold">{course.name}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">Kelas {config.section} · {course.sks} SKS · {config.lecturer || "Dosen belum diisi"} · {config.day} {config.start}–{config.end} · {config.room || "Ruangan belum diisi"}</p>
                      </div>
                    );
                  })}
                  {customCourses.filter((course) => course.name.trim()).map((course, index) => (
                    <div key={`extra-${index}`} className="rounded-xl bg-muted p-3.5">
                      <p className="text-sm font-bold">{course.name} <span className="text-[10px] font-semibold text-academic">TAMBAHAN</span></p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{course.faculty || "Di luar kurikulum"} · {course.sks} SKS · {course.day} {course.start}–{course.end} · {course.countsTowardGraduation ? "Dihitung untuk kelulusan" : "Tidak dihitung"}</p>
                    </div>
                  ))}
                  {!activeCodes.length && !customCourses.length && <p className="text-sm text-muted-foreground">Belum ada mata kuliah aktif yang dipilih.</p>}
                </div>
              </div>

              <div className="academic-card p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Clock3 className="size-4 text-academic" />Hari ini · {todayName}</p>
                <div className="mt-3 space-y-2">
                  {todaySchedule.length ? todaySchedule.map((item) => (
                    <div key={item.key} className="flex items-center gap-3 rounded-xl bg-muted p-3.5">
                      <span className="font-display text-sm font-bold text-academic">{item.start}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{item.start} – {item.end} · {item.room || "Ruangan belum diisi"}</span>
                      </span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">Tidak ada jadwal hari ini — waktu yang tepat untuk belajar lebih dulu.</p>}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3">
          <Button variant="ghost" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}><ArrowLeft className="size-4" />Kembali</Button>
          <p className="hidden text-xs text-muted-foreground sm:block">{steps[step - 1]?.hint}</p>
          {step < steps.length
            ? <Button variant="academic" disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>Lanjut<ArrowRight className="size-4" /></Button>
            : <Button variant="academic" onClick={finish}>Buka dasborku<ArrowRight className="size-4" /></Button>}
        </div>
      </div>
    </div>
  );
}

function CoursePicker({ title, courses, selected, completed, onToggle }: { title: string; courses: CatalogCourse[]; selected: string[]; completed: string[]; onToggle: (code: string) => void }) {
  return (
    <div className="academic-card p-5">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {courses.map((course) => {
          const picked = selected.includes(course.code);
          const { status, missing } = courseAvailability(course, completed);
          const locked = status === "Locked" && !picked;
          return (
            <button key={course.code} onClick={() => onToggle(course.code)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${picked ? "border-academic bg-accent" : locked ? "border-input bg-muted/60 opacity-70 hover:opacity-100" : "border-input bg-surface hover:bg-muted"}`}>
              <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${picked ? "border-academic bg-academic text-academic-foreground" : "border-input"}`}>{picked && <Check className="size-3.5" />}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-5">{course.name}</span>
                <span className="block text-[11px] text-muted-foreground">{course.code} · {course.sks} SKS · {course.category}</span>
                {locked && <span className="mt-1 block text-[11px] font-semibold text-destructive">Terkunci · perlu {missing.join(", ")}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepTitle({ icon: Icon, eyebrow, title, subtitle }: { icon: typeof UserRound; eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-academic"><Icon className="size-5" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase text-academic">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold leading-7">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>{children}</label>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}
