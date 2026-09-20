import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The BasirShelf lockup: a navy shelf mark, a serif wordmark, and the institute
 * name set as a small tracked eyebrow.
 */
export function BrandLogo({
  className,
  href = "/",
  showWordmark = true,
  tone = "default",
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  tone?: "default" | "invert";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label="BasirShelf — Basir Language Institute, home"
    >
      <span
        className={cn(
          "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl transition-transform duration-300 group-hover:-rotate-3",
          tone === "invert" ? "bg-navy-foreground" : "bg-navy",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className={cn(
            "size-5",
            tone === "invert" ? "text-navy" : "text-navy-foreground",
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 19.5V5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v13" />
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H18" />
          <path d="M18 17v4H6.5A2.5 2.5 0 0 1 4 19.5" />
          <path d="M9 7.5h5" />
        </svg>
        <span
          className="absolute inset-x-0 bottom-0 h-1 bg-indigo"
          aria-hidden="true"
        />
      </span>

      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-serif text-[18px] sm:text-[19px] leading-none font-semibold tracking-tight",
              tone === "invert" ? "text-navy-foreground" : "text-navy",
            )}
          >
            Basir
            <span className="text-indigo-text dark:text-indigo">Shelf</span>
          </span>
          <span
            className={cn(
              "eyebrow mt-1 hidden text-[10px] sm:block",
              tone === "invert"
                ? "text-navy-foreground/75"
                : "text-muted-foreground",
            )}
          >
            Basir Language Institute
          </span>
        </span>
      ) : null}
    </Link>
  );
}
