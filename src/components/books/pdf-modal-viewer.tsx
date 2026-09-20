"use client";

import { useEffect } from "react";
import { Download, ExternalLink, FileText, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface PdfModalViewerProps {
  url: string | null;
  unitTitle: string;
  onClose: () => void;
}

export function PdfModalViewer({ url, unitTitle, onClose }: PdfModalViewerProps) {
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
          aria-label={`PDF handout: ${unitTitle}`}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-card shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#101828]"
          >
            {/* Header bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/90 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
                  <FileText className="size-5" />
                </span>
                <div>
                  <p className="eyebrow text-[10px] text-blue-500">PDF Handout</p>
                  <h3 className="font-serif text-sm font-semibold text-navy dark:text-foreground sm:text-base">
                    {unitTitle}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={url}
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">New tab</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close PDF viewer"
                  className="grid size-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Embedded PDF iframe */}
            <div className="relative flex-1 bg-slate-900/30">
              <iframe
                src={url}
                title={`PDF Handout for ${unitTitle}`}
                className="size-full border-0"
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
