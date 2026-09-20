"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle, Music, Upload } from "lucide-react";
import { toast } from "sonner";

import type { ActionResult, Section } from "@/lib/types";

import { createSectionAction, updateSectionAction, uploadMediaAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeacherSectionForm({
  bookId,
  section,
  nextOrder = 1,
  onDone,
}: {
  bookId: string;
  section?: Section;
  nextOrder?: number;
  onDone: (message?: string) => void;
}) {
  const action = section ? updateSectionAction : createSectionAction;
  const [state, formAction, pending] = useActionState<
    ActionResult<Section> | null,
    FormData
  >(action, null);
  const done = useRef(false);

  const [audioUrl, setAudioUrl] = useState(section?.audio_url ?? "");
  const [imagesUrl, setImagesUrl] = useState(section?.images_url ?? section?.image_url ?? "");
  const [handoutUrl, setHandoutUrl] = useState(section?.handout_url ?? "");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingHandout, setUploadingHandout] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (!done.current) {
        done.current = true;
        onDone(state.message);
      }
    } else {
      toast.error(state.error);
    }
  }, [state, onDone]);

  async function handleFileUpload(file: File, kind: "audio" | "image" | "handout") {
    const setters = {
      audio: setUploadingAudio,
      image: setUploadingImage,
      handout: setUploadingHandout,
    };
    setters[kind](true);
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("book_id", bookId);
      fd.set("file", file);
      const res = await uploadMediaAction(null, fd);
      if (res.ok && res.data) {
        if (kind === "audio") setAudioUrl(res.data.url);
        if (kind === "handout") setHandoutUrl(res.data.url);
        if (kind === "image") {
          setImagesUrl((prev) => (prev ? `${prev}, ${res.data?.url}` : (res.data?.url ?? "")));
        }
        toast.success(`${kind} uploaded successfully.`);
      } else {
        toast.error(res.ok ? "Upload failed" : res.error);
      }
    } finally {
      setters[kind](false);
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="book_id" value={bookId} />
      {section ? <input type="hidden" name="id" value={section.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="section-title">Unit title</Label>
        <Input
          id="section-title"
          name="title"
          defaultValue={section?.title ?? ""}
          placeholder="Unit 4 — My everyday life"
          dir="ltr"
          className="text-start"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="section-video">Video URL (optional)</Label>
          <Input
            id="section-video"
            name="video_url"
            type="url"
            defaultValue={section?.video_url ?? ""}
            placeholder="https://youtube.com/watch?v=…"
            dir="ltr"
            className="text-start"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="section-sort">Sort order</Label>
          <Input
            id="section-sort"
            name="sort_order"
            type="number"
            min={0}
            max={9999}
            defaultValue={section?.sort_order ?? nextOrder}
            dir="ltr"
            className="text-start"
          />
        </div>
      </div>

      {/* Audio URL (optional) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="section-audio-url">Audio URL (optional)</Label>
          <label
            className={
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-300 hover:border-indigo/50 hover:text-indigo-text dark:hover:text-indigo" +
              (uploadingAudio ? " pointer-events-none opacity-60" : "")
            }
          >
            {uploadingAudio ? (
              <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-3" aria-hidden="true" />
            )}
            {uploadingAudio ? "Uploading…" : "Upload audio file"}
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              disabled={uploadingAudio}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file, "audio");
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <Input
          id="section-audio-url"
          name="audio_url"
          type="url"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          placeholder="https://example.com/audio/unit-lesson.mp3"
          dir="ltr"
          className="text-start"
        />
        <p className="text-[11px] text-muted-foreground">
          Listening practice: paste a direct audio link (MP3, WAV, etc.) or upload a file.
        </p>
      </div>

      {/* Images URL (optional, comma-separated) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="section-images-url">Images URL (optional, comma-separated)</Label>
          <label
            className={
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-300 hover:border-indigo/50 hover:text-indigo-text dark:hover:text-indigo" +
              (uploadingImage ? " pointer-events-none opacity-60" : "")
            }
          >
            {uploadingImage ? (
              <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-3" aria-hidden="true" />
            )}
            {uploadingImage ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file, "image");
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <Input
          id="section-images-url"
          name="images_url"
          type="text"
          value={imagesUrl}
          onChange={(e) => setImagesUrl(e.target.value)}
          placeholder="https://example.com/slide1.jpg, https://example.com/slide2.jpg"
          dir="ltr"
          className="text-start"
        />
        {/* Mirror to image_url hidden input for backward compatibility */}
        <input type="hidden" name="image_url" value={imagesUrl.split(",")[0]?.trim() || ""} />
        <p className="text-[11px] text-muted-foreground">
          Single image or comma-separated gallery image links for the lightbox.
        </p>
      </div>

      {/* Handout PDF (optional) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="section-handout-url">Handout PDF (optional)</Label>
          <label
            className={
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-300 hover:border-indigo/50 hover:text-indigo-text dark:hover:text-indigo" +
              (uploadingHandout ? " pointer-events-none opacity-60" : "")
            }
          >
            {uploadingHandout ? (
              <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-3" aria-hidden="true" />
            )}
            {uploadingHandout ? "Uploading…" : "Upload PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={uploadingHandout}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file, "handout");
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <Input
          id="section-handout-url"
          name="handout_url"
          type="url"
          value={handoutUrl}
          onChange={(e) => setHandoutUrl(e.target.value)}
          placeholder="https://example.com/handout.pdf"
          dir="ltr"
          className="text-start"
        />
        <p className="text-[11px] text-muted-foreground">
          Student handout: upload a PDF or paste a link.
        </p>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" />
              Saving…
            </>
          ) : section ? (
            "Save changes"
          ) : (
            "Add unit"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
