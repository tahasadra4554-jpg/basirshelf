"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import type { Book } from "@/lib/types";
import { BookSpine } from "react-book-spine";

// Exact order and colors – DO NOT CHANGE
const SPINE_COLORS: Record<string, string> = {
  "Connect 1": "#B91C1C",
  "Connect 2": "#2563EB",
  "Connect 3": "#059669",
  "Interchange 1": "#B91C1C",
  "Interchange 2": "#2563EB",
  "Interchange 3": "#059669",
};

const DESIRED_ORDER = [
  "Connect 1",
  "Connect 2",
  "Connect 3",
  "Interchange 1",
  "Interchange 2",
  "Interchange 3",
];

function orderBooks(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const ai = DESIRED_ORDER.indexOf(a.title);
    const bi = DESIRED_ORDER.indexOf(b.title);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    const soA = (a as any).sort_order ?? 999;
    const soB = (b as any).sort_order ?? 999;
    if (soA !== soB) return soA - soB;
    return a.title.localeCompare(b.title);
  });
}

export function BookShelf({ books }: { books: Book[] }) {
  const router = useRouter();
  const ordered = useMemo(() => orderBooks(books), [books]);

  return (
    <div className="relative w-full overflow-hidden rounded-[24px]">
      {/* Vignette + subtle darker background + ambient light top-left */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[24px]"
        style={{
          background: `
            radial-gradient(ellipse at top left, rgba(245, 158, 11, 0.15), transparent 60%),
            radial-gradient(ellipse at bottom, rgba(20, 10, 5, 0.55), rgba(10, 5, 2, 0.3)),
            linear-gradient(to bottom, rgba(92, 64, 51, 0.12), rgba(10, 22, 40, 0.55))
          `,
          boxShadow: "inset 0 0 100px rgba(0,0,0,0.3)",
        }}
        aria-hidden="true"
      />

      {/* Warm amber lamp glow top-left */}
      <div
        className="pointer-events-none absolute -top-20 left-[12%] h-48 w-[55%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.06) 40%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Second soft glow center */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 h-32 w-[75%] -translate-x-1/2 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(245,158,11,0.10) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="relative px-4 py-10 sm:px-6 sm:py-14">
        {/* Shelf with perspective rotateX 3deg */}
        <div
          className="relative w-full"
          style={{
            perspective: "1200px",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="relative w-full"
            style={{
              transform: "perspective(1200px) rotateX(3deg)",
              transformOrigin: "bottom center",
            }}
          >
            {/* Books row – only this scrolls on mobile */}
            <div className="w-full overflow-x-auto overflow-y-visible pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-amber-500/20 md:overflow-x-visible [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="flex min-w-max items-end justify-start gap-[3px] px-2 pb-1 md:min-w-0 md:justify-start">
                {ordered.map((book, index) => {
                  const color = SPINE_COLORS[book.title] ?? "#1A365D";
                  return (
                    <motion.div
                      key={book.id}
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 260,
                        damping: 22,
                      }}
                      className="relative shrink-0"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <BookSpine
                        title={book.title}
                        author="Basir Institute"
                        color={color}
                        width={60}
                        height={320}
                        onClick={() => router.push(`/books/${book.id}`)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Realistic wooden shelf – dark wood brown #5C4033, height 20px */}
            <div className="relative mt-0 w-full">
              <div
                className="relative w-full"
                style={{
                  height: "20px",
                  borderRadius: "4px",
                  backgroundColor: "#5C4033",
                  backgroundImage: `
                    linear-gradient(90deg, rgba(255,255,255,0.04) 0%, transparent 18%, rgba(0,0,0,0.12) 45%, transparent 75%, rgba(255,255,255,0.03) 100%),
                    linear-gradient(180deg, rgba(139,111,71,0.35) 0%, rgba(255,255,255,0.08) 6%, transparent 14%, rgba(0,0,0,0.18) 78%, rgba(0,0,0,0.42) 100%)
                  `,
                  boxShadow: `
                    inset 0 1px 0 #8B6F47,
                    inset 0 -1px 0 rgba(0,0,0,0.65),
                    0 4px 12px rgba(0,0,0,0.5),
                    0 2px 6px rgba(0,0,0,0.4)
                  `,
                  borderTop: "1px solid #8B6F47",
                  borderBottom: "1px solid rgba(0,0,0,0.7)",
                }}
                aria-hidden="true"
              >
                {/* Wood grain SVG pattern + subtle lines */}
                <div
                  className="absolute inset-0 rounded-[4px] opacity-[0.18]"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(90deg,
                        transparent 0px,
                        transparent 18px,
                        rgba(0,0,0,0.28) 19px,
                        transparent 20px,
                        transparent 38px,
                        rgba(60,30,15,0.25) 39px,
                        transparent 40px,
                        transparent 62px,
                        rgba(255,255,255,0.05) 63px,
                        transparent 64px
                      )
                    `,
                  }}
                />
                {/* Top highlight shimmer */}
                <div
                  className="absolute left-0 right-0 top-0 h-[2px] rounded-t-[4px]"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(139,111,71,0.8), transparent)",
                  }}
                />
              </div>

              {/* Wooden brackets under shelf */}
              <div className="relative -mt-[1px] flex w-full justify-between px-8">
                <div
                  className="relative h-[14px] w-[6px] rounded-b-[2px]"
                  style={{
                    background: "linear-gradient(180deg, #8B6F47 0%, #5C4033 60%, #3E2723 100%)",
                    boxShadow: "0 3px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  <div className="absolute bottom-0 left-1/2 h-[2px] w-[10px] -translate-x-1/2 rounded-full bg-black/30 blur-[1px]" />
                </div>
                <div
                  className="relative h-[14px] w-[6px] rounded-b-[2px]"
                  style={{
                    background: "linear-gradient(180deg, #8B6F47 0%, #5C4033 60%, #3E2723 100%)",
                    boxShadow: "0 3px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  <div className="absolute bottom-0 left-1/2 h-[2px] w-[10px] -translate-x-1/2 rounded-full bg-black/30 blur-[1px]" />
                </div>
              </div>

              {/* Large soft shadow below shelf – depth illusion */}
              <div
                className="pointer-events-none mx-auto mt-2 h-6 w-[92%] rounded-full bg-black/45 blur-[12px]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none mx-auto -mt-3 h-10 w-[88%] rounded-full bg-black/25 blur-[18px]"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Responsive sizes – BookSpine width/height */}
      <style>{`
        @media (max-width: 1024px) and (min-width: 768px) {
          [data-spine] > div {
            width: 50px !important;
            height: 280px !important;
          }
          [data-spine] > div span.font-serif {
            font-size: 14px !important;
          }
        }
        @media (max-width: 767px) {
          [data-spine] > div {
            width: 40px !important;
            height: 240px !important;
          }
          [data-spine] > div span.font-serif {
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
