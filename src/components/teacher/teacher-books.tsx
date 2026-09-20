"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BookPlus,
  ChevronDown,
  ExternalLink,
  Layers,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";

import type { Book, BookWithSections } from "@/lib/types";

import { deleteBookAction } from "@/lib/actions";
import { BookCover } from "@/components/books/book-cover";
import { TeacherBookForm } from "@/components/teacher/teacher-book-form";
import { TeacherSectionManager } from "@/components/teacher/teacher-section-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TeacherBooks({ books }: { books: BookWithSections[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Book | null>(null);
  const [expanded, setExpanded] = useState<string | null>(
    books[0]?.id ?? null,
  );
  const [pending, startTransition] = useTransition();

  function handleCreated(message?: string) {
    setCreateOpen(false);
    setEditTarget(null);
    toast.success(message ?? "Saved.");
    router.refresh();
  }

  function handleDelete(book: Book) {
    if (!window.confirm(`Delete “${book.title}” and all of its units?`)) {
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", book.id);
      const result = await deleteBookAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Deleted.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold">Books</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {books.length} books on the shelf — every teacher has access to all of them
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <BookPlus />
          Add book
        </Button>
      </Card>

      {books.length === 0 ? (
        <Card className="p-10 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookPlus className="size-6" />
          </span>
          <p className="mt-4 text-sm font-semibold">No books yet</p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Use “Add book” to create your first shelf, then add its units.

          </p>
          <Button className="mx-auto mt-5" onClick={() => setCreateOpen(true)}>
            <BookPlus />
            Add book
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {books.map((book) => {
            const isOpen = expanded === book.id;
            return (
              <Card key={book.id} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-xl shadow-soft sm:w-20">
                    <BookCover title={book.title} coverImageUrl={book.cover_image_url} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-bold">
                        {book.title}
                      </h3>
                      <Badge variant="soft">
                        <Layers />
                        {book.sections.length} units
                      </Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-muted-foreground">
                      {book.description ?? "No description yet."}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/books/${book.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink />
                        View
                      </a>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" aria-label="Book actions">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setEditTarget(book)}>
                          Edit book
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setExpanded(isOpen ? null : book.id)}
                        >
                          {isOpen ? "Close units" : "Manage units"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(book)}
                          disabled={pending}
                        >
                          {pending ? (
                            <LoaderCircle className="animate-spin" />
                          ) : null}
                          Delete book
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={isOpen ? "Close" : "Open"}
                      onClick={() => setExpanded(isOpen ? null : book.id)}
                    >
                      <ChevronDown
                        className={`transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="border-t border-border bg-muted/40 p-4 sm:p-5">
                    <TeacherSectionManager book={book} onChanged={router.refresh} />
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new book</DialogTitle>
            <DialogDescription>
              Enter a title, a short description and a cover URL. You can add
              the units afterwards.
            </DialogDescription>
          </DialogHeader>
          <TeacherBookForm mode="create" onDone={handleCreated} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => (open ? null : setEditTarget(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit book</DialogTitle>
            <DialogDescription>
              Changes apply immediately on the student-facing book page.
            </DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <TeacherBookForm book={editTarget} onDone={handleCreated} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
