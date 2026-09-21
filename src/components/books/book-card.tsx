import Link from "next/link";
import { ArrowRight, FileText, Layers, PlayCircle } from "lucide-react";

import type { Book } from "@/lib/types";

import { cn } from "@/lib/utils";
import { BookCover } from "@/components/books/book-cover";

const LEVEL_BY_TITLE: Record<string, string> = {
  "Interchange 1": "Elementary",
  "Interchange 2": "Pre-Intermediate",
  "Interchange 3": "Intermediate",
};

export function levelForBook(title: string): string | null {
  return LEVEL_BY_TITLE[title] ?? null;
}

/**
 * One card, two shapes:
 *  - `default`  — supporting panel, cover above the text
 *  - `row`      — text mode: a typographic line, no artwork at all
 */
export function BookCard({
  book,
  variant = "default",
  position,
  className,
}: {
  book: Book;
  variant?: "featured" | "default" | "row";
  position?: number;
  className?: string;
}) {
  const level = levelForBook(book.title);
  const units = book.section_count ?? 0;
  const href = `/books/${book.id}`;

  if (variant === "row") {
    return (
      <li className="group">
        <Link
          href={href}
          className="flex flex-col gap-2 px-4 py-5 transition-colors duration-300 hover:bg-[#FEF3C7]/40 dark:hover:bg-[#1A365D]/40 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6"
        >
          <span className="num-latin w-6 shrink-0 font-serif text-sm text-[#B45309] dark:text-[#FBBF24]">
            {String(position ?? 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-serif text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-[#D97706] dark:group-hover:text-[#FCD34D]">
              {book.title}
            </span>
            <span className="mt-1 block truncate text-sm leading-6 text-muted-foreground">
              {book.description ?? "No description yet."}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-4 text-xs text-[#B45309] dark:text-[#FBBF24]">
            {level ? (
              <span className="font-medium text-foreground">{level}</span>
            ) : null}
            <span className="num-latin inline-flex items-center gap-1.5">
              <Layers className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
              {units} units
            </span>
            <ArrowRight
              className="size-4 text-[#F59E0B] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
          </span>
        </Link>
      </li>
    );
  }

  const isFirstBook = position === 1 || book.title === "Interchange 1";

  return (
    <li
      className={cn(
        "lift group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-amber-500/25 bg-card shadow-soft transition-all duration-300 hover:border-[#F59E0B] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
        isFirstBook && "border-amber-500/40",
        className,
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
        aria-label={`Open ${book.title}${level ? `, ${level}` : ""}, ${units} units`}
      />

      <div className="relative aspect-3/4 w-full overflow-hidden bg-[#0A1628]">
        <BookCover
          title={book.title}
          coverImageUrl={book.cover_image_url}
          level={level}
          priority={isFirstBook}
          className="size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.035]"
        />
        {isFirstBook ? (
          <span className="absolute start-3.5 top-3.5 z-20 rounded-full bg-[#F59E0B] px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-[#0A1628] uppercase shadow-md">
            Start here
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-foreground text-balance group-hover:text-[#D97706] dark:group-hover:text-[#FCD34D] transition-colors duration-200">
            {book.title}
          </h3>
          {level ? (
            <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#92400E] dark:text-[#FBBF24] uppercase">
              {level}
            </span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground text-pretty">
          {book.description ?? "No description yet."}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#B45309] dark:text-[#FBBF24]">
            <span className="num-latin inline-flex items-center gap-1.5">
              <Layers className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
              {units} units
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
              Videos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
              PDFs
            </span>
          </div>

          <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D97706] dark:text-[#FBBF24] transition-colors duration-200 group-hover:text-[#B45309] dark:group-hover:text-[#FCD34D]">
            Browse units
            <ArrowRight
              className="size-4 text-[#F59E0B] transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </p>
        </div>
      </div>
    </li>
  );
}
