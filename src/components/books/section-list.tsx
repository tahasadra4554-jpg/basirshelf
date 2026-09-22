"use client";

import { useState } from "react";
import {
  Clock,
  FileText,
  Image as ImageIcon,
  Music,
  PlayCircle,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import type { SectionFile, SectionFileType, SectionWithFiles } from "@/lib/types";

import { cn } from "@/lib/utils";
import { isSafeExternalUrl, parseVideo } from "@/lib/video";
import { AudioMiniPlayer, type AudioTrack } from "@/components/books/audio-mini-player";
import { FileListModal } from "@/components/books/file-list-modal";
import { GearDialModal } from "@/components/books/gear-dial-modal";
import { PdfModalViewer } from "@/components/books/pdf-modal-viewer";
import { UnitMedia } from "@/components/books/unit-media";
import { VideoModalViewer } from "@/components/books/video-modal-viewer";

export function SectionList({
  sections,
  bookTitle,
}: {
  sections: SectionWithFiles[];
  bookTitle?: string;
}) {
  const [activeGearSection, setActiveGearSection] = useState<SectionWithFiles | null>(null);

  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [videoModalTitle, setVideoModalTitle] = useState("");

  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);

  const [pdfModalUrl, setPdfModalUrl] = useState<string | null>(null);
  const [pdfModalTitle, setPdfModalTitle] = useState("");

  const [fileListState, setFileListState] = useState<{
    open: boolean;
    type: SectionFileType;
    files: SectionFile[];
    section: SectionWithFiles | null;
  }>({ open: false, type: "video", files: [], section: null });

  if (sections.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="font-serif text-lg font-semibold text-navy">No units yet</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          The teaching team will add the units for this book shortly.
        </p>
      </div>
    );
  }

  const openFileDirectly = (file: SectionFile, section: SectionWithFiles) => {
    switch (file.type) {
      case "video":
        window.dispatchEvent(new CustomEvent("basirshelf:pause-audio"));
        setVideoModalUrl(file.url);
        setVideoModalTitle(file.name);
        break;
      case "audio":
        setAudioTrack({
          title: file.name,
          audioUrl: file.url,
          bookTitle,
          unitNumber: section.sort_order,
          sectionId: section.id,
        });
        break;
      case "pdf":
        setPdfModalUrl(file.url);
        setPdfModalTitle(file.name);
        break;
      case "image":
        // For images, always show the grid modal with search — even for single file
        // The FileListModal itself handles lightbox on click
        setFileListState({
          open: true,
          type: "image",
          files: section.files.filter((f) => f.type === "image"),
          section,
        });
        break;
    }
  };

  const handleSelectFromDial = (
    option: "video" | "audio" | "images" | "pdf",
    section: SectionWithFiles,
  ) => {
    const typeMap: Record<string, SectionFileType> = {
      video: "video",
      audio: "audio",
      images: "image",
      pdf: "pdf",
    };
    const fileType = typeMap[option];
    const filesOfType = section.files.filter((f) => f.type === fileType);

    if (filesOfType.length === 0) {
      // Fallback to legacy fields — always show list with search for all types
      if (option === "images") {
        const raw = section.images_url || section.image_url;
        if (raw) {
          const urls = raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((s) => s.startsWith("http") || s.startsWith("/"));
          if (urls.length > 0) {
            const fakeFiles: SectionFile[] = urls.map((url, idx) => ({
              id: `legacy-${section.id}-${idx}`,
              section_id: section.id,
              type: "image" as const,
              name: urls.length > 1 ? `${section.title} - Image ${idx + 1}` : `${section.title} - Image`,
              url,
              sort_order: idx,
              created_at: new Date().toISOString(),
            }));
            setFileListState({ open: true, type: "image", files: fakeFiles, section });
            return;
          }
        }
      }
      if (option === "video" && section.video_url) {
        const fakeFile: SectionFile = {
          id: `legacy-video-${section.id}`,
          section_id: section.id,
          type: "video",
          name: `${section.title} - Video`,
          url: section.video_url,
          sort_order: 0,
          created_at: new Date().toISOString(),
        };
        setFileListState({ open: true, type: "video", files: [fakeFile], section });
        return;
      }
      if (option === "audio" && section.audio_url) {
        const fakeFile: SectionFile = {
          id: `legacy-audio-${section.id}`,
          section_id: section.id,
          type: "audio",
          name: `${section.title} - Audio`,
          url: section.audio_url,
          sort_order: 0,
          created_at: new Date().toISOString(),
        };
        setFileListState({ open: true, type: "audio", files: [fakeFile], section });
        return;
      }
      if (option === "pdf" && section.handout_url) {
        const fakeFile: SectionFile = {
          id: `legacy-pdf-${section.id}`,
          section_id: section.id,
          type: "pdf",
          name: `${section.title} - Handout`,
          url: section.handout_url,
          sort_order: 0,
          created_at: new Date().toISOString(),
        };
        setFileListState({ open: true, type: "pdf", files: [fakeFile], section });
        return;
      }
      // ALWAYS open panel even when no files – show empty state inside
      setFileListState({ open: true, type: fileType, files: [], section });
      return;
    }

    // Always show file list modal with search and names for all types (user request)
    // Previously skipped list for single file, but user wants list like images for video/audio/pdf too
    setFileListState({
      open: true,
      type: fileType,
      files: filesOfType,
      section,
    });
  };

  const handleFileSelectFromList = (file: SectionFile) => {
    if (!fileListState.section) return;
    const section = fileListState.section;
    setFileListState((prev) => ({ ...prev, open: false }));
    setTimeout(() => {
      // For images, FileListModal handles lightbox internally, so we don't need to open viewer
      // But if user clicks Open button in list (for video/audio/pdf), open directly
      if (file.type !== "image") {
        openFileDirectly(file, section);
      }
    }, 200);
  };

  return (
    <>
      <ol className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.map((section, index) => {
          const number = section.sort_order || index + 1;
          const videoCount = section.files.filter((f) => f.type === "video").length;
          const audioCount = section.files.filter((f) => f.type === "audio").length;
          const imageCount = section.files.filter((f) => f.type === "image").length;
          const pdfCount = section.files.filter((f) => f.type === "pdf").length;

          const legacyVideo = parseVideo(section.video_url);
          const rawImages = section.images_url || section.image_url;
          const hasLegacyImage = isSafeExternalUrl(rawImages?.split(",")[0]?.trim() || "");
          const hasLegacyAudio = isSafeExternalUrl(section.audio_url);
          const hasLegacyHandout = isSafeExternalUrl(section.handout_url);
          const hasMedia =
            videoCount > 0 ||
            audioCount > 0 ||
            imageCount > 0 ||
            pdfCount > 0 ||
            Boolean(legacyVideo) ||
            hasLegacyImage ||
            hasLegacyAudio;

          const panelId = `unit-${section.id}-panel`;

          return (
            <li
              key={section.id}
              className="group flex flex-col justify-between rounded-2xl border border-amber-500/25 bg-card p-4 shadow-soft transition-all duration-300 hover:border-[#F59E0B] hover:bg-[#FEF3C7]/30 dark:hover:bg-[#1A365D]/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] sm:p-5"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <span
                  className="num-latin grid size-10 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-[#FEF3C7] dark:bg-[#1A365D] font-serif text-sm font-semibold text-[#1A365D] dark:text-[#FDFBF7] transition-transform duration-300 group-hover:scale-105 sm:size-11 sm:text-base"
                  aria-hidden="true"
                >
                  {number}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-base leading-snug font-semibold text-foreground transition-colors duration-200 group-hover:text-[#D97706] dark:group-hover:text-[#FCD34D] sm:text-[17px]">
                    {section.title}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {videoCount > 0 || legacyVideo ? (
                      <span className="inline-flex items-center gap-1">
                        <PlayCircle className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
                        Video {videoCount > 0 ? `(${videoCount})` : ""}
                      </span>
                    ) : null}
                    {audioCount > 0 || hasLegacyAudio ? (
                      <span className="inline-flex items-center gap-1">
                        <Music className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
                        Audio {audioCount > 0 ? `(${audioCount})` : ""}
                      </span>
                    ) : null}
                    {pdfCount > 0 || hasLegacyHandout ? (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
                        PDF {pdfCount > 0 ? `(${pdfCount})` : ""}
                      </span>
                    ) : null}
                    {imageCount > 0 || hasLegacyImage ? (
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
                        Images {imageCount > 0 ? `(${imageCount})` : ""}
                      </span>
                    ) : null}
                    {!hasMedia ? (
                      <span className="inline-flex items-center gap-1 text-[#FEF3C7]/60">
                        <Clock className="size-3.5" aria-hidden="true" />
                        In preparation
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveGearSection(section)}
                    aria-label={`Open interactive gear dial for ${section.title}`}
                    className={cn(
                      "group/gear relative grid size-10 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-[#1A365D]/60 text-[#F59E0B] transition-all duration-200 ease-out",
                      "opacity-100 sm:opacity-90 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
                      "hover:border-amber-500/60 hover:bg-amber-500/15 hover:text-[#FCD34D] hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]",
                      "focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:outline-none",
                    )}
                  >
                    <Settings
                      className="size-5 transition-transform duration-300 ease-out group-hover/gear:rotate-90"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

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

      <GearDialModal
        section={activeGearSection}
        bookTitle={bookTitle}
        onClose={() => setActiveGearSection(null)}
        onSelectOption={handleSelectFromDial as any}
      />

      {fileListState.section && (
        <FileListModal
          isOpen={fileListState.open}
          onClose={() => setFileListState((prev) => ({ ...prev, open: false }))}
          bookTitle={bookTitle ?? "Book"}
          sectionTitle={fileListState.section.title}
          type={fileListState.type}
          files={fileListState.files}
          onSelectFile={handleFileSelectFromList}
        />
      )}

      <VideoModalViewer
        url={videoModalUrl}
        unitTitle={videoModalTitle}
        onClose={() => setVideoModalUrl(null)}
      />

      <AudioMiniPlayer track={audioTrack} onClose={() => setAudioTrack(null)} />

      <PdfModalViewer
        url={pdfModalUrl}
        unitTitle={pdfModalTitle}
        onClose={() => setPdfModalUrl(null)}
      />
    </>
  );
}
