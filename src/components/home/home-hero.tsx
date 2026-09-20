import Link from "next/link";
import { ArrowRight, BadgeCheck, FileDown, GraduationCap, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const CHIPS = [
  { Icon: BadgeCheck, label: "Unit-by-unit structure" },
  { Icon: FileDown, label: "Offline PDF handouts" },
  { Icon: ShieldCheck, label: "No ads, ever" },
];

/**
 * Hero: one clear promise, two ways in, and a shelf that shows the learning
 * path. Background depth comes from a soft gradient plus a fine geometric
 * pattern — never a stock photo, never noise.
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
      className="relative overflow-hidden border-b border-border"
    >
      {/* Depth: soft wash + geometric lattice */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_0%,#ffffff_0%,#f6f2e9_46%,#efe9dd_100%)] dark:bg-[radial-gradient(120%_90%_at_15%_0%,#1a2440_0%,#101828_50%,#0b1120_100%)]" />
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="absolute -end-24 -top-24 size-96 animate-float rounded-full bg-indigo/15 blur-3xl" />
        <div className="absolute -start-20 top-40 size-80 animate-float rounded-full bg-navy/10 blur-3xl [animation-delay:-5s]" />
        <svg
          className="absolute inset-y-0 end-0 h-full w-1/2 opacity-[0.16]"
          viewBox="0 0 400 400"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="300" cy="120" r="150" stroke="var(--navy)" strokeWidth="0.75" />
          <circle cx="300" cy="120" r="105" stroke="var(--navy)" strokeWidth="0.75" />
          <circle cx="300" cy="120" r="60" stroke="var(--indigo)" strokeWidth="0.75" />
          <path d="M0 300 L400 180" stroke="var(--navy)" strokeWidth="0.75" />
          <path d="M0 340 L400 220" stroke="var(--navy)" strokeWidth="0.75" />
          <path d="M0 380 L400 260" stroke="var(--navy)" strokeWidth="0.75" />
        </svg>
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-8 lg:py-24">
        <div className="animate-fade-up">
          <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-indigo-text shadow-soft dark:text-indigo">
            <GraduationCap className="size-3.5" aria-hidden="true" />
            Basir Language Institute
          </p>

          <h1
            id="hero-heading"
            className="mt-6 font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-navy sm:text-5xl lg:text-[3.4rem]"
          >
            Master English with the{" "}
            <span className="relative whitespace-nowrap text-indigo-text dark:text-indigo">
              Basir Institute
              <svg
                className="absolute -bottom-1 start-0 h-2.5 w-full text-indigo/45"
                viewBox="0 0 200 10"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M1 7.5C40 3 80 2.2 120 4.4c26 1.4 52 3 79 1.4"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            Standard.
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-foreground/80 text-pretty sm:text-lg sm:leading-9">
            Structured videos and handouts for every unit of the Interchange
            series — arranged in course order, so you always know exactly what
            to study next.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="shadow-glow">
              <a href="#books">
                Browse the library
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup">Create a free account</Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {CHIPS.map(({ Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/85"
              >
                <Icon className="size-4 text-indigo-text dark:text-indigo" aria-hidden="true" />
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
          <div className="rounded-2xl border border-border bg-card p-5 shadow-float sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow text-muted-foreground">Your path</p>
              <p className="num-latin rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                {typeof unitCount === "number" ? unitCount : 57} units
              </p>
            </div>

            <ol className="mt-5 space-y-3">
              {[
                { title: "Interchange 1", level: "Elementary", start: true },
                { title: "Interchange 2", level: "Pre-Intermediate", start: false },
                { title: "Interchange 3", level: "Intermediate", start: false },
              ].map((book, index) => (
                <li
                  key={book.title}
                  className={`flex items-center gap-3.5 rounded-xl border p-3 transition-colors duration-300 ${
                    book.start
                      ? "border-indigo/45 bg-accent"
                      : "border-border bg-background"
                  }`}
                >
                  <span
                    className={`num-latin grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                      book.start
                        ? "bg-navy text-navy-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[15px] font-semibold text-navy">
                      {book.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {book.level}
                    </span>
                  </span>
                  {book.start ? (
                    <span className="shrink-0 rounded-full bg-indigo px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                      Start here
                    </span>
                  ) : (
                    <span className="size-2 shrink-0 rounded-full bg-border" />
                  )}
                </li>
              ))}
            </ol>

            <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
              Every unit carries its own video lesson and PDF handout.
              {typeof bookCount === "number" ? ` ${bookCount} books on the shelf.` : ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
