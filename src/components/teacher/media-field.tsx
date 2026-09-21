"use client";

import { useRef, useState } from "react";
import { FileText, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import type { MediaKind } from "@/lib/actions";

import { uploadMediaAction } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PLACEHOLDERS: Record<MediaKind, string> = {
  cover: "https://example.com/cover.jpg",
  image: "https://example.com/lesson-image.jpg",
  audio: "https://example.com/lesson-audio.mp3",
  handout: "https://example.com/handout.pdf",
};

/**
 * One media slot: upload a file straight to Supabase Storage, or paste a link.
 * Either way the resulting URL lands in the named input, so the surrounding
 * form saves it like any other field.
 */
export function MediaField({
  id,
  name,
  label,
  kind,
  bookId,
  accept,
  defaultValue = "",
  hint,
}: {
  id: string;
  name: string;
  label: string;
  kind: MediaKind;
  bookId?: string;
  accept: string;
  defaultValue?: string;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("book_id", bookId ?? "");
    formData.set("file", file);
    const result = await uploadMediaAction(null, formData);
    setUploading(false);
    if (result.ok && result.data) {
      setUrl(result.data.url);
      toast.success(`${label}: file uploaded.`);
    } else {
      toast.error(result.ok ? "Upload failed." : result.error);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <label
          className={
            "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-500/30 px-2.5 py-1 text-[11px] font-medium text-[#FEF3C7]/80 transition-colors duration-200 hover:border-amber-500/60 hover:text-[#FCD34D] hover:bg-amber-500/10" +
            (uploading ? " pointer-events-none opacity-60" : "")
          }
        >
          {uploading ? (
            <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-3" aria-hidden="true" />
          )}
          {uploading ? "Uploading…" : "Upload file"}
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {url ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-2">
          {kind === "cover" || kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={`${label} preview`}
              className="size-12 shrink-0 rounded-lg border border-border object-cover"
            />
          ) : kind === "audio" ? (
            <audio controls preload="none" src={url} className="h-9 w-full" />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
              <FileText className="size-4" aria-hidden="true" />
            </span>
          )}
          <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
            {url}
          </p>
        </div>
      ) : null}

      <Input
        id={id}
        name={name}
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={PLACEHOLDERS[kind]}
        dir="ltr"
        className="text-start"
      />
      {hint ? (
        <p className="text-[11px] leading-6 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
