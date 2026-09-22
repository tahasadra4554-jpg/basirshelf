import Link from "next/link";
import { Instagram, Mail, Send } from "lucide-react";

import { BrandLogo } from "@/components/site/brand-logo";
import { Container } from "@/components/site/container";

/** Fixed at build time so server and client markup always agree. */
const BUILD_YEAR = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
}).format(new Date());

const INSTITUTE = {
  name: "Basir Language Institute",
};

const QUICK_LINKS = [
  { href: "/#books", label: "Course library" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#why-basir", label: "Why students trust us" },
  { href: "/login", label: "Student sign in" },
  { href: "/signup", label: "Create an account" },
];

export function SiteFooter() {
  return (
    <footer
      id="about"
      className="scroll-mt-24 border-t border-amber-500/20 bg-[#0A1628] text-[#FEF3C7]/80"
    >
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <BrandLogo tone="invert" />
            <p className="max-w-sm text-sm leading-7 text-[#FEF3C7]/70">
              BasirShelf is the digital library of {INSTITUTE.name}. Every book
              is split into ordered units, and each unit carries its own video
              lesson and PDF handout — always one click away.
            </p>
            <ul className="flex items-center gap-2">
              {[
                { Icon: Instagram, label: "Instagram" },
                { Icon: Send, label: "Telegram" },
                { Icon: Mail, label: "Email" },
              ].map(({ Icon, label }) => (
                <li key={label}>
                  <span
                    title={label}
                    aria-label={label}
                    className="grid size-9 place-items-center rounded-xl border border-amber-500/30 bg-[#0F1B2D] text-[#FBBF24] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F59E0B] hover:text-[#FCD34D] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-labelledby="footer-links">
            <h2
              id="footer-links"
              className="eyebrow text-[#FBBF24]"
            >
              Quick links
            </h2>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#FBBF24]/90 transition-colors duration-200 hover:text-[#FCD34D] hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-amber-500/20 pt-6 text-xs text-[#FEF3C7]/60 sm:flex-row">
          <p>
            © {BUILD_YEAR}{" "}
            <span className="font-semibold text-[#FDFBF7]">
              BasirShelf
            </span>{" "}
            — all rights reserved by {INSTITUTE.name}.
          </p>
          <p>Built for students. No ads, no trackers.</p>
        </div>
      </Container>
    </footer>
  );
}
