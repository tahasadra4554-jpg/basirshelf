import "server-only";

import {
  createHmac,
  randomBytes,
  subtle,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "basirshelf_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  /** profiles.id */
  sub: string;
  username?: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
}

const FALLBACK_SECRET = "basirshelf-dev-secret-change-me";

function getSecret(): string {
  return process.env.SESSION_SECRET ?? FALLBACK_SECRET;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

/** Constant-time string comparison that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function signSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds }),
  );
  const signature = createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  if (!header || !body || !signature) return null;

  const expected = createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64url");
  if (!safeEqual(expected, signature)) return null;

  try {
    const payload = JSON.parse(fromBase64url(body)) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    if (!payload.sub || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: {
  sub: string;
  username?: string;
  name: string;
  role: Role;
}) {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Convenience guard used by Server Components / Server Actions. */
export async function requireTeacher(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    throw new Error("Sign in with a teacher account to access this area.");
  }
  return session;
}

/**
 * WebCrypto random token — handy for one-time links / CSRF-style nonces.
 * Kept here so every server-side secret goes through one module.
 */
export async function randomToken(bytes = 24): Promise<string> {
  const buffer = new Uint8Array(bytes);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    const nodeBuffer = randomBytes(bytes);
    buffer.set(nodeBuffer);
  }
  void subtle;
  return base64url(Buffer.from(buffer));
}
