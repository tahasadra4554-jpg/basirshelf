"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

type Mode = "light" | "dark" | "system";

const STORAGE_KEY = "basirshelf:theme";

const OPTIONS: { id: Mode; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

function apply(mode: Mode): void {
  const root = document.documentElement;
  const dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Light / dark / system. The pre-hydration script in app/layout.tsx applies the
 * stored choice before first paint, so there is no flash of the wrong theme.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    let stored: Mode = "system";
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value === "light" || value === "dark" || value === "system") {
        stored = value;
      }
    } catch {
      /* storage blocked — fall back to the system preference */
    }
    setMode(stored);
    apply(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((window.localStorage.getItem(STORAGE_KEY) ?? "system") === "system") {
        apply("system");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function choose(next: Mode) {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* non-fatal */
    }
    apply(next);
  }

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5 shadow-soft"
    >
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => choose(id)}
          aria-pressed={mode === id}
          title={`${label} theme`}
          className={cn(
            "grid size-8 place-items-center rounded-full transition-all duration-300",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            mode === id
              ? "bg-navy text-navy-foreground shadow-soft"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          <span className="sr-only">{label} theme</span>
        </button>
      ))}
    </div>
  );
}
