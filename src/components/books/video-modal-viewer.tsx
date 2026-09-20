"use client";

import { useEffect } from "react";
import { PlayCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { VideoPlayer } from "@/components/books/video-player";

interface VideoModalViewerProps {
  url: string | null;
  unitTitle: string;
  onClose: () => void;
}

export function VideoModalViewer({ url, unitTitle, onClose }: VideoModalViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {url ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Video lesson: ${unitTitle}`}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-card shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#101828]"
          >
            {/* Header bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/90 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-red-500/10 text-red-500">
                  <PlayCircle className="size-5" />
                </span>
                <div>
                  <p className="eyebrow text-[10px] text-red-500">Video Lesson</p>
                  <h3 className="font-serif text-sm font-semibold text-navy dark:text-foreground sm:text-base">
                    {unitTitle}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close video player"
                className="grid size-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="p-4 sm:p-6 bg-slate-950/40">
              <VideoPlayer url={url} unitTitle={unitTitle} />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
