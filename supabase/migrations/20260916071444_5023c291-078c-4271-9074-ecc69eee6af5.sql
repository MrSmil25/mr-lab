-- Curriculum versioning: a program is identified by code + curriculum year
alter table public.programs
  add column if not exists curriculum_year integer not null default 2024,
  add column if not exists degree text,
  add column if not exists is_active boolean not null default true;

alter table public.programs drop constraint if exists programs_code_key;
create unique index if not exists programs_code_year_key on public.programs (code, curriculum_year);

-- Normalised course categories
alter table public.curriculum_courses
  add column if not exists category text,
  add column if not exists track text;

update public.curriculum_courses set category = case course_group
  when 'MKWU' then 'University Mandatory'
  when 'MKWF' then 'Faculty Mandatory'
  when 'MKWP' then 'Program Mandatory'
  when 'Peminatan' then 'Elective'
  when 'Tugas Akhir' then 'Final Project'
  else coalesce(category, 'Elective') end
where category is null;

update public.curriculum_courses set category = 'Internship' where code = 'ECMN600034';

alter table public.curriculum_courses
  add constraint curriculum_courses_category_check
  check (category is null or category in ('University Mandatory','Faculty Mandatory','Program Mandatory','Elective','Final Project','Internship'));

create index if not exists idx_curriculum_courses_program on public.curriculum_courses (program_id, semester);