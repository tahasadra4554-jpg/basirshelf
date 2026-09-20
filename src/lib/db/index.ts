import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { resilientStore } from "@/lib/db/resilient";

/**
 * Data source.
 *
 * When `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set,
 * reads go to Supabase (Postgres + RLS) and fall back to the local seed store
 * if the database is unreachable or the schema has not been applied yet —
 * `degraded()` reports that to the UI. Writes always go to Supabase so a
 * failure is never hidden from the teacher.
 */
export function usesSupabase(): boolean {
  return isSupabaseConfigured();
}

export function getDataSource() {
  return resilientStore;
}

export { degraded, lastError } from "@/lib/db/resilient";
