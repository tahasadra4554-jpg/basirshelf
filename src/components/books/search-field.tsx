"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { emitSearch, readSearch, SEARCH_EVENT } from "@/lib/search-bus";

/**
 * Instant book filter. Typing filters the library without a submit; if the
 * student is on another page they are taken to the library first.
 */
export function SearchField({
  id,
  variant = "page",
  className,
  autoFocus = false,
}: {
  id: string;
  variant?: "page" | "header";
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onSearch = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? "";
      setQuery(detail);
    };
    window.addEventListener(SEARCH_EVENT, onSearch as EventListener);
    setQuery(readSearch());

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("q");
    if (fromUrl) {
      setQuery(fromUrl);
      emitSearch(fromUrl);
    }
    return () => window.removeEventListener(SEARCH_EVENT, onSearch as EventListener);
  }, []);

  function update(next: string) {
    setQuery(next);
    emitSearch(next);
    if (pathname !== "/") {
      router.push(next ? `/?q=${encodeURIComponent(next)}#books` : "/#books");
    }
  }

  const compact = variant === "header";

  return (
    <div className={cn("relative w-full min-w-0 max-w-full sm:max-w-md", className)}>
      <label htmlFor={id} className="sr-only">
        Search books by title, level or topic
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="searchbox"
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => update(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") update("");
        }}
        placeholder="Search books, levels, topics…"
        autoComplete="off"
        className={cn(
          "w-full rounded-full border border-input bg-card text-foreground shadow-soft",
          "ps-10 placeholder:text-muted-foreground",
          "focus-visible:border-indigo focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          "transition-[box-shadow] duration-200",
          compact
            ? "h-9 pe-3 text-[13px]"
            : "h-12 pe-11 text-sm",
        )}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            update("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground",
            "transition-colors duration-300 hover:bg-accent hover:text-foreground",
            compact ? "end-1.5" : "end-2.5",
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
