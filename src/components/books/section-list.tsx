"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Clock,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Music,
  PlayCircle,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import "yet-another-react-lightbox/styles.css";

import type { Section } from "@/lib/types";

import { cn } from "@/lib/utils";
import { isSafeExternalUrl, parseVideo } from "@/lib/video";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AudioMiniPlayer, type AudioTrack } from "@/components/books/audio-mini-player";
import { GearDialModal } from "@/components/books/gear-dial-modal";
import { PdfModalViewer } from "@/components/books/pdf-modal-viewer";
import { UnitMedia } from "@/components/books/unit-media";
import { VideoModalViewer } from "@/components/books/video-modal-viewer";

// Dynamically import Lightbox to optimize bundle size
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
});

/**
 * The unit list. Units keep their course order; each row shows at a glance
 * which media are ready.
 *
 * Next to each unit is ONE single sleek gear icon:
 * - Always visible on mobile
 * - Appears on hover on desktop
 * - Turns indigo with a 90° rotation on hover
 * - Tapping it opens the REAL, INTERACTIVE, ROTATING GEAR WHEEL DIAL modal!
 */
export function SectionList({
  sections,
  bookTitle,
}: {
  sections: Section[];
  bookTitle?: string;
}) {
  // Modal Dial State
  const [activeGearSection, setActiveGearSection] = useState<Section | null>(null);

  // Internal Player States
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [videoModalTitle, setVideoModalTitle] = useState("");

  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);

  const [pdfModalUrl, setPdfModalUrl] = useState<string | null>(null);
  const [pdfModalTitle, setPdfModalTitle] = useState("");

  if (sections.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="font-serif text-lg font-semibold text-navy">
          No units yet
        </p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          The teaching team will add the units for this book shortly.
        </p>
      </div>
    );
  }

  // Handle option selection from the Rotating Gear Dial
  const handleSelectFromDial = (
    option: "video" | "audio" | "images" | "pdf",
    section: Section,
  ) => {
    switch (option) {
      case "video": {
        if (!section.video_url) return;
        // Pause any active audio player
        window.dispatchEvent(new CustomEvent("basirshelf:pause-audio"));
        setVideoModalUrl(section.video_url);
        setVideoModalTitle(section.title);
        break;
      }
      case "audio": {
        if (!section.audio_url) return;
        setAudioTrack({
          title: section.title,
          audioUrl: section.audio_url,
          bookTitle,
          unitNumber: section.sort_order,
          sectionId: section.id,
        });
        break;
      }
      case "images": {
        const raw = section.images_url || section.image_url;
        if (!raw) return;
        const urls = raw
          .split(",")
          .map((s) => s.trim())
          .filter(
            (s) =>
              Boolean(s) &&
              (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")),
          );
        if (urls.length === 0) {
          toast.error("No valid image links found for this unit.");
          return;
        }
        setLightboxSlides(urls.map((src) => ({ src })));
        setLightboxOpen(true);
        break;
      }
      case "pdf": {
        if (!section.handout_url) return;
        setPdfModalUrl(section.handout_url);
        setPdfModalTitle(section.title);
        break;
      }
    }
  };

  return (
    <>
      <ol className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((section, index) => {
          const number = section.sort_order || index + 1;
          const video = parseVideo(section.video_url);
          const rawImages = section.images_url || section.image_url;
          const hasImage = isSafeExternalUrl(rawImages?.split(",")[0]?.trim() || "");
          const hasAudio = isSafeExternalUrl(section.audio_url);
          const hasHandout = isSafeExternalUrl(section.handout_url);
          const hasMedia = Boolean(video) || hasImage || hasAudio;
          const panelId = `unit-${section.id}-panel`;

          return (
            <li
              key={section.id}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:border-border/80 hover:bg-accent/30 hover:shadow-float sm:p-5"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <span
                  className="num-latin grid size-10 shrink-0 place-items-center rounded-xl bg-secondary font-serif text-sm font-semibold text-secondary-foreground transition-transform duration-300 group-hover:scale-105 sm:size-11 sm:text-base"
                  aria-hidden="true"
                >
                  {number}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-base leading-snug font-semibold text-navy sm:text-[17px]">
                    {section.title}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {video ? (
                      <span className="inline-flex items-center gap-1">
                        <PlayCircle
                          className="size-3.5 text-indigo-text dark:text-indigo"
                          aria-hidden="true"
                        />
                        Video
                      </span>
                    ) : null}
                    {hasAudio ? (
                      <span className="inline-flex items-center gap-1">
                        <Music
                          className="size-3.5 text-indigo-text dark:text-indigo"
                          aria-hidden="true"
                        />
                        Audio
                      </span>
                    ) : null}
                    {hasHandout ? (
                      <span className="inline-flex items-center gap-1">
                        <FileText
                          className="size-3.5 text-indigo-text dark:text-indigo"
                          aria-hidden="true"
                        />
                        PDF
                      </span>
                    ) : null}
                    {hasImage ? (
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon
                          className="size-3.5 text-indigo-text dark:text-indigo"
                          aria-hidden="true"
                        />
                        Images
                      </span>
                    ) : null}
                    {!video && !hasImage && !hasAudio && !hasHandout ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden="true" />
                        In preparation
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* 
                    ONE Single Gear Icon:
                    - Always visible on mobile
                    - Appears on hover on desktop
                    - Subtle gray by default (#94A3B8), turns indigo on hover with 90° rotation
                    - Clicking opens the full-screen mechanical Gear Dial!
                  */}
                  <button
                    type="button"
                    onClick={() => setActiveGearSection(section)}
                    aria-label={`Open interactive gear dial for ${section.title}`}
                    className={cn(
                      "group/gear relative grid size-10 shrink-0 place-items-center rounded-xl border border-transparent transition-all duration-200 ease-out",
                      // Mobile: always visible. Desktop: appears on unit hover
                      "opacity-100 sm:opacity-80 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
                      // Subtle gray by default (#94A3B8), turns indigo on hover
                      "text-[#94A3B8] hover:border-border/50 hover:bg-accent/60 hover:text-[#5A67D8]",
                      // Accessible focus ring
                      "focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:outline-none",
                    )}
                  >
                    <Settings
                      className="size-5 transition-transform duration-200 ease-out group-hover/gear:rotate-90"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {/* Optional inline media panel if expanded */}
              {hasMedia ? (
                <div id={panelId} className="hidden">
                  <UnitMedia
                    videoUrl={section.video_url}
                    audioUrl={section.audio_url}
                    imageUrl={rawImages}
                    unitTitle={section.title}
                    panelId={panelId}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* The Interactive Mechanical Rotating Gear Wheel Dial Modal */}
      <GearDialModal
        section={activeGearSection}
        bookTitle={bookTitle}
        onClose={() => setActiveGearSection(null)}
        onSelectOption={handleSelectFromDial}
      />

      {/* Internal Video Cinema Player Modal */}
      <VideoModalViewer
        url={videoModalUrl}
        unitTitle={videoModalTitle}
        onClose={() => setVideoModalUrl(null)}
      />

      {/* Internal Audio Mini-Player Bar (Fixed at bottom) */}
      <AudioMiniPlayer
        track={audioTrack}
        onClose={() => setAudioTrack(null)}
      />

      {/* Internal Image Lightbox Gallery */}
      {lightboxOpen ? (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxSlides}
        />
      ) : null}

      {/* Internal PDF Modal Viewer */}
      <PdfModalViewer
        url={pdfModalUrl}
        unitTitle={pdfModalTitle}
        onClose={() => setPdfModalUrl(null)}
      />
    </>
  );
}
