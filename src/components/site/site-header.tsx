"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onHashChange = () => setCurrentHash(window.location.hash);
    onScroll();
    onHashChange();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-amber-500/20 bg-background/95 shadow-soft backdrop-blur-xl"
          : "border-amber-500/15 bg-background/85 backdrop-blur-md",
      )}
    >
      {/* Institute strip — quiet, authoritative, one line of context */}
      <div className="hidden border-b border-amber-500/20 bg-[#1A365D] dark:bg-[#0F1B2D] text-[#FDFBF7] sm:block">
        <div className="mx-auto flex h-8 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="eyebrow text-[#FEF3C7] dark:text-[#FBBF24]">
            Basir Language Institute · Digital library
          </p>
          <p className="text-[11px] font-medium text-[#FEF3C7]/80">
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
          {NAV_LINKS.map((link) => {
            const isActive =
              (link.href === "/#books" && (currentHash === "#books" || (pathname === "/" && !currentHash))) ||
              (link.href.includes("#") && currentHash === link.href.substring(link.href.indexOf("#")));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-[#D97706] dark:text-[#F59E0B] font-semibold after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#F59E0B] after:rounded-full"
                    : "text-foreground/90 hover:text-[#D97706] dark:hover:text-[#FCD34D] hover:bg-amber-500/10",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <SearchField
            id="header-search"
            variant="header"
            className="hidden 2xl:block"
          />
          {/* Theme switcher */}
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
