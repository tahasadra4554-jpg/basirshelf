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
  Video,
} from "lucide-react";
import { toast } from "sonner";

import type { BookWithSectionsAndFiles, SectionWithFiles, Section } from "@/lib/types";

import { deleteSectionAction } from "@/lib/actions";
import { videoProvider } from "@/lib/utils";
import { TeacherSectionForm } from "@/components/teacher/teacher-section-form";
import { TeacherSectionFilesManager } from "@/components/teacher/teacher-section-files-manager";
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
  book: BookWithSectionsAndFiles;
  onChanged: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SectionWithFiles | null>(null);
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

  const countByType = (section: SectionWithFiles, type: string) =>
    section.files.filter((f) => f.type === type).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold">Manage units</h4>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Each unit can have unlimited videos, audios, PDFs and images with names. Use the file manager to organize them.
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
          {/* Mobile: stacked cards */}
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
                    <Video className="size-3 text-red-500" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Videos:</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {countByType(section, "video")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Music className="size-3 text-purple-500" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Audios:</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {countByType(section, "audio")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="size-3 text-emerald-500" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Images:</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {countByType(section, "image")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3 text-blue-500" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">PDFs:</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {countByType(section, "pdf")}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
                  {section.files.slice(0, 3).map((f) => (
                    <Badge key={f.id} variant="outline" className="text-[10px] truncate max-w-[120px]">
                      {f.name}
                    </Badge>
                  ))}
                  {section.files.length > 3 && (
                    <Badge variant="secondary" className="text-[10px]">+{section.files.length - 3} more</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead>Unit title</TableHead>
                  <TableHead className="w-20"><span className="flex items-center gap-1"><Video className="size-3" /> Videos</span></TableHead>
                  <TableHead className="w-20"><span className="flex items-center gap-1"><Music className="size-3" /> Audios</span></TableHead>
                  <TableHead className="w-20"><span className="flex items-center gap-1"><ImageIcon className="size-3" /> Images</span></TableHead>
                  <TableHead className="w-20"><span className="flex items-center gap-1"><FileText className="size-3" /> PDFs</span></TableHead>
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
                      <span className="mt-1 flex flex-wrap gap-1">
                        {section.files.slice(0, 2).map((f) => (
                          <Badge key={f.id} variant="outline" className="text-[9px] px-1 py-0 max-w-[100px] truncate">
                            {f.name}
                          </Badge>
                        ))}
                        {section.files.length > 2 && <Badge variant="secondary" className="text-[9px]">+{section.files.length - 2}</Badge>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={countByType(section, "video") > 0 ? "default" : "secondary"} className="bg-red-500 text-white">
                        {countByType(section, "video")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={countByType(section, "audio") > 0 ? "default" : "secondary"} className="bg-purple-500 text-white">
                        {countByType(section, "audio")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={countByType(section, "image") > 0 ? "default" : "secondary"} className="bg-emerald-500 text-white">
                        {countByType(section, "image")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={countByType(section, "pdf") > 0 ? "default" : "secondary"} className="bg-blue-500 text-white">
                        {countByType(section, "pdf")}
                      </Badge>
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
        Each unit now supports unlimited files. Uploads go to Supabase Storage buckets: <code dir="ltr">covers</code>, <code dir="ltr">images</code>, <code dir="ltr">audio</code> and <code dir="ltr">handouts</code>.
      </p>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add unit</DialogTitle>
            <DialogDescription>
              Enter the unit title. You can add files after creation.
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit unit — {editTarget?.title}</DialogTitle>
            <DialogDescription>
              Update title/order and manage files with names. Unlimited files per type.
            </DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <div className="space-y-6">
              <TeacherSectionForm
                bookId={book.id}
                section={editTarget}
                onDone={refresh}
                compact
              />
              <div className="border-t border-border pt-6">
                <h3 className="mb-4 text-sm font-bold">Files for this unit</h3>
                <TeacherSectionFilesManager
                  sectionId={editTarget.id}
                  bookId={book.id}
                  initialFiles={editTarget.files}
                  onChanged={onChanged}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
