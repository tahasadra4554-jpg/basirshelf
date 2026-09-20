import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/* ------------------------------------------------------------------ *
 * Single source of truth for the seed data.
 * Emits: data/db.json (local dev store) + supabase/seed.sql
 * ------------------------------------------------------------------ */

const TEACHERS = [
  {
    id: "3f2a1b40-0001-4a10-9f21-1a2b3c4d0001",
    full_name: "Mr. Basiri (Hamid)",
    created_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "3f2a1b40-0002-4a10-9f21-1a2b3c4d0002",
    full_name: "Ms. Basiri (Sara)",
    created_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "3f2a1b40-0003-4a10-9f21-1a2b3c4d0003",
    full_name: "Mr. Basiri (Reza)",
    created_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "3f2a1b40-0004-4a10-9f21-1a2b3c4d0004",
    full_name: "Ms. Basiri (Mina)",
    created_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "3f2a1b40-0005-4a10-9f21-1a2b3c4d0005",
    full_name: "Mr. Basiri (Ali)",
    created_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "3f2a1b40-0006-4a10-9f21-1a2b3c4d0006",
    full_name: "Mr. Khotanlo",
    created_at: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "3f2a1b40-0007-4a10-9f21-1a2b3c4d0007",
    full_name: "Mr. Babaeian",
    created_at: "2026-01-05T08:00:00.000Z",
  },
];

const INTERCHANGE_1 = [
  "Unit 1 — Nice to meet you",
  "Unit 2 — Describing people",
  "Unit 3 — What are you doing?",
  "Unit 4 — My everyday life",
  "Unit 5 — Food and restaurants",
  "Unit 6 — Jobs and workplaces",
  "Unit 7 — Shopping for clothes",
  "Unit 8 — Talk about the past",
  "Unit 9 — Vacations and travel",
  "Unit 10 — Around the house",
  "Unit 11 — Parties and celebrations",
  "Unit 12 — Hopes and dreams",
  "Unit 13 — Places to live",
  "Unit 14 — Getting around town",
  "Unit 15 — Free time activities",
  "Unit 16 — Experiences and memories",
];

const INTERCHANGE_2 = [
  "Unit 1 — Personal information",
  "Unit 2 — Talking about trends",
  "Unit 3 — Getting together",
  "Unit 4 — Making plans",
  "Unit 5 — Making requests",
  "Unit 6 — Talking about food",
  "Unit 7 — Looking for a job",
  "Unit 8 — Giving advice",
  "Unit 9 — Talking about the future",
  "Unit 10 — Shopping",
  "Unit 11 — Talking about health",
  "Unit 12 — Taking vacations",
  "Unit 13 — Describing places",
  "Unit 14 — Giving opinions",
  "Unit 15 — Talking about customs",
  "Unit 16 — What happened next?",
];

const INTERCHANGE_3 = [
  "Unit 1 — Personal impressions",
  "Unit 2 — Getting around",
  "Unit 3 — Talking about the news",
  "Unit 4 — Describing relationships",
  "Unit 5 — Talking about wishes",
  "Unit 6 — Talking about change",
  "Unit 7 — Talking about experiences",
  "Unit 8 — Talking about likes and dislikes",
  "Unit 9 — Talking about habits",
  "Unit 10 — Giving explanations",
  "Unit 11 — Talking about the environment",
  "Unit 12 — Making plans and arrangements",
  "Unit 13 — Talking about opinions",
  "Unit 14 — Talking about health",
  "Unit 15 — Talking about work",
  "Unit 16 — Talking about the future",
];

const BOOKS = [
  {
    id: "b0000000-1000-4000-8000-100000000001",
    title: "Interchange 1",
    level: "Elementary",
    description:
      "Level 1 of the Interchange series — from greetings and introductions to describing people, shopping, travel and talking about the past. The foundation of everyday grammar and conversation for beginners.",
    cover_image_url:
      "https://pocxeadaizwatqjdvfgo.supabase.co/storage/v1/object/public/covers/interchange-1.png",
    teacher_id: TEACHERS[0].id,
    units: INTERCHANGE_1,
    created_at: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "b0000000-2000-4000-8000-100000000002",
    title: "Interchange 2",
    level: "Pre-Intermediate",
    description:
      "Level 2 of the Interchange series — conditionals, reported speech, the future, requests and advice. Builds fluency and expands practical vocabulary.",
    cover_image_url:
      "https://pocxeadaizwatqjdvfgo.supabase.co/storage/v1/object/public/covers/interchange-2.png",
    teacher_id: TEACHERS[1].id,
    units: INTERCHANGE_2,
    created_at: "2026-01-11T08:00:00.000Z",
  },
  {
    id: "b0000000-3000-4000-8000-100000000003",
    title: "Interchange 3",
    level: "Intermediate",
    description:
      "Level 3 of the Interchange series — more analytical topics such as the news, the environment, habits and giving explanations. Prepares students for free conversation and international exams.",
    cover_image_url:
      "https://pocxeadaizwatqjdvfgo.supabase.co/storage/v1/object/public/covers/interchange-3.png",
    teacher_id: TEACHERS[2].id,
    units: INTERCHANGE_3,
    created_at: "2026-01-12T08:00:00.000Z",
  },
];

/**
 * Deterministic, RFC-4122-shaped UUID v4 derived from a seed string.
 * Deterministic so re-running the generator keeps stable ids and the seed
 * stays idempotent (ON CONFLICT DO NOTHING).
 */
function uuidFrom(seed) {
  const hash = createHash("sha256").update(String(seed)).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

function buildSections(book, index) {
  const sections = [];
  let order = 1;

  sections.push({
    id: uuidFrom(`${book.id}:welcome`),
    book_id: book.id,
    title: "Welcome — Getting started",
    video_url: null,
    handout_url: null,
    sort_order: order++,
    created_at: book.created_at,
  });

  book.units.forEach((unitTitle, i) => {
    sections.push({
      id: uuidFrom(`${book.id}:unit:${i + 1}`),
      book_id: book.id,
      title: unitTitle,
      video_url: null,
      handout_url: null,
      sort_order: order++,
      created_at: book.created_at,
    });
  });

  sections.push({
    id: uuidFrom(`${book.id}:midterm`),
    book_id: book.id,
    title: "Review — Midterm (Units 1–8)",
    video_url: null,
    handout_url: null,
    sort_order: order++,
    created_at: book.created_at,
  });

  sections.push({
    id: uuidFrom(`${book.id}:final`),
    book_id: book.id,
    title: "Review — Final (Units 9–16)",
    video_url: null,
    handout_url: null,
    sort_order: order++,
    created_at: book.created_at,
  });

  return sections;
}

const allSections = BOOKS.flatMap((book, index) => buildSections(book, index));

/* ---------------------------- db.json ---------------------------- */

const db = {
  profiles: TEACHERS.map((t) => ({
    id: t.id,
    full_name: t.full_name,
    role: "teacher",
    created_at: t.created_at,
  })),
  books: BOOKS.map((book) => ({
    id: book.id,
    title: book.title,
    description: book.description,
    cover_image_url: book.cover_image_url,
    teacher_id: book.teacher_id,
    created_at: book.created_at,
  })),
  sections: allSections,
};

mkdirSync("data", { recursive: true });
writeFileSync(
  join(process.cwd(), "data", "db.json"),
  JSON.stringify(db, null, 2) + "\n",
);

/* ---------------------------- seed.sql --------------------------- */

const q = (value) => (value === null || value === undefined ? "NULL" : `'${value}'`);

/** Value quoted for use inside a JSON/JSONB literal (double quotes). */
const j = (value) => JSON.stringify(value ?? null);

let sql = `-- ============================================================================
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
${TEACHERS.map(
  (t, i) =>
    `  ('00000000-0000-0000-0000-000000000000', '${t.id}', 'authenticated', 'authenticated', 'teacher${i + 1}@basirshelf.local', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":${j(t.full_name)},"username":"teacher${i + 1}","role":"teacher"}'::jsonb, '${t.created_at}'::timestamptz, now())`,
).join(",\n")}
on conflict (id) do update
  set updated_at = now();

-- Profiles (teachers) — normally created by the signup trigger -------------
insert into public.profiles (id, full_name, role, created_at) values
${TEACHERS.map(
  (t) =>
    `  ('${t.id}', ${q(t.full_name)}, 'teacher', '${t.created_at}'::timestamptz)`,
).join(",\n")}
on conflict (id) do update
  set full_name = excluded.full_name,
      role      = 'teacher';

-- Books --------------------------------------------------------------------
insert into public.books (id, title, description, cover_image_url, teacher_id, created_at) values
${BOOKS.map(
  (b) =>
    `  ('${b.id}', ${q(b.title)}, ${q(b.description)}, ${q(b.cover_image_url)}, '${b.teacher_id}', '${b.created_at}'::timestamptz)`,
).join(",\n")}
on conflict (id) do update
  set title           = excluded.title,
      description     = excluded.description,
      cover_image_url = excluded.cover_image_url;

-- Sections -----------------------------------------------------------------
insert into public.sections (id, book_id, title, video_url, handout_url, sort_order, created_at) values
${allSections
  .map(
    (s) =>
      `  ('${s.id}', '${s.book_id}', ${q(s.title)}, NULL, NULL, ${s.sort_order}, '${s.created_at}'::timestamptz)`,
  )
  .join(",\n")}
on conflict (id) do nothing;

commit;
`;

mkdirSync("supabase", { recursive: true });
writeFileSync(join(process.cwd(), "supabase", "seed.sql"), sql);

/* --------------------------- summary ----------------------------- */
console.log("profiles:", db.profiles.length);
console.log("books:", db.books.length);
BOOKS.forEach((book, i) => {
  const count = allSections.filter((s) => s.book_id === book.id).length;
  console.log(`  ${book.title}: ${count} sections`);
});
console.log("sections total:", allSections.length);
