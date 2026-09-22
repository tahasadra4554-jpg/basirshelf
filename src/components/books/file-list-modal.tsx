"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Music,
  Play,
  Search,
  Video,
  X,
  ExternalLink,
  FileWarning,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type { SectionFile, SectionFileType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPE_META: Record<
  SectionFileType,
  { label: string; plural: string; icon: any; color: string; empty: string; headline: string; subtitle: string }
> = {
  video: {
    label: "Video",
    plural: "Videos",
    icon: Play,
    color: "#DC2626",
    empty: "No videos yet",
    headline: "No videos yet",
    subtitle: "This unit doesn't have any video content right now. Check back soon or contact your teacher.",
  },
  audio: {
    label: "Audio",
    plural: "Audios",
    icon: Music,
    color: "#7C3AED",
    empty: "No audios yet",
    headline: "No audios yet",
    subtitle: "This unit doesn't have any audio content right now. Check back soon or contact your teacher.",
  },
  pdf: {
    label: "PDF",
    plural: "PDFs",
    icon: FileText,
    color: "#2563EB",
    empty: "No PDFs yet",
    headline: "No PDFs yet",
    subtitle: "This unit doesn't have any PDF content right now. Check back soon or contact your teacher.",
  },
  image: {
    label: "Image",
    plural: "Images",
    icon: ImageIcon,
    color: "#059669",
    empty: "No images yet",
    headline: "No images yet",
    subtitle: "This unit doesn't have any image content right now. Check back soon or contact your teacher.",
  },
};

interface FileListModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  sectionTitle: string;
  type: SectionFileType;
  files: SectionFile[];
  onSelectFile: (file: SectionFile) => void;
}

export function FileListModal({
  isOpen,
  onClose,
  bookTitle,
  sectionTitle,
  type,
  files,
  onSelectFile,
}: FileListModalProps) {
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSearch("");
      setLightboxIndex(null);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const meta = TYPE_META[type];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q) || f.url.toLowerCase().includes(q));
  }, [files, search]);

  // Pagination for 50+ files: show first 50, then load more
  const [visibleCount, setVisibleCount] = useState(50);
  useEffect(() => {
    setVisibleCount(50);
  }, [search, type, files]);

  const visibleFiles = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0A1628]/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[101] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[20px] border border-[#F59E0B]/20 bg-[#0F1B2D] shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:max-h-[85vh] sm:max-w-[800px] sm:rounded-[20px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative border-b border-[#F59E0B]/20 bg-[#0F1B2D] px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-bold tracking-tight text-[#FDFBF7] sm:text-[16px]">
                      {bookTitle} — {sectionTitle} — {meta.plural}
                    </h2>
                    <div className="mt-1.5 h-[3px] w-10 rounded-[2px] bg-[#F59E0B]" />
                    <p className="mt-2 text-[11px] text-[#FEF3C7]/60">
                      {filtered.length} {filtered.length === 1 ? meta.label.toLowerCase() : meta.plural.toLowerCase()} • {files.length} total
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] transition-colors hover:bg-[#F59E0B]/20 hover:text-[#FDFBF7]"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#FEF3C7]/40" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${meta.plural.toLowerCase()}...`}
                    className="h-10 border-[#F59E0B]/20 bg-[#0A1628] pl-10 text-sm text-[#FDFBF7] placeholder:text-[#FEF3C7]/30 focus-visible:border-[#F59E0B]/50 focus-visible:ring-[#F59E0B]/20"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-[#0F1B2D] px-3 py-4 sm:px-5 sm:py-5">
                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="grid size-20 place-items-center rounded-[20px] bg-[#F59E0B]/12 border border-[#F59E0B]/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                      <meta.icon className="size-10 text-[#F59E0B]" />
                    </div>
                    <h3 className="mt-6 font-serif text-[18px] font-bold tracking-tight text-[#FDFBF7]">
                      {meta.headline}
                    </h3>
                    <p className="mt-2 max-w-[340px] text-[13px] leading-6 text-[#FEF3C7]/80 text-pretty">
                      {meta.subtitle}
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-2">
                      <Button
                        onClick={onClose}
                        variant="outline"
                        size="sm"
                        className="rounded-full border-[#F59E0B]/30 bg-[#0A1628] px-5 text-[#FCD34D] hover:bg-[#F59E0B]/10 hover:text-[#FBBF24] hover:border-[#F59E0B]/50"
                      >
                        Close
                      </Button>
                      <p className="text-[11px] text-[#FEF3C7]/40">You can still browse other media types</p>
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="grid size-16 place-items-center rounded-2xl bg-[#F59E0B]/10">
                      <Search className="size-8 text-[#F59E0B]/60" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#FDFBF7]">
                      No results for &apos;{search}&apos;
                    </p>
                    <p className="mt-1 text-xs text-[#FEF3C7]/50">Try a different search term.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearch("")}
                      className="mt-4 text-[#F59E0B] hover:bg-[#F59E0B]/10 hover:text-[#F59E0B]"
                    >
                      Clear search
                    </Button>
                  </div>
                ) : type === "image" ? (
                  <>
                    {/* Image Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {visibleFiles.map((file, idx) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="group cursor-pointer"
                          onClick={() => setLightboxIndex(filtered.indexOf(file))}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#F59E0B]/15 bg-[#0A1628]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={file.url}
                              alt={file.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector(".fallback") as HTMLElement;
                                  if (fallback) fallback.style.display = "grid";
                                }
                              }}
                            />
                            <div className="fallback hidden absolute inset-0 place-items-center bg-[#0A1628]">
                              <FileWarning className="size-6 text-[#F59E0B]/40" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                          <p
                            className="mt-2 truncate text-[11px] font-medium text-[#FEF3C7]/80 group-hover:text-[#FDFBF7]"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                    {hasMore && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVisibleCount((c) => c + 50)}
                          className="border-[#F59E0B]/20 bg-[#0A1628] text-[#F59E0B] hover:bg-[#F59E0B]/10"
                        >
                          Load more ({filtered.length - visibleCount} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* List for video/audio/pdf */}
                    <div className="space-y-2">
                      {visibleFiles.map((file, idx) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="group flex items-center gap-3 rounded-xl border border-[#F59E0B]/10 bg-[#0A1628] p-3 transition-colors hover:border-[#F59E0B]/30 hover:bg-[#0A1628]/80 sm:p-4"
                        >
                          <div
                            className="grid size-10 shrink-0 place-items-center rounded-xl"
                            style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                          >
                            <meta.icon className="size-5" style={{ color: meta.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-semibold text-[#FDFBF7]"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p
                              className="mt-0.5 truncate text-[11px] text-[#FEF3C7]/50"
                              title={file.url}
                            >
                              {file.url}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => onSelectFile(file)}
                            className="shrink-0 gap-1.5 bg-[#F59E0B] text-[#0F1B2D] hover:bg-[#FBBF24] font-semibold"
                          >
                            {type === "video" && <Play className="size-3.5" />}
                            {type === "audio" && <Music className="size-3.5" />}
                            {type === "pdf" && <ExternalLink className="size-3.5" />}
                            {type === "video" ? "Play" : type === "audio" ? "Play" : "Open"}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                    {hasMore && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVisibleCount((c) => c + 50)}
                          className="border-[#F59E0B]/20 bg-[#0A1628] text-[#F59E0B] hover:bg-[#F59E0B]/10"
                        >
                          Load more ({filtered.length - visibleCount} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer close reachable on mobile */}
              <div className="border-t border-[#F59E0B]/10 bg-[#0A1628] p-3 sm:hidden">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full border-[#F59E0B]/20 bg-[#0F1B2D] text-[#FDFBF7]"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Image Lightbox */}
          <AnimatePresence>
            {lightboxIndex !== null && type === "image" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex flex-col bg-[#0A1628]/95 backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-[#F59E0B]/10 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#FDFBF7]">
                      {filtered[lightboxIndex]?.name}
                    </p>
                    <p className="text-[11px] text-[#FEF3C7]/50">
                      {lightboxIndex + 1} of {filtered.length}
                    </p>
                  </div>
                  <button
                    onClick={() => setLightboxIndex(null)}
                    className="grid size-9 place-items-center rounded-full border border-[#F59E0B]/20 bg-[#0F1B2D] text-[#F59E0B]"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="relative flex flex-1 items-center justify-center p-4">
                  <button
                    onClick={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
                    disabled={lightboxIndex === 0}
                    className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-[#0F1B2D]/80 text-[#FDFBF7] backdrop-blur disabled:opacity-30 sm:left-4 sm:size-12"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filtered[lightboxIndex]?.url}
                    alt={filtered[lightboxIndex]?.name}
                    className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
                  />
                  <button
                    onClick={() => setLightboxIndex((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i))}
                    disabled={lightboxIndex === filtered.length - 1}
                    className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-[#0F1B2D]/80 text-[#FDFBF7] backdrop-blur disabled:opacity-30 sm:right-4 sm:size-12"
                  >
                    <ChevronRight className="size-6" />
                  </button>
                </div>
                <div className="border-t border-[#F59E0B]/10 p-4 text-center">
                  <p className="text-xs text-[#FEF3C7]/70">{filtered[lightboxIndex]?.name}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
