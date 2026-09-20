/**
 * Applies supabase/*.sql to a Supabase project through the Management API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_PROJECT_REF=xxxx node scripts/apply-supabase.mjs schema seed
 *
 * The token comes from https://supabase.com/dashboard/account/tokens
 * and the project ref is the subdomain of your project URL.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { splitStatements, statementLabel } from "./lib/sql-splitter.mjs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
const region = process.env.SUPABASE_REGION ?? "eu-central-1";

if (!token || !ref) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF.\n" +
      "  token: https://supabase.com/dashboard/account/tokens\n" +
      "  ref:   the subdomain of your project URL",
  );
  process.exit(1);
}

async function runSql(query, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${label} failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return text;
}

async function main() {
  const targets = process.argv.slice(2);
  const files =
    targets.length > 0
      ? targets.map((t) => `supabase/${t.replace(/\.sql$/, "")}.sql`)
      : ["supabase/schema.sql", "supabase/seed.sql"];

  for (const file of files) {
    const sql = readFileSync(join(process.cwd(), file), "utf8");
    const statements = splitStatements(sql);
    console.log(`\n▸ ${file} — ${statements.length} statements`);

    for (const [index, statement] of statements.entries()) {
      const label = statementLabel(statement);
      try {
        await runSql(statement, `${file} #${index + 1}`);
        process.stdout.write(`  ✓ #${index + 1} ${label}\n`);
      } catch (error) {
        // Realtime publication statements fail if already added — not fatal.
        if (/already member of publication/i.test(error.message)) {
          process.stdout.write(`  · #${index + 1} skipped (already added)\n`);
          continue;
        }
        console.error(`  ✗ #${index + 1} ${label}\n    ${error.message}`);
        process.exitCode = 1;
        return;
      }
    }
  }

  // Sanity check: report what is now in the database.
  try {
    const books = await runSql(
      "select title, (select count(*) from public.sections s where s.book_id = b.id) as sections from public.books b order by title;",
      "verify",
    );
    console.log("\n▸ verify — books in database:");
    console.log(books);
    const policies = await runSql(
      "select tablename, count(*) as policies from pg_policies where schemaname='public' group by tablename order by tablename;",
      "verify-policies",
    );
    console.log("▸ verify — RLS policies per table:");
    console.log(policies);
    console.log(`\nRegion used for new projects: ${region}`);
  } catch (error) {
    console.error(`verify failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
