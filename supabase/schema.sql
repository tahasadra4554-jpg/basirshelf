-- ============================================================================
-- BasirShelf — database schema
-- Run this once in Supabase → SQL Editor, then run supabase/seed.sql
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'App user profile. role: student | teacher';

-- ----------------------------------------------------------------------------
-- 2. books
-- ----------------------------------------------------------------------------
create table if not exists public.books (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  cover_image_url text,
  teacher_id      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists books_teacher_id_idx on public.books (teacher_id);
create index if not exists books_title_idx on public.books (lower(title));

-- ----------------------------------------------------------------------------
-- 3. sections
-- ----------------------------------------------------------------------------
create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books (id) on delete cascade,
  title       text not null,
  video_url   text,
  handout_url text,
  image_url   text,
  audio_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Added later for existing installations (idempotent).
alter table public.sections add column if not exists image_url text;
alter table public.sections add column if not exists audio_url text;
alter table public.sections add column if not exists images_url text;

create index if not exists sections_book_id_idx on public.sections (book_id);
create index if not exists sections_book_sort_idx
  on public.sections (book_id, sort_order);

-- ----------------------------------------------------------------------------
-- RLS helpers
--
-- The server sets a transaction-local GUC (`app.jwt`) with the acting user and
-- role before every write. Policies read it through public.current_role() /
-- public.current_uid(). Everything stays readable by anyone signed in or out
-- (public catalogue); only the owning teacher can write.
-- ----------------------------------------------------------------------------

create or replace function public.current_uid()
returns uuid language sql stable as $fn$
  select nullif(
    nullif(coalesce(current_setting('app.jwt', true), ''), '')::json ->> 'sub',
    ''
  )::uuid;
$fn$;

create or replace function public.current_role()
returns text language sql stable as $fn$
  select coalesce(
    nullif(nullif(coalesce(current_setting('app.jwt', true), ''), '')::json ->> 'role', ''),
    (select role from public.profiles where id = auth.uid()),
    'anon'
  );
$fn$;

create or replace function public.is_teacher()
returns boolean language sql stable as $fn$
  select public.current_role() = 'teacher';
$fn$;

-- Transaction-local claim setter (used by the Next.js server via RPC).
create or replace function public.set_local_jwt(jwt_claim text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.jwt', jwt_claim, true);
end;
$$;

-- Variant for clients that cannot call the local setter.
create or replace function public.set_jwt_claim(jwt_claim text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.jwt', jwt_claim, false);
end;
$$;

grant execute on function public.set_local_jwt(text) to anon, authenticated;
grant execute on function public.set_jwt_claim(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.sections enable row level security;

-- ----------------------------------------------------------------------------
-- profiles policies
-- ----------------------------------------------------------------------------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to anon, authenticated
  using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- books policies — public read, any teacher writes
-- ----------------------------------------------------------------------------
drop policy if exists "books_select" on public.books;
create policy "books_select" on public.books
  for select to anon, authenticated
  using (true);

drop policy if exists "books_insert_owner" on public.books;
drop policy if exists "books_insert_teacher" on public.books;
create policy "books_insert_teacher" on public.books
  for insert to authenticated
  with check (public.is_teacher());

drop policy if exists "books_update_owner" on public.books;
drop policy if exists "books_update_teacher" on public.books;
create policy "books_update_teacher" on public.books
  for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "books_delete_owner" on public.books;
drop policy if exists "books_delete_teacher" on public.books;
create policy "books_delete_teacher" on public.books
  for delete to authenticated
  using (public.is_teacher());

-- ----------------------------------------------------------------------------
-- sections policies — public read, any teacher writes
-- ----------------------------------------------------------------------------
drop policy if exists "sections_select" on public.sections;
create policy "sections_select" on public.sections
  for select to anon, authenticated
  using (true);

drop policy if exists "sections_insert_owner" on public.sections;
drop policy if exists "sections_insert_teacher" on public.sections;
create policy "sections_insert_teacher" on public.sections
  for insert to authenticated
  with check (public.is_teacher());

drop policy if exists "sections_update_owner" on public.sections;
drop policy if exists "sections_update_teacher" on public.sections;
create policy "sections_update_teacher" on public.sections
  for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "sections_delete_owner" on public.sections;
drop policy if exists "sections_delete_teacher" on public.sections;
create policy "sections_delete_teacher" on public.sections
  for delete to authenticated
  using (public.is_teacher());

-- ----------------------------------------------------------------------------
-- Trigger: create a profile row on signup (default role = student)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'student') = 'teacher'
        then 'teacher'
      else 'student'
    end
  )
  on conflict (id) do update
    set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Storage: public bucket for handout PDFs
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'handouts',
  'handouts',
  true,
  26214400, -- 25 MB
  array['application/pdf']
)
on conflict (id) do nothing;

-- Book cover uploads (teacher panel → direct upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Lesson images attached to units.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Lesson audio attached to units.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  true,
  52428800, -- 50 MB
  array[
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
    'audio/aac', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/webm',
    'audio/flac'
  ]
)
on conflict (id) do nothing;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('covers', 'images', 'audio'));

drop policy if exists "media_teacher_write" on storage.objects;
create policy "media_teacher_write" on storage.objects
  for insert to authenticated, service_role
  with check (bucket_id in ('covers', 'images', 'audio'));

drop policy if exists "media_teacher_update" on storage.objects;
create policy "media_teacher_update" on storage.objects
  for update to authenticated, service_role
  using (bucket_id in ('covers', 'images', 'audio'));

drop policy if exists "media_teacher_delete" on storage.objects;
create policy "media_teacher_delete" on storage.objects
  for delete to authenticated, service_role
  using (bucket_id in ('covers', 'images', 'audio'));

drop policy if exists "handouts_public_read" on storage.objects;
create policy "handouts_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'handouts');

drop policy if exists "handouts_teacher_write" on storage.objects;
create policy "handouts_teacher_write" on storage.objects
  for insert to authenticated, service_role
  with check (bucket_id = 'handouts');

drop policy if exists "handouts_teacher_update" on storage.objects;
create policy "handouts_teacher_update" on storage.objects
  for update to authenticated, service_role
  using (bucket_id = 'handouts');

drop policy if exists "handouts_teacher_delete" on storage.objects;
create policy "handouts_teacher_delete" on storage.objects
  for delete to authenticated, service_role
  using (bucket_id = 'handouts');

-- ----------------------------------------------------------------------------
-- 4. section_files — multiple files per section
-- ----------------------------------------------------------------------------
create table if not exists public.section_files (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  type text not null check (type in ('video', 'audio', 'pdf', 'image')),
  name text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists section_files_section_id_idx on public.section_files (section_id);
create index if not exists section_files_section_id_type_idx on public.section_files (section_id, type);
create index if not exists section_files_type_idx on public.section_files (type);
create index if not exists section_files_sort_idx on public.section_files (section_id, type, sort_order);

alter table public.section_files enable row level security;

drop policy if exists "section_files_select" on public.section_files;
create policy "section_files_select" on public.section_files
  for select to anon, authenticated
  using (true);

drop policy if exists "section_files_insert_teacher" on public.section_files;
create policy "section_files_insert_teacher" on public.section_files
  for insert to authenticated
  with check (public.is_teacher());

drop policy if exists "section_files_update_teacher" on public.section_files;
create policy "section_files_update_teacher" on public.section_files
  for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

drop policy if exists "section_files_delete_teacher" on public.section_files;
create policy "section_files_delete_teacher" on public.section_files
  for delete to authenticated
  using (public.is_teacher());

-- ----------------------------------------------------------------------------
-- Realtime (optional, handy for live section updates)
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.books;
alter publication supabase_realtime add table public.sections;
DO $$
BEGIN
  BEGIN
    alter publication supabase_realtime add table public.section_files;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
