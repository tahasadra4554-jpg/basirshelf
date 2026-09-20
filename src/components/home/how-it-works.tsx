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
      className="scroll-mt-24"
    >
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-indigo-text dark:text-indigo">
            Simple and fast
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-4 font-serif text-3xl font-semibold tracking-tight text-navy text-balance sm:text-4xl"
          >
            Three steps from shelf to lesson
          </h2>
          <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
            No menus to decode, no accounts to unlock a video. The path from a
            book to its handout is three clicks long.
          </p>
        </div>

        <ol className="stagger mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ Icon, title, body }, index) => (
            <li
              key={title}
              className="lift group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft"
            >
              <span
                className="num-latin pointer-events-none absolute end-5 top-3 font-serif text-6xl font-semibold text-navy/10 transition-transform duration-300 group-hover:scale-110"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-indigo-text dark:text-indigo">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-lg font-semibold text-navy">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-7 text-muted-foreground">
                {body}
              </p>
              {index < STEPS.length - 1 ? (
                <ArrowRight
                  className="absolute -end-3 top-1/2 hidden size-6 -translate-y-1/2 text-indigo/30 md:block"
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
