/**
 * Video link helpers.
 *
 * BasirShelf never stores video files — only links to YouTube / Aparat. These
 * helpers turn a raw link into something we can embed, and refuse anything that
 * is not a plain http(s) URL.
 */

export type VideoKind = "youtube" | "aparat" | "other";

export interface VideoTarget {
  kind: VideoKind;
  /** Provider display name, e.g. "YouTube". */
  provider: string;
  /** Embeddable id (YouTube video id / Aparat video id) when we know it. */
  id?: string;
  /** The original link — always kept for "open in a new tab". */
  url: string;
}

export function isSafeExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function parseVideo(url: string | null | undefined): VideoTarget | null {
  if (!isSafeExternalUrl(url)) return null;
  const raw = url as string;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    if (id) return { kind: "youtube", provider: "YouTube", id, url: raw };
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname.startsWith("/watch")) {
      const id = parsed.searchParams.get("v");
      if (id) return { kind: "youtube", provider: "YouTube", id, url: raw };
    }
    const short = parsed.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
    if (short) return { kind: "youtube", provider: "YouTube", id: short[1], url: raw };
  }

  if (host === "aparat.com") {
    const id = parsed.pathname.split("/").filter(Boolean).pop();
    if (id) return { kind: "aparat", provider: "Aparat", id, url: raw };
  }

  if (host === "drive.google.com") {
    return { kind: "other", provider: "Google Drive", url: raw };
  }

  return { kind: "other", provider: host, url: raw };
}

/** Privacy-friendly YouTube embed with the JS API enabled so we can control speed. */
export function youtubeEmbedUrl(
  id: string,
  options: { captions?: boolean; start?: number } = {},
): string {
  const params = new URLSearchParams({
    enablejsapi: "1",
    rel: "0",
    playsinline: "1",
    origin: typeof window === "undefined" ? "" : window.location.origin,
  });
  if (options.captions) params.set("cc_load_policy", "1");
  if (options.start && options.start > 1) {
    params.set("start", String(Math.floor(options.start)));
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

export function aparatEmbedUrl(id: string): string {
  return `https://www.aparat.com/video/video/embed/videohash/${encodeURIComponent(id)}/vt/frame`;
}

/** Human label for a link that is not a video provider. */
export function linkProvider(url: string | null | undefined): string | null {
  const target = parseVideo(url);
  return target ? target.provider : null;
}
