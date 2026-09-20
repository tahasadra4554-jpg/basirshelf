import { redirect } from "next/navigation";
import { Library } from "lucide-react";

import type { BookWithSections } from "@/lib/types";

import { getDataSource, usesSupabase } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { TeacherBooks } from "@/components/teacher/teacher-books";
import { SignOutButton } from "@/components/teacher/sign-out-button";
import { Container } from "@/components/site/container";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/teacher-login");

  let books: BookWithSections[] = [];
  let loadError: string | null = null;
  try {
    // Every teacher has equal access, so the panel always shows the whole
    // catalogue rather than only the books one teacher created.
    const catalogue = await getDataSource().listBooks();
    books = await Promise.all(
      catalogue.map(async (book): Promise<BookWithSections> => {
        const full = await getDataSource().getBook(book.id);
        return full ?? { ...book, sections: [] };
      }),
    );
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load books.";
  }

  return (
    <Container className="py-10 sm:py-14">
      <header className="border-b border-border pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-indigo-text dark:text-indigo">
              Teacher workspace
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Manage the shelf
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{session.name}</span>
              <Badge variant="soft">role: teacher</Badge>
              <Badge variant={usesSupabase() ? "success" : "secondary"}>
                {usesSupabase()
                  ? "Connected to Supabase"
                  : "Dev mode (local file)"}
              </Badge>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="num-latin inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-soft">
              <Library
                className="size-4 text-indigo-text dark:text-indigo"
                aria-hidden="true"
              />
              {books.length} books
            </span>
            <SignOutButton />
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
          All teachers share one catalogue: you can edit or extend any book,
          not only the ones you created. Add units in course order and attach a
          video link and a PDF handout when they are ready.
        </p>
      </header>

      <div className="mt-8">
        {loadError ? (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6"
          >
            <h2 className="font-serif text-lg font-semibold text-destructive">
              The books could not be loaded
            </h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {loadError}
            </p>
          </div>
        ) : (
          <TeacherBooks books={books} />
        )}
      </div>
    </Container>
  );
}
