"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { SearchField } from "@/components/books/search-field";
import { AuthButtons } from "@/components/site/auth-buttons";
import { BrandLogo } from "@/components/site/brand-logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { ThemeToggle } from "@/components/site/theme-toggle";

/** Kept to four destinations — everything a student needs, nothing more. */
export const NAV_LINKS = [
  { href: "/#books", label: "Library" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#why-basir", label: "Why Basir" },
  { href: "/#about", label: "About" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[box-shadow,background-color,border-color] duration-300",
        scrolled
          ? "border-border bg-card/85 shadow-soft backdrop-blur-xl"
          : "border-transparent bg-background/70 backdrop-blur-md",
      )}
    >
      {/* Institute strip — quiet, authoritative, one line of context */}
      <div className="hidden border-b border-navy/15 bg-navy text-navy-foreground sm:block">
        <div className="mx-auto flex h-8 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="eyebrow text-navy-foreground/85">
            Basir Language Institute · Digital library
          </p>
          <p className="text-[11px] font-medium text-navy-foreground/75">
            No ads. No distractions. Just learning.
          </p>
        </div>
      </div>

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLogo className="shrink-0" />

        <nav
          className="ms-6 hidden items-center gap-1 xl:flex"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <SearchField
            id="header-search"
            variant="header"
            className="hidden 2xl:block"
          />
          {/* Theme switcher: shown inline on large desktop, moved into hamburger menu on mobile/tablet */}
          <div className="hidden xl:inline-flex">
            <ThemeToggle />
          </div>
          <AuthButtons />
          <div className="xl:hidden">
            <MobileNav links={NAV_LINKS} />
          </div>
        </div>
      </div>
    </header>
  );
}
