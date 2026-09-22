-- master data ---------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  faculty text not null,
  university text not null,
  curriculum_year int not null,
  total_sks int not null,
  created_at timestamptz not null default now()
);

create table public.curriculum_courses (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  code text not null,
  name text not null,
  sks int not null,
  course_group text not null,
  semester int not null,
  note text,
  unique (program_id, code)
);
create index curriculum_courses_code_idx on public.curriculum_courses (code);

create table public.course_prerequisites (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.curriculum_courses(id) on delete cascade,
  prereq_code text not null,
  prereq_course_id uuid references public.curriculum_courses(id) on delete set null,
  unique (course_id, prereq_code)
);

grant select on public.programs to anon, authenticated;
grant select on public.curriculum_courses to anon, authenticated;
grant select on public.course_prerequisites to anon, authenticated;
grant all on public.programs to service_role;
grant all on public.curriculum_courses to service_role;
grant all on public.course_prerequisites to service_role;

alter table public.programs enable row level security;
alter table public.curriculum_courses enable row level security;
alter table public.course_prerequisites enable row level security;

create policy "programs readable" on public.programs for select using (true);
create policy "curriculum readable" on public.curriculum_courses for select using (true);
create policy "prereqs readable" on public.course_prerequisites for select using (true);

-- personal data -------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  program_id uuid references public.programs(id) on delete set null,
  name text not null default '',
  program text not null default '',
  faculty text not null default '',
  university text not null default '',
  entry_year int,
  current_semester int not null default 1,
  target_gpa numeric(3,2),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_student_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.students where user_id = auth.uid()
$$;

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  number int not null,
  academic_year text,
  term text,
  gpa numeric(3,2),
  notes text,
  is_active boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, number)
);

create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  semester_id uuid references public.semesters(id) on delete set null,
  course_id uuid references public.curriculum_courses(id) on delete set null,
  course_code text not null,
  course_name text,
  sks int not null default 0,
  status text not null default 'current',
  created_at timestamptz not null default now(),
  unique (student_id, course_code)
);

create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid not null references public.course_enrollments(id) on delete cascade,
  section text not null default 'A',
  lecturer text,
  assistant text,
  room text,
  created_at timestamptz not null default now(),
  unique (enrollment_id)
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade,
  kind text not null default 'class',
  day text not null,
  start_time text not null,
  end_time text not null,
  room text,
  created_at timestamptz not null default now()
);

create table public.assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade,
  course_code text not null,
  section text,
  assistant text,
  day text,
  start_time text,
  end_time text,
  room text,
  link text,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade,
  course_code text,
  kind text not null default 'other',
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade,
  course_code text,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade,
  course_code text,
  title text not null,
  detail text,
  due_at timestamptz,
  priority text not null default 'normal',
  status text not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade,
  course_code text,
  kind text not null default 'UTS',
  scheduled_at timestamptz,
  room text,
  weight numeric(5,2),
  note text,
  created_at timestamptz not null default now()
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade,
  course_code text,
  component text not null default 'Final',
  score numeric(5,2),
  weight numeric(5,2),
  letter text,
  gpa_points numeric(3,2),
  created_at timestamptz not null default now()
);

create table public.custom_courses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  provider text,
  sks int not null default 0,
  semester int,
  note text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;
create policy "own student row" on public.students for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['semesters','course_enrollments','course_sections','schedules','assistant_sessions','resources','notes','tasks','exams','grades','custom_courses']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (student_id = public.current_student_id()) with check (student_id = public.current_student_id())', t);
    execute format('create index %I on public.%I (student_id)', t || '_student_idx', t);
  end loop;
end $$;

insert into public.programs (code, name, faculty, university, curriculum_year, total_sks)
values ('MGT-FEBUI-2024', 'Manajemen', 'Fakultas Ekonomi dan Bisnis', 'Universitas Indonesia', 2024, 144)
on conflict (code) do nothing;

insert into public.curriculum_courses (program_id, code, name, sks, course_group, semester, note)
select p.id, v.code, v.name, v.sks, v.course_group, v.semester, v.note
from public.programs p
cross join (values
  ('UIGE600004', 'MPK Agama', 2, 'MKWU', 1, null),
  ('UIGE600003', 'MPK Bahasa Inggris', 2, 'MKWU', 1, null),
  ('ECMN600001', 'Pengantar Bisnis', 2, 'MKWF', 1, null),
  ('ECCL600001', 'Literasi dalam Bahasa Inggris', 2, 'MKWF', 1, null),
  ('ECMN600002', 'Pengantar Teknologi Informasi', 3, 'MKWP', 1, null),
  ('ECEE600002', 'Matematika Dasar untuk Bisnis dan Ekonomi', 3, 'MKWF', 1, null),
  ('ECEE600001', 'Pengantar Ekonomi 1', 3, 'MKWF', 1, null),
  ('ECAC600001', 'Pengantar Akuntansi', 3, 'MKWF', 1, null),
  ('UIGE600007', 'MPK Terintegrasi (MPKT)', 6, 'MKWU', 2, null),
  ('ECEE600003', 'Statistika Ekonomi dan Bisnis', 3, 'MKWF', 2, null),
  ('ECEE600004', 'Pengantar Ekonomi 2', 3, 'MKWF', 2, null),
  ('ECMN600003', 'Pengantar Manajemen', 2, 'MKWF', 2, null),
  ('ECCL600004', 'Teknik Penulisan Akademik dan Pengantar Komunikasi Bisnis', 2, 'MKWF', 2, null),
  ('ECMN600004', 'Pengantar Hukum Bisnis', 3, 'MKWP', 2, null),
  ('ECCL600002', 'Pengantar Kewirausahaan', 2, 'MKWF', 3, 'Pilih salah satu dengan Dasar-dasar Kepemimpinan'),
  ('ECCL600006', 'Dasar-dasar Kepemimpinan', 2, 'MKWF', 3, 'Pilih salah satu dengan Pengantar Kewirausahaan'),
  ('ECCL600003', 'Koperasi', 2, 'MKWF', 3, null),
  ('ECCL600005', 'Manusia sebagai Pelaku Ekonomi dan Bisnis', 2, 'MKWF', 3, null),
  ('ECMN600005', 'Pengantar Manajemen Sains', 3, 'MKWP', 3, null),
  ('ECMN600006', 'Manajemen Keuangan', 3, 'MKWF', 3, null),
  ('ECMN600007', 'Manajemen Pemasaran', 3, 'MKWP', 3, null),
  ('ECMN600008', 'Perilaku Keorganisasian', 3, 'MKWP', 3, null),
  ('ECAC600055', 'Akuntansi Biaya untuk Manajemen', 2, 'MKWP', 3, null),
  ('ECMN600009', 'Manajemen Sumber Daya Manusia', 3, 'MKWP', 4, null),
  ('ECEE600007', 'Mikroekonomi 1', 3, 'MKWP', 4, null),
  ('ECMN600010', 'Manajemen Operasi', 3, 'MKWP', 4, null),
  ('ECMN600011', 'Manajemen Informasi Perusahaan', 3, 'MKWP', 4, null),
  ('ECMN600012', 'Pasar dan Lembaga Keuangan', 3, 'MKWP', 4, null),
  ('ECMN600013', 'Struktur dan Proses Organisasi', 2, 'MKWP', 4, null),
  ('ECEE600005', 'Statistik Lanjutan', 3, 'MKWP', 4, 'Pilih salah satu kelompok pilihan semester 4'),
  ('ECMN600014', 'Perilaku Konsumen', 3, 'MKWP', 4, 'Pilih salah satu kelompok pilihan semester 4'),
  ('ECMN600015', 'Analitika Data untuk Manajemen', 3, 'MKWP', 4, 'Pilih salah satu kelompok pilihan semester 4'),
  ('ECMN600016', 'Dinamika Kelompok', 3, 'MKWP', 4, 'Pilih salah satu kelompok pilihan semester 4'),
  ('ECMN600017', 'Pengambilan Keputusan Manajerial', 3, 'MKWP', 5, null),
  ('ECMN600018', 'Metode Riset Bisnis', 3, 'MKWP', 5, null),
  ('ECAC600056', 'Akuntansi Manajemen untuk Bisnis', 2, 'MKWP', 5, null),
  ('ECMN600019', 'Pengelolaan Risiko Usaha', 2, 'MKWP', 5, null),
  ('ECMN600020', 'Bisnis Internasional', 3, 'MKWP', 5, null),
  ('ECMN600021', 'Analisis Laporan Keuangan', 3, 'MKWP', 5, 'Pilih salah satu kelompok pilihan semester 5'),
  ('ECMN600022', 'Hubungan Industrial', 3, 'MKWP', 5, 'Pilih salah satu kelompok pilihan semester 5'),
  ('ECMN600023', 'Perencanaan Pemasaran', 3, 'MKWP', 5, 'Pilih salah satu kelompok pilihan semester 5'),
  ('ECMN600024', 'Manajemen Rantai Pasok', 3, 'MKWP', 5, 'Pilih salah satu kelompok pilihan semester 5'),
  ('ECMN600036', 'Manajemen Distribusi', 3, 'Peminatan', 6, null),
  ('ECMN600037', 'Pemasaran Internasional', 3, 'Peminatan', 6, null),
  ('ECMN600038', 'Komunikasi Pemasaran', 3, 'Peminatan', 6, null),
  ('ECMN600039', 'Pemasaran Jasa', 3, 'Peminatan', 6, null),
  ('ECMN600040', 'Manajemen Produk dan Harga', 3, 'Peminatan', 6, null),
  ('ECMN600041', 'Pemasaran Relasional', 3, 'Peminatan', 6, null),
  ('ECMN600029', 'Manajemen Stratejik', 3, 'MKWP', 7, null),
  ('ECMN600030', 'Kewirausahaan', 3, 'MKWP', 7, null),
  ('ECMN600031', 'Bisnis dan Ekonomi Indonesia', 3, 'MKWP', 7, null),
  ('ECMN600032', 'Tanggung Jawab Sosial dan Etika Bisnis', 2, 'MKWP', 7, null),
  ('ECMN600026', 'Praktikum Riset Pemasaran', 3, 'MKWP', 7, 'Pilih praktikum riset sesuai peminatan'),
  ('ECMN600025', 'Praktikum Riset Keuangan', 3, 'MKWP', 7, 'Pilih praktikum riset sesuai peminatan'),
  ('ECMN600027', 'Praktikum Riset Sumber Daya Manusia', 3, 'MKWP', 7, 'Pilih praktikum riset sesuai peminatan'),
  ('ECMN600028', 'Praktikum Riset Manajemen Operasi', 3, 'MKWP', 7, 'Pilih praktikum riset sesuai peminatan'),
  ('ECMN600033', 'Skripsi', 6, 'Tugas Akhir', 8, 'Pilih salah satu jalur tugas akhir'),
  ('ECMN600034', 'Magang Karya Akhir', 6, 'Tugas Akhir', 8, 'Pilih salah satu jalur tugas akhir'),
  ('ECMN600035', 'Studi Mandiri + 1 Mata Kuliah Pengganti', 6, 'Tugas Akhir', 8, 'Pilih salah satu jalur tugas akhir')
) as v(code, name, sks, course_group, semester, note)
where p.code = 'MGT-FEBUI-2024'
on conflict (program_id, code) do nothing;

insert into public.course_prerequisites (course_id, prereq_code, prereq_course_id)
select c.id, v.prereq, pc.id
from (values ('ECEE600004', 'ECEE600001'), ('ECCL600004', 'ECCL600001'), ('ECMN600004', 'ECMN600001'), ('ECMN600004', 'ECMN600003'), ('ECCL600006', 'ECMN600003'), ('ECMN600005', 'ECEE600002'), ('ECMN600005', 'ECEE600003'), ('ECMN600006', 'ECMN600001'), ('ECMN600006', 'ECMN600003'), ('ECMN600007', 'ECMN600001'), ('ECMN600007', 'ECMN600003'), ('ECMN600008', 'ECMN600001'), ('ECMN600008', 'ECMN600003'), ('ECAC600055', 'ECAC600001'), ('ECMN600009', 'ECMN600001'), ('ECMN600009', 'ECMN600003'), ('ECMN600009', 'ECMN600008'), ('ECEE600007', 'ECEE600001'), ('ECEE600007', 'ECEE600004'), ('ECMN600010', 'ECMN600001'), ('ECMN600010', 'ECMN600003'), ('ECMN600011', 'ECMN600003'), ('ECMN600011', 'ECMN600002'), ('ECMN600012', 'ECMN600006'), ('ECMN600012', 'ECMN600004'), ('ECMN600013', 'ECMN600001'), ('ECMN600013', 'ECMN600003'), ('ECMN600013', 'ECMN600008'), ('ECEE600005', 'ECEE600003'), ('ECMN600014', 'ECMN600007'), ('ECMN600015', 'ECMN600002'), ('ECMN600015', 'ECEE600003'), ('ECMN600015', 'ECMN600005'), ('ECMN600016', 'ECMN600008'), ('ECMN600017', 'ECMN600005'), ('ECMN600018', 'ECEE600003'), ('ECAC600056', 'ECAC600055'), ('ECMN600019', 'ECMN600001'), ('ECMN600019', 'ECMN600003'), ('ECMN600020', 'ECMN600003'), ('ECMN600021', 'ECMN600006'), ('ECMN600022', 'ECMN600009'), ('ECMN600022', 'ECMN600008'), ('ECMN600023', 'ECMN600007'), ('ECMN600023', 'ECMN600014'), ('ECMN600024', 'ECMN600010'), ('ECMN600036', 'ECMN600007'), ('ECMN600037', 'ECMN600007'), ('ECMN600037', 'ECMN600020'), ('ECMN600038', 'ECMN600007'), ('ECMN600039', 'ECMN600007'), ('ECMN600040', 'ECMN600007'), ('ECMN600041', 'ECMN600007'), ('ECMN600041', 'ECMN600014'), ('ECMN600029', 'ECMN600006'), ('ECMN600029', 'ECMN600007'), ('ECMN600029', 'ECMN600010'), ('ECMN600029', 'ECMN600009'), ('ECMN600030', 'ECMN600001'), ('ECMN600030', 'ECMN600003'), ('ECMN600031', 'ECEE600007'), ('ECMN600032', 'ECMN600001'), ('ECMN600026', 'ECMN600018'), ('ECMN600026', 'ECMN600014'), ('ECMN600026', 'ECMN600007'), ('ECMN600025', 'ECMN600018'), ('ECMN600025', 'ECEE600005'), ('ECMN600025', 'ECMN600021'), ('ECMN600027', 'ECMN600018'), ('ECMN600027', 'ECMN600008'), ('ECMN600027', 'ECMN600009'), ('ECMN600028', 'ECMN600018'), ('ECMN600028', 'ECMN600010'), ('ECMN600033', 'ECMN600026'), ('ECMN600034', 'ECMN600026'), ('ECMN600035', 'ECMN600026')) as v(code, prereq)
join public.curriculum_courses c on c.code = v.code
left join public.curriculum_courses pc on pc.code = v.prereq
on conflict do nothing;