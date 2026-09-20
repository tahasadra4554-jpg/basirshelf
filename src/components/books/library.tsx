"use client";

import { useEffect, useMemo, useState } from "react";
import { BookX, LayoutGrid, List } from "lucide-react";

import type { Book } from "@/lib/types";

import { cn } from "@/lib/utils";
import { readSearch, SEARCH_EVENT, syncQueryToUrl } from "@/lib/search-bus";

import { BookCard } from "@/components/books/book-card";
import { SearchField } from "@/components/books/search-field";
import { Button } from "@/components/ui/button";

type ViewMode = "shelf" | "text";

const MODE_KEY = "basirshelf:view";

/** Persian / Arabic digit → Latin, so either typing works in the filter. */
function normalize(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .toLowerCase()
    .trim();
}

/**
 * The library: an asymmetric bento grid that puts the entry point first, with
 * a text mode for students who would rather read a list than scan covers.
 */
export function Library({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("shelf");

  useEffect(() => {
    const onSearch = (event: Event) =>
      setQuery((event as CustomEvent<string>).detail ?? "");
    window.addEventListener(SEARCH_EVENT, onSearch as EventListener);
    setQuery(readSearch());
    try {
      const stored = window.localStorage.getItem(MODE_KEY);
      if (stored === "text" || stored === "shelf") setView(stored);
    } catch {
      /* storage blocked — default shelf view */
    }
    return () => window.removeEventListener(SEARCH_EVENT, onSearch as EventListener);
  }, []);

  function chooseView(mode: ViewMode) {
    setView(mode);
    try {
      window.localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* non-fatal */
    }
  }

  const filtered = useMemo(() => {
    const term = normalize(query);
    if (!term) return books;
    return books.filter((book) =>
      [book.title, book.description ?? ""]
        .map(normalize)
        .some((field) => field.includes(term)),
    );
  }, [books, query]);

  useEffect(() => {
    syncQueryToUrl(query);
  }, [query]);

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const searching = normalize(query).length > 0;

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SearchField id="library-search" />

        <div
          role="group"
          aria-label="Library view"
          className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card p-1 shadow-soft"
        >
          {(
            [
              { id: "shelf", label: "Shelf view", Icon: LayoutGrid },
              { id: "text", label: "Text view", Icon: List },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => chooseView(id)}
              aria-pressed={view === id}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-all duration-300",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                view === id
                  ? "bg-navy text-navy-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id === "shelf" ? "Shelf" : "Text"}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="num-latin mb-5 text-xs text-muted-foreground" aria-live="polite">
        Showing {filtered.length} of {books.length} books
        {searching ? ` matching “${query}”` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/70 px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <BookX className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-serif text-lg font-semibold text-navy">
            Nothing matches that search
          </h3>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Try “Interchange”, a level such as “Intermediate”, or clear the
            field to see the whole shelf.
          </p>
          <Button variant="outline" size="sm" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      ) : view === "text" ? (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {filtered.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              variant="row"
              position={index + 1}
            />
          ))}
        </ul>
      ) : (
        <ul className="stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
          {filtered.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              variant="default"
              position={index + 1}
              className="w-full"
            />
          ))}
        </ul>
      )}
    </div>
  );
}
