-- ============================================================================
-- BasirShelf — seed data
-- Run AFTER supabase/schema.sql
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
--
-- The "profiles.id" column references auth.users(id), so every teacher must
-- exist as an auth user first. The handle_new_user trigger from schema.sql
-- then creates the profile row; the upsert below only forces role = teacher.
-- ============================================================================

begin;

-- Auth users for the 5 hidden teacher accounts -----------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '3f2a1b40-0001-4a10-9f21-1a2b3c4d0001', 'authenticated', 'authenticated', 'teacher1@basirshelf.local', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mr. Basiri (Hamid)","username":"teacher1","role":"teacher"}'::jsonb, '2026-01-05T08:00:00.000Z'::timestamptz, now()),
  ('00000000-0000-0000-0000-000000000000', '3f2a1b40-0002-4a10-9f21-1a2b3c4d0002', 'authenticated', 'authenticated', 'teacher2@basirshelf.local', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ms. Basiri (Sara)","username":"teacher2","role":"teacher"}'::jsonb, '2026-01-05T08:00:00.000Z'::timestamptz, now()),
  ('00000000-0000-0000-0000-000000000000', '3f2a1b40-0003-4a10-9f21-1a2b3c4d0003', 'authenticated', 'authenticated', 'teacher3@basirshelf.local', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mr. Basiri (Reza)","username":"teacher3","role":"teacher"}'::jsonb, '2026-01-05T08:00:00.000Z'::timestamptz, now()),
  ('00000000-0000-0000-0000-000000000000', '3f2a1b40-0004-4a10-9f21-1a2b3c4d0004', 'authenticated', 'authenticated', 'teacher4@basirshelf.local', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ms. Basiri (Mina)","username":"teacher4","role":"teacher"}'::jsonb, '2026-01-05T08:00:00.000Z'::timestamptz, now()),
  ('00000000-0000-0000-0000-000000000000', '3f2a1b40-0005-4a10-9f21-1a2b3c4d0005', 'authenticated', 'authenticated', 'teacher5@basirshelf.local', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mr. Basiri (Ali)","username":"teacher5","role":"teacher"}'::jsonb, '2026-01-05T08:00:00.000Z'::timestamptz, now()),
  ('00000000-0000-0000-0000-000000000000', '3f2a1b40-0006-4a10-9f21-1a2b3c4d0006', 'authenticated', 'authenticated', 'teacher6@basirshelf.local', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mr. Khotanlo","username":"teacher6","role":"teacher"}'::jsonb, '2026-01-05T08:00:00.000Z'::timestamptz, now()),
  ('00000000-0000-0000-0000-000000000000', '3f2a1b40-0007-4a10-9f21-1a2b3c4d0007', 'authenticated', 'authenticated', 'teacher7@basirshelf.local', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mr. Babaeian","username":"teacher7","role":"teacher"}'::jsonb, '2026-01-05T08:00:00.000Z'::timestamptz, now())
on conflict (id) do update
  set updated_at = now();

-- Profiles (teachers) — normally created by the signup trigger -------------
insert into public.profiles (id, full_name, role, created_at) values
  ('3f2a1b40-0001-4a10-9f21-1a2b3c4d0001', 'Mr. Basiri (Hamid)', 'teacher', '2026-01-05T08:00:00.000Z'::timestamptz),
  ('3f2a1b40-0002-4a10-9f21-1a2b3c4d0002', 'Ms. Basiri (Sara)', 'teacher', '2026-01-05T08:00:00.000Z'::timestamptz),
  ('3f2a1b40-0003-4a10-9f21-1a2b3c4d0003', 'Mr. Basiri (Reza)', 'teacher', '2026-01-05T08:00:00.000Z'::timestamptz),
  ('3f2a1b40-0004-4a10-9f21-1a2b3c4d0004', 'Ms. Basiri (Mina)', 'teacher', '2026-01-05T08:00:00.000Z'::timestamptz),
  ('3f2a1b40-0005-4a10-9f21-1a2b3c4d0005', 'Mr. Basiri (Ali)', 'teacher', '2026-01-05T08:00:00.000Z'::timestamptz),
  ('3f2a1b40-0006-4a10-9f21-1a2b3c4d0006', 'Mr. Khotanlo', 'teacher', '2026-01-05T08:00:00.000Z'::timestamptz),
  ('3f2a1b40-0007-4a10-9f21-1a2b3c4d0007', 'Mr. Babaeian', 'teacher', '2026-01-05T08:00:00.000Z'::timestamptz)
on conflict (id) do update
  set full_name = excluded.full_name,
      role      = 'teacher';

-- Books --------------------------------------------------------------------
insert into public.books (id, title, description, cover_image_url, teacher_id, created_at) values
  ('b0000000-1000-4000-8000-100000000001', 'Interchange 1', 'Level 1 of the Interchange series — from greetings and introductions to describing people, shopping, travel and talking about the past. The foundation of everyday grammar and conversation for beginners.', 'https://pocxeadaizwatqjdvfgo.supabase.co/storage/v1/object/public/covers/interchange-1.png', '3f2a1b40-0001-4a10-9f21-1a2b3c4d0001', '2026-01-10T08:00:00.000Z'::timestamptz),
  ('b0000000-2000-4000-8000-100000000002', 'Interchange 2', 'Level 2 of the Interchange series — conditionals, reported speech, the future, requests and advice. Builds fluency and expands practical vocabulary.', 'https://pocxeadaizwatqjdvfgo.supabase.co/storage/v1/object/public/covers/interchange-2.png', '3f2a1b40-0002-4a10-9f21-1a2b3c4d0002', '2026-01-11T08:00:00.000Z'::timestamptz),
  ('b0000000-3000-4000-8000-100000000003', 'Interchange 3', 'Level 3 of the Interchange series — more analytical topics such as the news, the environment, habits and giving explanations. Prepares students for free conversation and international exams.', 'https://pocxeadaizwatqjdvfgo.supabase.co/storage/v1/object/public/covers/interchange-3.png', '3f2a1b40-0003-4a10-9f21-1a2b3c4d0003', '2026-01-12T08:00:00.000Z'::timestamptz)
on conflict (id) do update
  set title           = excluded.title,
      description     = excluded.description,
      cover_image_url = excluded.cover_image_url;

-- Sections -----------------------------------------------------------------
insert into public.sections (id, book_id, title, video_url, handout_url, sort_order, created_at) values
  ('1984014d-24a4-44da-8e1b-a278e1ac5c7c', 'b0000000-1000-4000-8000-100000000001', 'Welcome — Getting started', NULL, NULL, 1, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('ebc744df-0311-4c43-b0ef-a9dd74ae30ae', 'b0000000-1000-4000-8000-100000000001', 'Unit 1 — Nice to meet you', NULL, NULL, 2, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('e0bed90c-342f-4a87-afda-e3ca72cc9256', 'b0000000-1000-4000-8000-100000000001', 'Unit 2 — Describing people', NULL, NULL, 3, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('5275c152-2181-47b6-8912-c0bc0e2f47c0', 'b0000000-1000-4000-8000-100000000001', 'Unit 3 — What are you doing?', NULL, NULL, 4, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('19a28774-1aaa-46e0-aa84-dfa90b7db66c', 'b0000000-1000-4000-8000-100000000001', 'Unit 4 — My everyday life', NULL, NULL, 5, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('f7aa4c69-a19f-4ad0-bc3c-90e9929975d2', 'b0000000-1000-4000-8000-100000000001', 'Unit 5 — Food and restaurants', NULL, NULL, 6, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('965f1450-9330-4ecd-8b7a-acccfc6fb19b', 'b0000000-1000-4000-8000-100000000001', 'Unit 6 — Jobs and workplaces', NULL, NULL, 7, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('e6157b1e-091a-46f2-83ac-e18283bd7271', 'b0000000-1000-4000-8000-100000000001', 'Unit 7 — Shopping for clothes', NULL, NULL, 8, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('793c920b-911f-47b6-82e3-02d48afc07d0', 'b0000000-1000-4000-8000-100000000001', 'Unit 8 — Talk about the past', NULL, NULL, 9, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('3ab89511-669a-4dab-b77b-d3c82f0fa5da', 'b0000000-1000-4000-8000-100000000001', 'Unit 9 — Vacations and travel', NULL, NULL, 10, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('c93956de-e9ca-4f8b-b6a8-56a0a247db72', 'b0000000-1000-4000-8000-100000000001', 'Unit 10 — Around the house', NULL, NULL, 11, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('ddb95f47-6f0c-445d-9653-d8bc0d7424cb', 'b0000000-1000-4000-8000-100000000001', 'Unit 11 — Parties and celebrations', NULL, NULL, 12, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('2f828685-9954-450d-8e2b-c92c9f3cdcaf', 'b0000000-1000-4000-8000-100000000001', 'Unit 12 — Hopes and dreams', NULL, NULL, 13, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('0e26e98a-e3f7-4405-bbfb-21dab391f5d7', 'b0000000-1000-4000-8000-100000000001', 'Unit 13 — Places to live', NULL, NULL, 14, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('1d3400b4-7c47-4a22-968e-e64b8a395c9e', 'b0000000-1000-4000-8000-100000000001', 'Unit 14 — Getting around town', NULL, NULL, 15, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('fef2b212-f56d-4b69-a932-20b816c84a2a', 'b0000000-1000-4000-8000-100000000001', 'Unit 15 — Free time activities', NULL, NULL, 16, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('3dc0c69a-dd95-4f10-8c4c-554dbb345aa5', 'b0000000-1000-4000-8000-100000000001', 'Unit 16 — Experiences and memories', NULL, NULL, 17, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('29503e0f-71b7-410d-8307-d7cf11d28d9d', 'b0000000-1000-4000-8000-100000000001', 'Review — Midterm (Units 1–8)', NULL, NULL, 18, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('3eb2978c-bf98-42c0-9c82-44a82651c35d', 'b0000000-1000-4000-8000-100000000001', 'Review — Final (Units 9–16)', NULL, NULL, 19, '2026-01-10T08:00:00.000Z'::timestamptz),
  ('1c68e505-6a96-49d3-b8a1-d6151f28cfda', 'b0000000-2000-4000-8000-100000000002', 'Welcome — Getting started', NULL, NULL, 1, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('826d3fa6-314d-4219-8743-a22f1adcfe52', 'b0000000-2000-4000-8000-100000000002', 'Unit 1 — Personal information', NULL, NULL, 2, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('2c783c01-1e79-40d7-a3a9-24f25d277caa', 'b0000000-2000-4000-8000-100000000002', 'Unit 2 — Talking about trends', NULL, NULL, 3, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('e57573f9-7e47-41ca-a13b-adfc965d8fd0', 'b0000000-2000-4000-8000-100000000002', 'Unit 3 — Getting together', NULL, NULL, 4, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('47cbeb67-c5dc-4ae2-9bab-ed848ad8af58', 'b0000000-2000-4000-8000-100000000002', 'Unit 4 — Making plans', NULL, NULL, 5, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('197b2aea-f859-4a29-a51a-51685b1522c2', 'b0000000-2000-4000-8000-100000000002', 'Unit 5 — Making requests', NULL, NULL, 6, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('46876ed4-7819-47f9-894c-0debae109545', 'b0000000-2000-4000-8000-100000000002', 'Unit 6 — Talking about food', NULL, NULL, 7, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('c3e806c6-ccda-40bb-be83-fc76efc6bd7a', 'b0000000-2000-4000-8000-100000000002', 'Unit 7 — Looking for a job', NULL, NULL, 8, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('23bf77c6-72ed-495e-b703-10b835075f31', 'b0000000-2000-4000-8000-100000000002', 'Unit 8 — Giving advice', NULL, NULL, 9, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('ac4e50cb-9213-41ee-a158-70bf76214132', 'b0000000-2000-4000-8000-100000000002', 'Unit 9 — Talking about the future', NULL, NULL, 10, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('f9d38931-33d5-4981-aea7-a71069c2b14c', 'b0000000-2000-4000-8000-100000000002', 'Unit 10 — Shopping', NULL, NULL, 11, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('bbe0409e-ed27-457d-8127-4e69331a0fac', 'b0000000-2000-4000-8000-100000000002', 'Unit 11 — Talking about health', NULL, NULL, 12, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('d0fc955a-949f-4483-ba90-27b08487a110', 'b0000000-2000-4000-8000-100000000002', 'Unit 12 — Taking vacations', NULL, NULL, 13, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('0ab131a8-e7b6-4638-9c50-6356df443989', 'b0000000-2000-4000-8000-100000000002', 'Unit 13 — Describing places', NULL, NULL, 14, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('c39b2fcc-76cd-45c8-96ca-813f5a9907a6', 'b0000000-2000-4000-8000-100000000002', 'Unit 14 — Giving opinions', NULL, NULL, 15, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('4eb8d778-f6cd-4532-a8a5-cb1a99d0514f', 'b0000000-2000-4000-8000-100000000002', 'Unit 15 — Talking about customs', NULL, NULL, 16, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('af10754b-0801-4416-8069-9f2d81ce9fbe', 'b0000000-2000-4000-8000-100000000002', 'Unit 16 — What happened next?', NULL, NULL, 17, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('ef8c28b8-2cb5-4383-93ad-0072ea023dfd', 'b0000000-2000-4000-8000-100000000002', 'Review — Midterm (Units 1–8)', NULL, NULL, 18, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('3ca60780-946a-4129-bbcc-23e30ef661f1', 'b0000000-2000-4000-8000-100000000002', 'Review — Final (Units 9–16)', NULL, NULL, 19, '2026-01-11T08:00:00.000Z'::timestamptz),
  ('c69aa141-460e-4dd3-aefb-6d73b870859d', 'b0000000-3000-4000-8000-100000000003', 'Welcome — Getting started', NULL, NULL, 1, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('4f1c4bf1-2ca4-4ac1-a3cd-204a9934f298', 'b0000000-3000-4000-8000-100000000003', 'Unit 1 — Personal impressions', NULL, NULL, 2, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('280a7e0f-458a-4c20-8fc5-eac53a92b349', 'b0000000-3000-4000-8000-100000000003', 'Unit 2 — Getting around', NULL, NULL, 3, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('7a866996-7c90-4d3c-9ad2-9d0d032f165c', 'b0000000-3000-4000-8000-100000000003', 'Unit 3 — Talking about the news', NULL, NULL, 4, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('3088d5d0-30c2-4bc3-81bb-d886996e81f7', 'b0000000-3000-4000-8000-100000000003', 'Unit 4 — Describing relationships', NULL, NULL, 5, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('14d8d9bd-9a62-4e32-9849-cff4c1914be1', 'b0000000-3000-4000-8000-100000000003', 'Unit 5 — Talking about wishes', NULL, NULL, 6, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('569c35c1-27a6-4d65-9b9c-232e28447247', 'b0000000-3000-4000-8000-100000000003', 'Unit 6 — Talking about change', NULL, NULL, 7, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('4505a351-046c-4899-8ba9-f3a1aaf585a5', 'b0000000-3000-4000-8000-100000000003', 'Unit 7 — Talking about experiences', NULL, NULL, 8, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('6d35d7cc-e719-4ef4-ae4a-e37f0f47ee0c', 'b0000000-3000-4000-8000-100000000003', 'Unit 8 — Talking about likes and dislikes', NULL, NULL, 9, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('1b5fba59-0ece-437e-8faf-307d0fc94127', 'b0000000-3000-4000-8000-100000000003', 'Unit 9 — Talking about habits', NULL, NULL, 10, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('95ed661a-1494-451c-8b36-092f1ef3b16a', 'b0000000-3000-4000-8000-100000000003', 'Unit 10 — Giving explanations', NULL, NULL, 11, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('bb516e05-952d-498a-bbb3-8207f5c41a6b', 'b0000000-3000-4000-8000-100000000003', 'Unit 11 — Talking about the environment', NULL, NULL, 12, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('15093d39-dade-4a1c-9f30-a550b86da0eb', 'b0000000-3000-4000-8000-100000000003', 'Unit 12 — Making plans and arrangements', NULL, NULL, 13, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('b1e10e27-a320-40d9-9a75-8a6cb6b4ed94', 'b0000000-3000-4000-8000-100000000003', 'Unit 13 — Talking about opinions', NULL, NULL, 14, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('056a90c1-b990-4343-bba2-09068e31843d', 'b0000000-3000-4000-8000-100000000003', 'Unit 14 — Talking about health', NULL, NULL, 15, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('de24108e-d4bd-4351-abd3-8f2ddf717418', 'b0000000-3000-4000-8000-100000000003', 'Unit 15 — Talking about work', NULL, NULL, 16, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('eeb7f417-2592-4112-b8f4-ed9247a8b69f', 'b0000000-3000-4000-8000-100000000003', 'Unit 16 — Talking about the future', NULL, NULL, 17, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('4dccc972-f413-420a-98d0-72a3c70316df', 'b0000000-3000-4000-8000-100000000003', 'Review — Midterm (Units 1–8)', NULL, NULL, 18, '2026-01-12T08:00:00.000Z'::timestamptz),
  ('e3b554f0-d269-4416-a264-0c99e54ac2d0', 'b0000000-3000-4000-8000-100000000003', 'Review — Final (Units 9–16)', NULL, NULL, 19, '2026-01-12T08:00:00.000Z'::timestamptz)
on conflict (id) do nothing;

commit;
