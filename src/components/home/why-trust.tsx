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
    body: "Every book follows the Interchange or Connect curriculum in order, from the welcome unit to the final review. Nothing is out of place, nothing is missing.",
    proof: "Complete units per book, in course order",
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
      className="scroll-mt-24 border-y border-amber-500/20 bg-background text-foreground"
    >
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[#92400E] dark:text-[#FBBF24]">
            The institute effect
          </p>
          <h2
            id="why-basir-heading"
            className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#1A365D] dark:text-[#FCD34D] text-balance sm:text-4xl"
          >
            Why students trust BasirShelf
          </h2>
          <div className="amber-rule-center" />
          <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
            A library earns trust by being complete, quiet and dependable.
            These are the three promises we hold ourselves to.
          </p>
        </div>

        <ul className="stagger mt-12 grid gap-5 md:grid-cols-3">
          {REASONS.map(({ Icon, title, body, proof }) => (
            <li
              key={title}
              className="lift flex flex-col rounded-2xl border border-amber-500/25 bg-card p-7 shadow-soft transition-all duration-300 hover:border-[#F59E0B] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            >
              <span className="grid size-11 place-items-center rounded-xl border border-amber-500/30 bg-[#FEF3C7] dark:bg-[#1A365D] text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Icon className="size-5 text-[#F59E0B]" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-lg leading-snug font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-7 text-muted-foreground">
                {body}
              </p>
              <p className="mt-5 border-t border-amber-500/20 pt-4 text-[11px] font-semibold tracking-wide text-[#92400E] dark:text-[#FBBF24] uppercase">
                {proof}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-amber-500/25 bg-card p-6 sm:p-8">
          <p className="eyebrow text-[#B45309] dark:text-[#FBBF24]">
            Built for every learner
          </p>
          <ul className="mt-5 grid gap-6 sm:grid-cols-3">
            {ACCESS.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-[#F59E0B]"
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
