-- Migration: Create section_files table for multi-file per unit support
-- This allows each unit to have multiple videos, audios, PDFs, images with names

-- Create section_files table
create table if not exists public.section_files (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  type text not null check (type in ('video', 'audio', 'pdf', 'image')),
  name text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for fast queries on section_id and type
create index if not exists section_files_section_id_idx on public.section_files (section_id);
create index if not exists section_files_section_id_type_idx on public.section_files (section_id, type);
create index if not exists section_files_type_idx on public.section_files (type);
create index if not exists section_files_sort_idx on public.section_files (section_id, type, sort_order);

-- Enable RLS
alter table public.section_files enable row level security;

-- RLS Policies
-- All authenticated users can read files for sections in books they can access (public read)
drop policy if exists "section_files_select" on public.section_files;
create policy "section_files_select" on public.section_files
  for select to anon, authenticated
  using (true);

-- Teachers can insert/update/delete files only for their own sections (any teacher for now, matching existing sections policy)
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

-- Migrate existing data from old columns into section_files (one row per existing URL)
-- Videos
insert into public.section_files (section_id, type, name, url, sort_order)
select id, 'video', title || ' - Video', video_url, 0
from public.sections
where video_url is not null and trim(video_url) <> ''
on conflict do nothing;

-- Audios
insert into public.section_files (section_id, type, name, url, sort_order)
select id, 'audio', title || ' - Audio', audio_url, 0
from public.sections
where audio_url is not null and trim(audio_url) <> ''
on conflict do nothing;

-- PDFs (handouts)
insert into public.section_files (section_id, type, name, url, sort_order)
select id, 'pdf', title || ' - Handout', handout_url, 0
from public.sections
where handout_url is not null and trim(handout_url) <> ''
on conflict do nothing;

-- Images: single image_url
insert into public.section_files (section_id, type, name, url, sort_order)
select id, 'image', title || ' - Image', image_url, 0
from public.sections
where image_url is not null and trim(image_url) <> ''
and (images_url is null or trim(images_url) = '' or trim(images_url) = trim(image_url))
on conflict do nothing;

-- Images: images_url comma-separated - handle first 10 images per section
-- This uses string_to_array to split comma-separated URLs
insert into public.section_files (section_id, type, name, url, sort_order)
select 
  s.id,
  'image',
  s.title || ' - Image ' || (gs.n),
  trim(both from gs.url),
  gs.n - 1
from public.sections s,
lateral (
  select row_number() over () as n, unnest(string_to_array(s.images_url, ',')) as url
) gs
where s.images_url is not null and trim(s.images_url) <> ''
and trim(both from gs.url) <> ''
and trim(both from gs.url) ~ '^https?://'
on conflict do nothing;

-- Add to realtime publication
alter publication supabase_realtime add table public.section_files;

-- Comment
comment on table public.section_files is 'Multiple files per section: videos, audios, PDFs, images with names and sort order';
