import { ArrowRight, Download, MousePointerClick, Search } from "lucide-react";

import { Container } from "@/components/site/container";

const STEPS = [
  {
    Icon: Search,
    title: "Find your book",
    body: "Filter by title, level or topic. The library answers as you type, so you never scroll through a wall of covers.",
  },
  {
    Icon: MousePointerClick,
    title: "Open a unit",
    body: "Units are listed in course order with a running number, so you always know what comes next and what you have covered.",
  },
  {
    Icon: Download,
    title: "Watch and download",
    body: "Play the lesson right on the page at your own speed, or open it in a new tab — and take the PDF handout with you.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-24 bg-background text-foreground"
    >
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[#92400E] dark:text-[#FBBF24]">
            Simple and fast
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#1A365D] dark:text-[#FCD34D] text-balance sm:text-4xl"
          >
            Three steps from shelf to lesson
          </h2>
          <div className="amber-rule-center" />
          <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
            No menus to decode, no accounts to unlock a video. The path from a
            book to its handout is three clicks long.
          </p>
        </div>

        <ol className="stagger mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ Icon, title, body }, index) => (
            <li
              key={title}
              className="lift group relative overflow-hidden rounded-2xl border border-amber-500/25 bg-card p-7 shadow-soft transition-all duration-300 hover:border-[#F59E0B] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            >
              <span
                className="num-latin pointer-events-none absolute end-5 top-3 font-serif text-6xl font-semibold text-[#F59E0B]/15 transition-transform duration-300 group-hover:scale-110"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="grid size-11 place-items-center rounded-xl border border-amber-500/30 bg-[#FEF3C7] dark:bg-[#1A365D] text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Icon className="size-5 text-[#F59E0B]" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-7 text-muted-foreground">
                {body}
              </p>
              {index < STEPS.length - 1 ? (
                <ArrowRight
                  className="absolute -end-3 top-1/2 hidden size-6 -translate-y-1/2 text-[#F59E0B]/40 md:block"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
