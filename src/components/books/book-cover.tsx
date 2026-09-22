import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cover artwork. When the teacher has not uploaded an image we draw an
 * editorial navy cover with amber accents — series eyebrow, serif title, level, amber rule.
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
        "relative flex size-full flex-col justify-between overflow-hidden bg-[#0A1628] text-[#FDFBF7]",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
      aria-hidden="true"
    >
      {/* Soft depth: amber washes */}
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(245,158,11,0.18),transparent_58%),radial-gradient(90%_70%_at_100%_100%,rgba(245,158,11,0.12),transparent_62%)]" />
      <svg
        className="pointer-events-none absolute -end-10 -top-10 size-44 opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="46" stroke="#F59E0B" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" stroke="#F59E0B" strokeWidth="1" />
        <circle cx="50" cy="50" r="14" stroke="#FBBF24" strokeWidth="1" />
      </svg>
      {/* Spine */}
      <span className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-amber-500/30" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#FBBF24] backdrop-blur">
          <BookOpen className="size-3 text-[#F59E0B]" aria-hidden="true" />
          {title.toLowerCase().includes("connect") ? "Connect Series" : "Interchange Series"}
        </span>
      </div>

      <div className="relative">
        <p
          className={cn(
            "font-serif leading-[1.12] font-semibold tracking-tight text-balance text-[#FDFBF7]",
            compact ? "text-xl" : "text-2xl sm:text-3xl",
          )}
        >
          {title}
        </p>
        {level ? (
          <p className="mt-2 text-[11px] font-medium text-[#FEF3C7]">{level}</p>
        ) : null}
        <div className="mt-3.5 h-1 w-12 rounded-full bg-[#F59E0B]" />
      </div>
    </div>
  );
}
