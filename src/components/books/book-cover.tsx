import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cover artwork. When the teacher has not uploaded an image we draw an
 * editorial navy cover — series eyebrow, serif title, level, indigo rule — so
 * the library always looks like a library.
 *
 * The artwork is decorative: it is hidden from assistive technology and the
 * surrounding link carries the accessible name.
 */
export function BookCover({
  title,
  coverImageUrl,
  level,
  className,
  priority = false,
  compact = false,
}: {
  title: string;
  coverImageUrl?: string | null;
  level?: string | null;
  className?: string;
  priority?: boolean;
  compact?: boolean;
}) {
  if (coverImageUrl) {
    // Cover links come from the teacher, so a plain <img> keeps any remote
    // host working without extra Next.js configuration. The accessible name
    // lives on the surrounding link, so alt stays empty by design.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverImageUrl}
        alt=""
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        width={600}
        height={800}
        className={cn("size-full object-cover object-center", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex size-full flex-col justify-between overflow-hidden bg-navy text-navy-foreground",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
      aria-hidden="true"
    >
      {/* Soft depth: two low-opacity washes, never a photo */}
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,0.16),transparent_58%),radial-gradient(90%_70%_at_100%_100%,rgba(90,103,216,0.55),transparent_62%)]" />
      <svg
        className="pointer-events-none absolute -end-10 -top-10 size-44 opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="1" />
        <circle cx="50" cy="50" r="14" stroke="white" strokeWidth="1" />
      </svg>
      {/* Spine */}
      <span className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-white/25" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide backdrop-blur">
          <BookOpen className="size-3" aria-hidden="true" />
          Interchange Series
        </span>
      </div>

      <div className="relative">
        <p
          className={cn(
            "font-serif leading-[1.12] font-semibold tracking-tight text-balance",
            compact ? "text-xl" : "text-2xl sm:text-3xl",
          )}
        >
          {title}
        </p>
        {level ? (
          <p className="mt-2 text-[11px] font-medium text-white/85">{level}</p>
        ) : null}
        <div className="mt-3.5 h-1 w-12 rounded-full bg-indigo" />
      </div>
    </div>
  );
}
