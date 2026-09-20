/**
 * Instant-search bridge.
 *
 * The sticky header owns a search field that must filter the library no matter
 * which page the student is on, and the library section owns its own field.
 * Both stay in sync through a tiny event bus plus the `?q=` query parameter —
 * no router dependency, no shared React tree, no extra JS on the server.
 */

export const SEARCH_EVENT = "basirshelf:search";
const STORAGE_KEY = "basirshelf:query";

export function emitSearch(query: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, query);
  } catch {
    /* private mode — the bus still works for this visit */
  }
  window.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: query }));
}

export function readSearch(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Keeps `?q=` in the address bar so a filtered view can be shared or reloaded. */
export function syncQueryToUrl(query: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url.toString());
}
