import "server-only";

import { createHmac } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseConfig } from "@/lib/supabase/client";

/**
 * Row Level Security identity.
 *
 * The policies in `supabase/schema.sql` decide ownership from
 * `public.current_uid()` / `public.current_role()`, which read the request JWT.
 * So for every mutating query we mint a short-lived JWT for the acting
 * teacher and send it as `Authorization: Bearer <jwt>`. PostgREST then reports
 * `auth.uid()` and the `role` claim for that request only — nothing is shared
 * between requests and no session state leaks across pooled connections.
 *
 * This needs the project's JWT/HMAC secret, taken from
 * `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` (both are JWTs whose
 * `hmac-secret` claim holds the secret; a raw secret string also works).
 */

const TOKEN_TTL_SECONDS = 120;

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/** Returns the project HMAC secret, or null when no key is configured. */
export function getJwtSecret(): string | null {
  const { serviceKey } = supabaseConfig();
  const key =
    process.env.SUPABASE_SECRET_KEY ?? serviceKey ?? "";
  if (!key) return null;

  const payload = decodeJwtPayload(key.trim());
  const hmac = payload?.["hmac-secret"];
  if (typeof hmac === "string" && hmac.length > 0) return hmac;

  // A JWT without an `hmac-secret` claim (e.g. the legacy service_role key)
  // cannot be used to sign our own tokens — using it as a secret would produce
  // a signature PostgREST rejects with "No suitable key or wrong key type".
  if (payload) return null;

  // Not a JWT at all — treat the raw value as the secret.
  return key.trim();
}

export function canMintActorToken(): boolean {
  return getJwtSecret() !== null;
}

function mintActorJwt(userId: string, role: string): string {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not set, so writes to the database are disabled.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({
      role: "authenticated",
      sub: userId,
      aud: "authenticated",
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      app_metadata: { role },
      user_metadata: { role },
    }),
  );
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Runs `work` with a client authenticated as the given teacher.
 * The client is created per call, so the bearer token can never leak into an
 * unrelated request.
 */
export function withRls<T>(
  role: string | null,
  userId: string | null,
  work: (client: SupabaseClient) => Promise<T>,
): Promise<T> {
  const { url, anonKey, serviceKey } = supabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase keys are not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  const createClient = require("@supabase/supabase-js").createClient as typeof import("@supabase/supabase-js").createClient;

  // Escape hatch for migrations / one-off scripts.
  if (process.env.SUPABASE_USE_SERVICE_ROLE === "true" && serviceKey) {
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return work(client);
  }

  if (!userId) {
    throw new Error("A user id is required to write to the database.");
  }

  // No signing secret available, so we cannot mint an actor token. Fall back
  // to the privileged key: the caller MUST scope every query to the actor
  // (see ownedBookIds in supabase-store.ts), which reproduces what the RLS
  // ownership policies would have enforced. Supplying SUPABASE_SECRET_KEY
  // upgrades this to real per-request RLS automatically.
  if (!canMintActorToken() && serviceKey) {
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return work(client);
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${mintActorJwt(userId, role ?? "")}` },
    },
  });

  return work(client);
}
