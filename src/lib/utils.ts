import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString("en-GB");
  }
}

/** Extracts a human readable host from a video link (YouTube / Aparat / ...). */
export function videoProvider(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("youtube") || host === "youtu.be") return "YouTube";
    if (host.includes("aparat")) return "Aparat";
    if (host.includes("drive.google")) return "Google Drive";
    if (host.includes("supabase")) return "Cloud storage";
    return host;
  } catch {
    return "Direct link";
  }
}

/** True for absolute http(s) links — blocks javascript: / data: URLs. */
export function isSafeExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function initials(name: string | null | undefined): string {
  if (!name) return "B";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("");
}

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "")
    .toLowerCase();
}
