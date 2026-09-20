import { CheckCircle2 } from "lucide-react";

import { BrandLogo } from "@/components/site/brand-logo";

/**
 * Shared frame for sign in / sign up / teacher sign in.
 * Left: the promise. Right: the form, on a card that reads like paper.
 */
export function AuthShell({
  title,
  subtitle,
  highlights = [],
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  highlights?: string[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_10%_0%,#ffffff_0%,#f6f2e9_52%,#efe9dd_100%)] dark:bg-[radial-gradient(110%_80%_at_10%_0%,#1a2440_0%,#101828_55%,#0b1120_100%)]" />
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-50" />
        <div className="absolute -start-24 top-0 size-80 animate-float rounded-full bg-indigo/12 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="hidden lg:block">
          <BrandLogo />
          <h2 className="mt-8 font-serif text-3xl leading-snug font-semibold tracking-tight text-navy text-balance">
            One account, the whole shelf
          </h2>
          <p className="mt-4 text-sm leading-8 text-muted-foreground">
            Sign in to keep your place in the course and reach the video and
            handout of every unit.
          </p>

          {highlights.length > 0 ? (
            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span className="leading-6 text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-md animate-fade-up rounded-2xl border border-border bg-card p-5 shadow-float sm:p-8">
          <div className="lg:hidden">
            <BrandLogo />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-semibold tracking-tight text-navy lg:mt-0">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {subtitle}
          </p>

          <div className="mt-6">{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
