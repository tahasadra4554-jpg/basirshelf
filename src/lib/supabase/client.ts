import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    url,
    anonKey,
    serviceKey,
    isConfigured: Boolean(url && anonKey),
  };
}

export function isSupabaseConfigured(): boolean {
  return supabaseConfig().isConfigured;
}

/** Anonymous client — every query goes through Row Level Security. */
export function createAnonClient(): SupabaseClient {
  const { url, anonKey } = supabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars are missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Privileged client for admin operations (seed checks, storage admin).
 * Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
 */
export function createServiceClient(): SupabaseClient {
  const { url, serviceKey } = supabaseConfig();
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
