/**
 * Verifies supabase/schema.sql + supabase/seed.sql against a REAL Postgres.
 *
 * Supabase-specific objects (auth.users, auth.uid(), storage.buckets/objects,
 * the anon/authenticated roles and the supabase_realtime publication) are
 * mocked first, then the exact same statements that apply-supabase.mjs sends
 * are executed here. Finally the RLS policies are exercised from a
 * non-owner role.
 *
 * Run:  npm run test:sql
 */

import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

import { splitStatements, statementLabel } from "./lib/sql-splitter.mjs";

const T1 = "3f2a1b40-0001-4a10-9f21-1a2b3c4d0001"; // حمید — owns Interchange 1
const T2 = "3f2a1b40-0002-4a10-9f21-1a2b3c4d0002"; // سارا — owns Interchange 2
const BOOK1 = "b0000000-1000-4000-8000-100000000001";
const BOOK2 = "b0000000-2000-4000-8000-100000000002";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  \u2713 ${name}`);
  } else {
    failed += 1;
    console.log(`  \u2717 ${name} ${detail ? `— ${detail}` : ""}`);
  }
}

const MOCK_SUPABASE = `
-- Mock of the Supabase platform objects the schema depends on ----------------
create schema if not exists auth;
create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key default gen_random_uuid(),
  aud varchar(255),
  role varchar(255),
  email varchar(255) unique,
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- auth.uid() on Supabase reads the request JWT claims.
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(
    coalesce(current_setting('request.jwt.claims', true)::json ->> 'sub', ''),
    ''
  )::uuid;
$fn$;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text
);
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

do $do$ begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end $do$;

do $do$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $do$;
`;

async function applySql(client, file) {
  const sql = readFileSync(join(process.cwd(), file), "utf8");
  const statements = splitStatements(sql);
  console.log(`\n▸ ${file} — ${statements.length} statements`);
  for (const [index, statement] of statements.entries()) {
    try {
      await client.query(statement);
    } catch (error) {
      if (/already member of publication/i.test(error.message)) {
        console.log(`  · #${index + 1} skipped (already in publication)`);
        continue;
      }
      console.log(`  ✗ #${index + 1} ${statementLabel(statement)}`);
      throw error;
    }
  }
  console.log(`  ✓ all ${statements.length} statements executed`);
  return statements.length;
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "basirshelf-pg-"));
  const database = new EmbeddedPostgres({
    databaseDir: dir,
    user: "postgres",
    password: "postgres",
    port: 5433,
    persistent: false,
  });

  await database.initialise();
  await database.start();
  console.log("▸ Postgres started (embedded, port 5433)");

  const admin = await database.getPgClient("postgres");
  await admin.connect();

  try {
    // 1. platform mocks
    await admin.query(MOCK_SUPABASE);
    console.log("▸ Supabase platform mocks created");

    // 2. the real schema + seed
    const schemaCount = await applySql(admin, "supabase/schema.sql");
    check("schema.sql executed without error", schemaCount > 0);

    const seedCount = await applySql(admin, "supabase/seed.sql");
    check("seed.sql executed without error", seedCount > 0);

    // 3. seed.sql is idempotent (ON CONFLICT DO NOTHING)
    await applySql(admin, "supabase/seed.sql");

    // 4. structure assertions
    const tables = await admin.query(
      `select tablename, rowsecurity from pg_tables
        where schemaname = 'public' order by tablename`,
    );
    check(
      "3 public tables with RLS enabled",
      tables.rows.length === 3 &&
        tables.rows.every((r) => r.rowsecurity === true),
      JSON.stringify(tables.rows),
    );

    const books = await admin.query(
      `select b.title, count(s.id)::int as sections
         from public.books b left join public.sections s on s.book_id = b.id
        group by b.title order by b.title`,
    );
    check(
      "3 Interchange books, 19 sections each",
      books.rows.length === 3 && books.rows.every((r) => r.sections === 19),
      JSON.stringify(books.rows),
    );

    const empty = await admin.query(
      `select count(*)::int as n from public.sections
        where video_url is null and handout_url is null`,
    );
    check(
      "all 57 seeded sections are empty (no video/handout)",
      empty.rows[0].n === 57,
      `got ${empty.rows[0].n}`,
    );

    const teachers = await admin.query(
      `select count(*)::int as n from public.profiles where role = 'teacher'`,
    );
    check("7 teacher profiles", teachers.rows[0].n === 7, `got ${teachers.rows[0].n}`);

    const policies = await admin.query(
      `select tablename, count(*)::int as n from pg_policies
        where schemaname = 'public' group by tablename order by tablename`,
    );
    console.log(
      `  · RLS policies: ${policies.rows.map((r) => `${r.tablename}=${r.n}`).join(", ")}`,
    );
    check(
      "books and sections have 4 policies each",
      policies.rows.find((r) => r.tablename === "books")?.n === 4 &&
        policies.rows.find((r) => r.tablename === "sections")?.n === 4,
    );

    const bucket = await admin.query(
      `select id, public from storage.buckets where id = 'handouts'`,
    );
    check(
      "public 'handouts' storage bucket created",
      bucket.rows.length === 1 && bucket.rows[0].public === true,
    );

    const mediaBuckets = await admin.query(
      `select id from storage.buckets
        where id in ('covers', 'images', 'audio') order by id`,
    );
    check(
      "covers/images/audio storage buckets created",
      mediaBuckets.rows.map((r) => r.id).join(",") === "audio,covers,images",
      `got ${mediaBuckets.rows.map((r) => r.id).join(",")}`,
    );

    const mediaCols = await admin.query(
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = 'sections'
          and column_name in ('image_url', 'audio_url', 'images_url')`,
    );
    check(
      "sections expose image_url + audio_url + images_url columns",
      mediaCols.rowCount === 3,
      `got ${mediaCols.rowCount}`,
    );

    // 5. signup trigger creates a student profile
    await admin.query(
      `insert into auth.users (id, email, raw_user_meta_data)
       values (gen_random_uuid(), 'student@example.com',
               '{"full_name":"Sample Student"}'::jsonb)`,
    );
    const student = await admin.query(
      `select role, full_name from public.profiles
        where id = (select id from auth.users where email = 'student@example.com')`,
    );
    check(
      "signup trigger creates profile with role 'student'",
      student.rows[0]?.role === "student" &&
        student.rows[0]?.full_name === "Sample Student",
      JSON.stringify(student.rows),
    );

    // 6. cascade delete
    const tempBook = await admin.query(
      `insert into public.books (title, teacher_id) values ('Temp Book', $1)
       returning id`,
      [T1],
    );
    const tempId = tempBook.rows[0].id;
    await admin.query(
      `insert into public.sections (book_id, title, sort_order)
       values ($1, 'Temp Section', 1)`,
      [tempId],
    );
    await admin.query(`delete from public.books where id = $1`, [tempId]);
    const orphan = await admin.query(
      `select count(*)::int as n from public.sections where book_id = $1`,
      [tempId],
    );
    check(
      "sections cascade-delete with their book",
      orphan.rows[0].n === 0,
      `orphans: ${orphan.rows[0].n}`,
    );

    // ------------------------------------------------------------------
    // 7. RLS behaviour from a NON-OWNER role
    // ------------------------------------------------------------------
    await admin.query(`drop role if exists rls_tester`);
    await admin.query(`create role rls_tester login password 'tester'`);
    // On real Supabase every PostgREST request runs as anon or authenticated,
    // so the tester inherits both memberships.
    await admin.query(`grant anon, authenticated to rls_tester`);
    await admin.query(`grant usage on schema public to rls_tester`);
    // Supabase grants these to anon/authenticated by default (default
    // privileges on the public schema) — RLS then filters the rows.
    await admin.query(`grant usage on schema public to anon, authenticated`);
    // auth.uid() is called inside the policies, so both roles need USAGE
    // on the auth schema (as they have on real Supabase). Without this the
    // inserts would fail with a permission error instead of an RLS denial.
    await admin.query(`grant usage on schema auth to anon, authenticated`);
    await admin.query(`grant execute on function auth.uid() to anon, authenticated`);
    await admin.query(
      `grant select, insert, update, delete on all tables in schema public
         to rls_tester, anon, authenticated`,
    );
    await admin.query(
      `grant usage, select on all sequences in schema public to anon, authenticated`,
    );

    const tester = new pg.Client({
      host: "127.0.0.1",
      port: 5433,
      user: "rls_tester",
      password: "tester",
      database: "postgres",
    });
    tester.on("error", () => {}); // ignore the shutdown FATAL at the end
    await tester.connect();

    console.log("\n▸ RLS enforcement (role rls_tester → anon / authenticated)");

    const asAnon = () => tester.query(`set local role anon`);
    const asAuthed = () => tester.query(`set local role authenticated`);
    const claim = (sub, role) =>
      tester.query(`select public.set_local_jwt($1)`, [
        JSON.stringify({ sub, role }),
      ]);
    // A rejected statement aborts the whole transaction, so every attempt
    // runs inside a savepoint and we roll back to it.
    let savepoint = 0;
    const expectBlocked = async (name, sql, params = []) => {
      savepoint += 1;
      const sp = `sp${savepoint}`;
      await tester.query(`savepoint ${sp}`);
      let blocked = false;
      let reason = "";
      try {
        await tester.query(sql, params);
        await tester.query(`release savepoint ${sp}`);
      } catch (error) {
        blocked = true;
        reason = error.message;
        await tester.query(`rollback to savepoint ${sp}`);
      }
      check(name, blocked, blocked ? "" : "statement unexpectedly succeeded");
      if (blocked) console.log(`      \u21b3 ${reason}`);
      return blocked;
    };

    await tester.query(`begin`);
    await asAnon();

    let res = await tester.query(`select count(*)::int as n from public.books`);
    check("anon can read all 3 books", res.rows[0].n === 3, `got ${res.rows[0].n}`);

    res = await tester.query(`select count(*)::int as n from public.sections`);
    check(
      "anon can read all 57 sections",
      res.rows[0].n === 57,
      `got ${res.rows[0].n}`,
    );
    await tester.query(`rollback`);

    await tester.query(`begin`);
    await asAuthed();
    await expectBlocked(
      "authenticated with no claim cannot insert a book",
      `insert into public.books (title, teacher_id) values ('Hack', $1)`,
      [T1],
    );
    await tester.query(`rollback`);

    await tester.query(`begin`);
    await asAuthed();
    await claim(T1, "student");
    await expectBlocked(
      "role=student cannot insert a book",
      `insert into public.books (title, teacher_id) values ('Student Hack', $1)`,
      [T1],
    );
    await tester.query(`rollback`);

    await tester.query(`begin`);
    await asAuthed();
    await claim(T1, "teacher");

    try {
      res = await tester.query(
        `insert into public.books (title, description, teacher_id)
         values ('RLS Test Book', 'created by teacher 1', $1) returning id`,
        [T1],
      );
    } catch (error) {
      console.log(`      insert failed: ${error.message}`);
      throw error;
    }
    const rlsBookId = res.rows[0].id;
    check("teacher can insert their own book", Boolean(rlsBookId));

    res = await tester.query(
      `insert into public.books (title, teacher_id)
       values ('Shared Book', $1) returning id`,
      [T2],
    );
    const sharedBookId = res.rows[0].id;
    check(
      "any teacher may add a book owned by another teacher",
      Boolean(sharedBookId),
    );

    res = await tester.query(
      `insert into public.sections (book_id, title, sort_order)
       values ($1, 'RLS Section', 1) returning id`,
      [BOOK1],
    );
    const rlsSectionId = res.rows[0].id;
    check("teacher can add a section to their own book", Boolean(rlsSectionId));

    res = await tester.query(
      `insert into public.sections (book_id, title, sort_order)
       values ($1, 'Shared Section', 900) returning id`,
      [BOOK2],
    );
    const sharedSectionId = res.rows[0].id;
    check(
      "any teacher may add a section to another teacher's book",
      Boolean(sharedSectionId),
    );

    res = await tester.query(
      `update public.sections set video_url = 'https://www.youtube.com/watch?v=ok'
        where id = $1 returning video_url`,
      [rlsSectionId],
    );
    check(
      "teacher can update their own section",
      res.rows[0]?.video_url === "https://www.youtube.com/watch?v=ok",
    );

    res = await tester.query(
      `update public.sections set title = 'Edited by another teacher'
        where id = $1 returning title`,
      [sharedSectionId],
    );
    check(
      "any teacher may edit a section of another teacher's book",
      res.rows[0]?.title === "Edited by another teacher",
    );

    res = await tester.query(
      `update public.sections
          set image_url = 'https://example.com/lesson.png',
              audio_url = 'https://example.com/lesson.mp3'
        where id = $1 returning image_url, audio_url`,
      [rlsSectionId],
    );
    check(
      "teacher can attach image + audio media to a unit",
      res.rows[0]?.image_url === "https://example.com/lesson.png" &&
        res.rows[0]?.audio_url === "https://example.com/lesson.mp3",
    );

    res = await tester.query(
      `update public.sections set handout_url = 'https://example.com/own.pdf'
        where book_id = $1`,
      [BOOK1],
    );
    check(
      "positive control: updating their own book's sections affects rows",
      res.rowCount > 0,
      `${res.rowCount} rows`,
    );
    console.log(`      \u21b3 ${res.rowCount} of their own sections updated`);

    res = await tester.query(
      `delete from public.sections where id = $1 returning id`,
      [sharedSectionId],
    );
    check(
      "any teacher may delete a section of another teacher's book",
      res.rowCount === 1,
      `${res.rowCount} rows`,
    );

    await tester.query(`delete from public.books where id = $1`, [sharedBookId]);

    res = await tester.query(
      `delete from public.sections where id = $1 returning id`,
      [rlsSectionId],
    );
    check("teacher can delete their own section", res.rowCount === 1);

    await tester.query(`delete from public.books where id = $1`, [rlsBookId]);
    await tester.query(`commit`);

    res = await admin.query(`select count(*)::int as n from public.books`);
    check("cleanup leaves exactly 3 books", res.rows[0].n === 3, `got ${res.rows[0].n}`);

    res = await admin.query(`select count(*)::int as n from public.sections`);
    check("cleanup leaves exactly 57 sections", res.rows[0].n === 57, `got ${res.rows[0].n}`);

    await tester.end();

  } finally {
    await admin.end();
    await database.stop();
    console.log("\n▸ Postgres stopped");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("\nSQL verification crashed:", error.message);
  process.exit(1);
});
