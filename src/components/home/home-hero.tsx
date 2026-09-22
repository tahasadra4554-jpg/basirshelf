import Link from "next/link";
import { ArrowRight, BadgeCheck, FileDown, GraduationCap, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const CHIPS = [
  { Icon: BadgeCheck, label: "Unit-by-unit structure" },
  { Icon: FileDown, label: "Offline PDF handouts" },
  { Icon: ShieldCheck, label: "No ads, ever" },
  { Icon: BadgeCheck, label: "Two complete series — Interchange + Connect" },
];

/**
 * Hero: one clear promise, two ways in, and a shelf that shows the learning
 * path. Background depth comes from a soft amber wash + geometric lattice.
 */
export function HomeHero({
  bookCount,
  unitCount,
}: {
  bookCount?: number;
  unitCount?: number;
}) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-amber-500/20 bg-background text-foreground"
    >
      {/* Depth: amber radial wash + geometric lattice */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.12),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.08),transparent_60%),#FDFBF7] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.1),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.08),transparent_60%),#0A1628]" />
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -end-24 -top-24 size-96 animate-float rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -start-20 top-40 size-80 animate-float rounded-full bg-amber-500/10 blur-3xl [animation-delay:-5s]" />
        <svg
          className="absolute inset-y-0 end-0 h-full w-1/2 opacity-[0.12]"
          viewBox="0 0 400 400"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="300" cy="120" r="150" stroke="#F59E0B" strokeWidth="0.75" />
          <circle cx="300" cy="120" r="105" stroke="#F59E0B" strokeWidth="0.75" />
          <circle cx="300" cy="120" r="60" stroke="#FBBF24" strokeWidth="0.75" />
          <path d="M0 300 L400 180" stroke="#F59E0B" strokeWidth="0.75" />
          <path d="M0 340 L400 220" stroke="#F59E0B" strokeWidth="0.75" />
          <path d="M0 380 L400 260" stroke="#F59E0B" strokeWidth="0.75" />
        </svg>
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-8 lg:py-24">
        <div className="animate-fade-up">
          {/* Badge: amber bg rgba(245, 158, 11, 0.15), amber text #FBBF24, amber border rgba(245, 158, 11, 0.4) */}
          <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3.5 py-1.5 text-[#92400E] dark:text-[#FBBF24] shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <GraduationCap className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
            Basir Language Institute
          </p>

          {/* Headline:
              "Master English with the" -> #FDFBF7 in dark, #1A365D in light
              "Basir Institute" -> #F59E0B in dark, #D97706 in light
              "Standard." -> #FDFBF7 in dark, #1A365D in light with amber underline
          */}
          <h1
            id="hero-heading"
            className="mt-6 font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-[#1A365D] dark:text-[#FDFBF7] sm:text-5xl lg:text-[3.4rem]"
          >
            Master English with the{" "}
            <span className="relative whitespace-nowrap text-[#D97706] dark:text-[#F59E0B]">
              Basir Institute
            </span>{" "}
            <span className="relative whitespace-nowrap text-[#1A365D] dark:text-[#FDFBF7]">
              Standard.
              <svg
                className="absolute -bottom-1.5 start-0 h-2.5 w-full text-[#F59E0B]"
                viewBox="0 0 200 10"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M1 7.5C40 3 80 2.2 120 4.4c26 1.4 52 3 79 1.4"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-[#0A1628]/85 dark:text-[#FEF3C7] text-pretty sm:text-lg sm:leading-9">
            Structured videos and handouts for every unit of the Interchange
            and Connect series — arranged in course order, so you always know
            exactly what to study next.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {/* "Browse the library" button: amber #F59E0B background, navy text */}
            <Button asChild size="lg" className="btn-amber-primary">
              <a href="#books">
                Browse the library
                <ArrowRight aria-hidden="true" className="text-[#0A1628]" />
              </a>
            </Button>
            {/* "Create a free account" button: amber border, amber text #FCD34D, hover with amber tint */}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-[#F59E0B] bg-transparent text-[#B45309] dark:text-[#FCD34D] hover:bg-amber-500/10 hover:border-amber-400"
            >
              <Link href="/signup">Create a free account</Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {CHIPS.map(({ Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#0A1628]/90 dark:text-[#FEF3C7]"
              >
                <Icon className="size-4 text-[#F59E0B]" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* The learning path, shown rather than described */}
        <div
          className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:140ms]"
          aria-hidden="true"
        >
          <div className="rounded-2xl border border-amber-500/25 bg-card p-5 shadow-float sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow text-[#B45309] dark:text-[#FBBF24]">Your path</p>
              <p className="num-latin rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-[#92400E] dark:text-[#FBBF24]">
                {typeof unitCount === "number" ? unitCount : 57} units
              </p>
            </div>

            <ol className="mt-5 space-y-3">
              {[
                { title: "Connect 1", level: "Beginner", start: true },
                { title: "Connect 2", level: "High-Beginner", start: false },
                { title: "Connect 3", level: "Low-Intermediate", start: false },
                { title: "Interchange 1", level: "Elementary", start: false },
                { title: "Interchange 2", level: "Pre-Intermediate", start: false },
                { title: "Interchange 3", level: "Intermediate", start: false },
              ].map((book, index) => (
                <li
                  key={book.title}
                  className={`flex items-center gap-3.5 rounded-xl border p-3 transition-colors duration-300 ${
                    book.start
                      ? "border-amber-500/50 bg-[#FEF3C7]/40 dark:bg-[#1A365D] shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      : "border-amber-500/20 bg-background/60"
                  }`}
                >
                  <span
                    className={`num-latin grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                      book.start
                        ? "bg-[#0A1628] text-[#F59E0B] border border-amber-500/40"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[15px] font-semibold text-foreground">
                      {book.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {book.level}
                    </span>
                  </span>
                  {book.start ? (
                    <span className="shrink-0 rounded-full bg-[#F59E0B] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#0A1628] uppercase shadow-sm">
                      Start here
                    </span>
                  ) : (
                    <span className="size-2 shrink-0 rounded-full bg-amber-500/30" />
                  )}
                </li>
              ))}
            </ol>

            <p className="mt-5 border-t border-amber-500/20 pt-4 text-xs leading-6 text-muted-foreground">
              Every unit carries its own video lesson and PDF handout.
              {typeof bookCount === "number" ? ` ${bookCount} books on the shelf.` : ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
