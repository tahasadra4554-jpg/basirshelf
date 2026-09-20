import {
  Captions,
  FolderOpen,
  Gauge,
  Keyboard,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

import { Container } from "@/components/site/container";

/** Results, not features — the reason a student trusts a shelf. */
const REASONS = [
  {
    Icon: ListChecks,
    title: "Unit-by-unit structured learning",
    body: "Every book follows the Interchange curriculum in order, from the welcome unit to the final review. Nothing is out of place, nothing is missing.",
    proof: "19 units per book, in course order",
  },
  {
    Icon: FolderOpen,
    title: "Offline-accessible PDF handouts",
    body: "Save the handout once and study anywhere — on the bus, in a café, or when the connection drops. No app to install, no account needed to read.",
    proof: "One click, standard PDF, works offline",
  },
  {
    Icon: ShieldCheck,
    title: "No ads. No distractions. Just learning.",
    body: "BasirShelf never sells your attention. There are no pop-ups, no autoplay carousels and no third-party trackers between you and the lesson.",
    proof: "Zero ad networks, zero tracking scripts",
  },
];

const ACCESS = [
  {
    Icon: Captions,
    title: "Captions",
    body: "Turn captions on in the embedded player, or press C while it has focus.",
  },
  {
    Icon: Gauge,
    title: "Playback speed",
    body: "Slow a lesson to 0.5× or push to 2× — the player keeps your choice.",
  },
  {
    Icon: Keyboard,
    title: "Keyboard first",
    body: "Every control is reachable with Tab, and focus is always visible.",
  },
];

export function WhyTrust() {
  return (
    <section
      id="why-basir"
      aria-labelledby="why-basir-heading"
      className="scroll-mt-24 border-y border-border bg-card"
    >
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-indigo-text dark:text-indigo">
            The institute effect
          </p>
          <h2
            id="why-basir-heading"
            className="mt-4 font-serif text-3xl font-semibold tracking-tight text-navy text-balance sm:text-4xl"
          >
            Why students trust BasirShelf
          </h2>
          <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
            A library earns trust by being complete, quiet and dependable.
            These are the three promises we hold ourselves to.
          </p>
        </div>

        <ul className="stagger mt-12 grid gap-5 md:grid-cols-3">
          {REASONS.map(({ Icon, title, body, proof }) => (
            <li
              key={title}
              className="lift flex flex-col rounded-2xl border border-border bg-background p-7 shadow-soft"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-navy text-navy-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-lg leading-snug font-semibold text-navy">
                {title}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-7 text-muted-foreground">
                {body}
              </p>
              <p className="mt-5 border-t border-border pt-4 text-[11px] font-semibold tracking-wide text-indigo-text uppercase dark:text-indigo">
                {proof}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-border bg-background p-6 sm:p-8">
          <p className="eyebrow text-muted-foreground">
            Built for every learner
          </p>
          <ul className="mt-5 grid gap-6 sm:grid-cols-3">
            {ACCESS.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-indigo-text dark:text-indigo"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-sans text-sm font-bold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
