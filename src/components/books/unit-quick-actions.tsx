"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  Headphones,
  Image as ImageIcon,
  Play,
  Settings,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { Section } from "@/lib/types";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnitQuickActionsProps {
  section: Section;
  bookTitle?: string;
  onPlayAudio?: (track: { title: string; audioUrl: string; bookTitle?: string }) => void;
  onOpenImages?: (images: string[], title: string) => void;
  onOpenVideo?: () => void;
}

export function UnitQuickActions({
  section,
  bookTitle,
  onPlayAudio,
  onOpenImages,
  onOpenVideo,
}: UnitQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReduced = useReducedMotion();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Detect mobile viewport (under 640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hasVideo = Boolean(section.video_url);
  const hasAudio = Boolean(section.audio_url);
  const hasHandout = Boolean(section.handout_url);
  const rawImages = section.images_url || section.image_url;
  const imageList = rawImages
    ? rawImages
        .split(",")
        .map((s) => s.trim())
        .filter((s) => Boolean(s) && (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")))
    : [];
  const hasImages = imageList.length > 0;

  // Action handlers
  const handleSelectVideo = () => {
    if (!hasVideo) return;
    setIsOpen(false);
    // Pulse animation micro-interaction
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 350);

    // Pause audio mini player if playing
    window.dispatchEvent(new CustomEvent("basirshelf:pause-audio"));

    if (onOpenVideo) {
      onOpenVideo();
    } else {
      // Trigger media panel open
      const panelId = `unit-${section.id}-panel`;
      window.dispatchEvent(
        new CustomEvent("basirshelf:open-unit-media", {
          detail: { panelId },
        }),
      );
    }
  };

  const handleSelectAudio = () => {
    if (!hasAudio || !section.audio_url) return;
    setIsOpen(false);
    onPlayAudio?.({
      title: section.title,
      audioUrl: section.audio_url,
      bookTitle,
    });
  };

  const handleSelectPdf = () => {
    if (!hasHandout || !section.handout_url) return;
    setIsOpen(false);
    toast.success("Downloading handout…");
    const link = document.createElement("a");
    link.href = section.handout_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectImages = () => {
    if (!hasImages) return;
    setIsOpen(false);
    onOpenImages?.(imageList, section.title);
  };

  const actions = [
    {
      id: "video" as const,
      label: "Video",
      subtitle: "Watch lesson",
      icon: Play,
      iconColor: "text-red-500 fill-red-500/20",
      available: hasVideo,
      onSelect: handleSelectVideo,
    },
    {
      id: "audio" as const,
      label: "Audio",
      subtitle: "Listen on the go",
      icon: Headphones,
      iconColor: "text-purple-500",
      available: hasAudio,
      onSelect: handleSelectAudio,
    },
    {
      id: "pdf" as const,
      label: "PDF",
      subtitle: "Download handout",
      icon: FileText,
      iconColor: "text-amber-500",
      available: hasHandout,
      onSelect: handleSelectPdf,
    },
    {
      id: "images" as const,
      label: "Images",
      subtitle: "View gallery",
      icon: ImageIcon,
      iconColor: "text-emerald-500",
      available: hasImages,
      onSelect: handleSelectImages,
    },
  ];

  // Keyboard navigation within the floating menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const container = menuRef.current;
      if (!container) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>('button[role="menuitem"]:not([disabled])'),
      );
      if (items.length === 0) return;

      const activeIdx = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === "ArrowDown") {
        const next = activeIdx < items.length - 1 ? items[activeIdx + 1] : items[0];
        next?.focus();
      } else {
        const prev = activeIdx > 0 ? items[activeIdx - 1] : items[items.length - 1];
        prev?.focus();
      }
    }
  };

  // Render an individual action item
  const renderItem = (item: (typeof actions)[number]) => {
    const Icon = item.icon;

    if (!item.available) {
      return (
        <Tooltip key={item.id} delayDuration={150}>
          <TooltipTrigger asChild>
            <div
              role="menuitem"
              aria-disabled="true"
              tabIndex={0}
              className="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start opacity-40 cursor-not-allowed select-none transition-colors"
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg bg-secondary/80",
                  item.iconColor,
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-sm font-bold text-foreground">
                  {item.label}
                </p>
                <p className="font-sans text-[11px] text-muted-foreground">
                  {item.subtitle}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="rounded-lg border border-border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md"
          >
            Not available for this unit
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        role="menuitem"
        onClick={item.onSelect}
        className={cn(
          "group/item flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition-all duration-150",
          "hover:translate-x-1 hover:bg-[#5A67D8]/10",
          "focus-visible:translate-x-1 focus-visible:bg-[#5A67D8]/10 focus-visible:outline-none",
        )}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg bg-secondary transition-transform group-hover/item:scale-105",
            item.iconColor,
          )}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-bold text-foreground transition-colors group-hover/item:text-[#5A67D8]">
            {item.label}
          </p>
          <p className="font-sans text-[11px] text-muted-foreground">
            {item.subtitle}
          </p>
        </div>
      </button>
    );
  };

  // The Trigger Gear Button
  const triggerButton = (
    <motion.button
      type="button"
      aria-label={`Quick actions for ${section.title}`}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      onClick={() => setIsOpen((prev) => !prev)}
      animate={
        isPulsing && !prefersReduced
          ? { scale: [1, 1.25, 1], transition: { duration: 0.3 } }
          : { scale: 1 }
      }
      className={cn(
        "group/gear relative grid size-9 shrink-0 place-items-center rounded-xl border border-transparent transition-all duration-200 ease-out",
        // Desktop: fades in on hover over unit row; always visible on mobile
        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        isOpen && "opacity-100 border-amber-500/50 bg-[#1A365D] text-[#F59E0B]",
        // Visible focus ring
        "focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:outline-none",
        // Subtle amber on hover
        "text-[#F59E0B] hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-[#FCD34D]",
      )}
    >
      <motion.div
        animate={{
          rotate: isOpen && !prefersReduced ? 90 : 0,
        }}
        whileHover={!prefersReduced && !isOpen ? { rotate: 90 } : {}}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Settings className="size-4" aria-hidden="true" />
      </motion.div>
    </motion.button>
  );

  return (
    <TooltipProvider>
      {/* Mobile Drawer / Bottom Sheet */}
      {isMobile ? (
        <>
          {triggerButton}
          <AnimatePresence>
            {isOpen ? (
              <div className="fixed inset-0 z-50 sm:hidden">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                  aria-hidden="true"
                />

                {/* Bottom sheet */}
                <motion.div
                  ref={menuRef}
                  role="menu"
                  aria-label={`Quick actions for ${section.title}`}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 350 }}
                  onKeyDown={handleKeyDown}
                  className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/15 bg-card/95 p-5 pb-8 shadow-2xl backdrop-blur-2xl"
                >
                  {/* Thumb drag handle */}
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

                  {/* Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="eyebrow text-[10px] text-muted-foreground">
                        Quick Actions
                      </p>
                      <h4 className="font-serif text-base font-semibold text-navy dark:text-foreground">
                        {section.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Close menu"
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* 4 Options */}
                  <div className="space-y-1.5">
                    {actions.map(renderItem)}
                  </div>

                  {/* Cancel button for thumb reach */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="mt-4 w-full rounded-xl border border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Cancel
                  </button>
                </motion.div>
              </div>
            ) : null}
          </AnimatePresence>
        </>
      ) : (
        /* Desktop Floating Popover */
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={12}
            className="z-50 w-[220px] rounded-2xl border border-white/20 bg-card/85 p-2 shadow-float backdrop-blur-xl outline-none dark:border-white/10 dark:bg-[#101828]/90"
            onKeyDown={handleKeyDown}
          >
            <motion.div
              ref={menuRef}
              role="menu"
              aria-label={`Quick actions for ${section.title}`}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={
                prefersReduced
                  ? { duration: 0.1 }
                  : { duration: 0.15, ease: "easeOut" }
              }
              className="space-y-1"
            >
              {actions.map(renderItem)}
            </motion.div>
          </PopoverContent>
        </Popover>
      )}
    </TooltipProvider>
  );
}
