"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import type { ActionResult, Book } from "@/lib/types";

import { createBookAction, updateBookAction } from "@/lib/actions";
import { MediaField } from "@/components/teacher/media-field";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TeacherBookForm({
  book,
  onDone,
}: {
  book?: Book;
  mode?: "create" | "edit";
  onDone: (message?: string) => void;
}) {
  const action = book ? updateBookAction : createBookAction;
  const [state, formAction, pending] = useActionState<
    ActionResult<Book> | null,
    FormData
  >(action, null);
  const done = useRef(false);

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

  return (
    <form action={formAction} className="space-y-4">
      {book ? <input type="hidden" name="id" value={book.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="book-title">Book title</Label>
        <Input
          id="book-title"
          name="title"
          defaultValue={book?.title ?? ""}
          placeholder="e.g. Interchange 4"
          dir="ltr"
          className="text-start"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="book-description">Description</Label>
        <Textarea
          id="book-description"
          name="description"
          defaultValue={book?.description ?? ""}
          placeholder="What level is this book and what does it cover?"
          rows={4}
        />
      </div>

      <MediaField
        id="book-cover"
        name="cover_image_url"
        label="Cover (upload or link, optional)"
        kind="cover"
        bookId={book?.id}
        accept="image/jpeg,image/png,image/webp"
        defaultValue={book?.cover_image_url ?? ""}
        hint="Upload the cover straight from your device, or paste an image link. Leave it empty and a coloured cover is generated automatically."
      />

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" />
              Saving…
            </>
          ) : book ? (
            "Save changes"
          ) : (
            "Create book"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
