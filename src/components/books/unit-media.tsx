"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Image as ImageIcon,
  Music,
  PlayCircle,
} from "lucide-react";

import { isSafeExternalUrl } from "@/lib/video";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/books/video-player";

/**
 * Expand/collapse wrapper around everything a unit carries: the embedded video
 * player, the audio lesson and the lesson image. Collapsed by default so a
 * long unit list stays light and scannable.
 */
export function UnitMedia({
  videoUrl,
  audioUrl,
  imageUrl,
  unitTitle,
  panelId,
}: {
  videoUrl: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  unitTitle: string;
  panelId: string;
}) {
  const [open, setOpen] = useState(false);
  const hasVideo = isSafeExternalUrl(videoUrl);
  const hasAudio = isSafeExternalUrl(audioUrl);
  const hasImage = isSafeExternalUrl(imageUrl);

  // Allow quick-action menu or external buttons to open this media panel
  useEffect(() => {
    const handleOpenMedia = (e: Event) => {
      const custom = e as CustomEvent<{ panelId: string }>;
      if (custom.detail?.panelId === panelId) {
        setOpen(true);
        requestAnimationFrame(() => {
          const el = document.getElementById(panelId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      }
    };
    window.addEventListener("basirshelf:open-unit-media", handleOpenMedia);
    return () => window.removeEventListener("basirshelf:open-unit-media", handleOpenMedia);
  }, [panelId]);

  if (!hasVideo && !hasAudio && !hasImage) return null;

  const multiple = Number(hasVideo) + Number(hasAudio) + Number(hasImage) > 1;
  const label = multiple
    ? "Lesson media"
    : hasVideo
      ? "Watch video"
      : hasAudio
        ? "Play audio"
        : "View image";
  const Icon = hasVideo ? PlayCircle : hasAudio ? Music : ImageIcon;

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Icon aria-hidden="true" />
        {open ? "Hide media" : label}
        <ChevronDown
          className={`size-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </Button>

      {/* Always mounted so "Start with …" anchors have a real target. */}
      <div
        id={panelId}
        tabIndex={-1}
        onFocus={() => setOpen(true)}
        className="scroll-mt-32 outline-none"
      >
        {open ? (
          <div className="animate-fade-up space-y-6 border-t border-border bg-background px-4 py-5 sm:px-5">
            {hasVideo ? (
              <VideoPlayer url={videoUrl as string} unitTitle={unitTitle} />
            ) : null}

            {hasAudio ? (
              <div className="space-y-2">
                <p className="eyebrow text-muted-foreground">Audio lesson</p>
                <audio
                  controls
                  preload="none"
                  src={audioUrl as string}
                  className="w-full"
                >
                  Your browser does not support embedded audio —{" "}
                  <a href={audioUrl as string}>download it instead</a>.
                </audio>
                <a
                  href={audioUrl as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-text underline-offset-4 transition-colors duration-300 hover:underline dark:text-indigo"
                >
                  Open audio in a new tab
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            ) : null}

            {hasImage ? (
              <figure className="space-y-2">
                <a
                  href={imageUrl as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-fit rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl as string}
                    alt={`Lesson image for ${unitTitle}`}
                    loading="lazy"
                    className="max-h-80 w-auto rounded-xl border border-border object-contain shadow-soft"
                  />
                </a>
                <figcaption>
                  <a
                    href={imageUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-text underline-offset-4 transition-colors duration-300 hover:underline dark:text-indigo"
                  >
                    Open image in a new tab
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </figcaption>
              </figure>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
