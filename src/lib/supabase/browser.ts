import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (auth + realtime).
 * Safe to import from Client Components — it only uses the anon key.
 */
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
