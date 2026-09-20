"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GraduationCap, Menu, UserRound, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { SearchField } from "@/components/books/search-field";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";

/**
 * Mobile navigation. Opens as a full drawer under the header, holds the
 * search field, navigation links, theme switcher, and authentication targets.
 */
export function MobileNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="relative lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open ? (
        <div
          id="mobile-menu"
          className="absolute top-12 end-0 z-50 w-[min(22rem,calc(100vw-2rem))] animate-fade-up rounded-2xl border border-border bg-card p-4 shadow-float backdrop-blur-xl"
        >
          <SearchField id="mobile-search" className="mb-3" />

          <nav aria-label="Mobile navigation">
            <ul className="space-y-1">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
                        active
                          ? "bg-accent text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="my-3 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Theme mode
                </span>
                <ThemeToggle />
              </div>
            </div>

            <div className="space-y-1.5 border-t border-border/60 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
              >
                <UserRound className="size-4" />
                Student sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-navy px-3.5 py-2.5 text-sm font-semibold text-navy-foreground transition-opacity hover:opacity-90"
              >
                <GraduationCap className="size-4" />
                Create free account
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
