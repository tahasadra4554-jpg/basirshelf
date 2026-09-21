"use client";

import { useState, useTransition } from "react";
import {
  Download,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Music,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type { BookWithSections, Section } from "@/lib/types";

import {
  deleteSectionAction,
  uploadMediaAction,
} from "@/lib/actions";
import { videoProvider } from "@/lib/utils";
import { TeacherSectionForm } from "@/components/teacher/teacher-section-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TeacherSectionManager({
  book,
  onChanged,
}: {
  book: BookWithSections;
  onChanged: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Section | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh(message?: string) {
    if (message) toast.success(message);
    setAddOpen(false);
    setEditTarget(null);
    onChanged();
  }

  function handleDelete(section: Section) {
    if (!window.confirm(`Delete the unit “${section.title}”?`)) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", section.id);
      formData.set("book_id", book.id);
      const result = await deleteSectionAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Deleted.");
        onChanged();
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleUpload(file: File, section: Section) {
    const formData = new FormData();
    formData.set("kind", "handout");
    formData.set("book_id", book.id);
    formData.set("file", file);
    const result = await uploadMediaAction(null, formData);
    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Upload failed." : result.error);
      return;
    }

    const update = new FormData();
    update.set("id", section.id);
    update.set("title", section.title);
    update.set("video_url", section.video_url ?? "");
    update.set("handout_url", result.data.url);
    update.set("image_url", section.image_url ?? "");
    update.set("images_url", section.images_url ?? section.image_url ?? "");
    update.set("audio_url", section.audio_url ?? "");
    update.set("sort_order", String(section.sort_order));

    const { updateSectionAction } = await import("@/lib/actions");
    const updated = await updateSectionAction(null, update);
    if (updated.ok) {
      toast.success("Handout uploaded and attached to the unit.");
      onChanged();
    } else {
      toast.error(updated.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold">Manage units</h4>
          <p className="mt-1 text-[11px] text-muted-foreground">
            For every unit you can attach a video link, an image, an audio file
            and a PDF — uploaded or linked.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          Add unit
        </Button>
      </div>

      {book.sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-xs text-muted-foreground">
          No units yet.
        </p>
      ) : (
        <>
          {/* Mobile: stacked cards (block md:hidden) */}
          <div className="block space-y-3 md:hidden">
            {book.sections.map((section, index) => (
              <div
                key={section.id}
                className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="num-latin grid size-7 place-items-center rounded-lg bg-secondary text-xs font-bold text-primary">
                      {section.sort_order || index + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {section.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit unit"
                      onClick={() => setEditTarget(section)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete unit"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(section)}
                      disabled={pending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Video:
                    </span>
                    {section.video_url ? (
                      <a
                        href={section.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-primary hover:underline"
                      >
                        Link
                      </a>
                    ) : (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        None
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Audio:
                    </span>
                    {section.audio_url ? (
                      <a
                        href={section.audio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[#FBBF24] hover:text-[#FCD34D] hover:underline"
                      >
                        Audio
                      </a>
                    ) : (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        None
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Image:
                    </span>
                    {section.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={section.image_url}
                        alt=""
                        className="size-5 rounded object-cover"
                      />
                    ) : (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        None
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      PDF:
                    </span>
                    {section.handout_url ? (
                      <a
                        href={section.handout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-success hover:underline"
                      >
                        PDF
                      </a>
                    ) : (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        None
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/40 pt-2">
                  <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    <Upload className="size-3.5" />
                    Upload PDF Handout
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={pending}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUpload(file, section);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: clean table (hidden md:block) */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead>Unit title</TableHead>
                  <TableHead className="w-32">Video</TableHead>
                  <TableHead className="w-24">Image</TableHead>
                  <TableHead className="w-24">Audio</TableHead>
                  <TableHead className="w-40">PDF</TableHead>
                  <TableHead className="w-24 text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {book.sections.map((section, index) => (
                  <TableRow key={section.id}>
                    <TableCell className="num-latin font-semibold text-primary">
                      {section.sort_order || index + 1}
                    </TableCell>
                    <TableCell className="font-medium" dir="ltr">
                      <span className="block text-start">{section.title}</span>
                    </TableCell>
                    <TableCell>
                      {section.video_url ? (
                        <a
                          href={section.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <PlayCircle className="size-3.5" />
                          {videoProvider(section.video_url) ?? "Link"}
                        </a>
                      ) : (
                        <Badge variant="secondary">Empty</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {section.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={section.image_url}
                          alt={`${section.title} image`}
                          className="size-9 rounded-lg border border-border object-cover"
                        />
                      ) : (
                        <Badge variant="secondary">Empty</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {section.audio_url ? (
                        <a
                          href={section.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FBBF24] hover:text-[#FCD34D] hover:underline"
                        >
                          <Music className="size-3.5" />
                          Audio
                        </a>
                      ) : (
                        <Badge variant="secondary">Empty</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {section.handout_url ? (
                          <a
                            href={section.handout_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-success hover:underline"
                          >
                            <Download className="size-3.5" />
                            PDF
                          </a>
                        ) : (
                          <Badge variant="secondary">Empty</Badge>
                        )}

                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                          <Upload className="size-3" />
                          Upload
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            disabled={pending}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void handleUpload(file, section);
                              event.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Edit unit"
                          onClick={() => setEditTarget(section)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Delete unit"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(section)}
                          disabled={pending}
                        >
                          {pending ? (
                            <LoaderCircle className="animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <FileText className="size-3.5" />
        Uploads are stored in public Supabase Storage buckets: <code dir="ltr">covers</code>, <code dir="ltr">images</code>, <code dir="ltr">audio</code> and <code dir="ltr">handouts</code>.
      </p>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add unit</DialogTitle>
            <DialogDescription>
              Enter the unit title as it appears in the book; video and handout are optional.
            </DialogDescription>
          </DialogHeader>
          <TeacherSectionForm
            bookId={book.id}
            nextOrder={
              (book.sections[book.sections.length - 1]?.sort_order ?? 0) + 1
            }
            onDone={refresh}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => (open ? null : setEditTarget(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit unit</DialogTitle>
            <DialogDescription>
              Replace a link or leave it empty to disable that button.
            </DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <TeacherSectionForm
              bookId={book.id}
              section={editTarget}
              onDone={refresh}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
