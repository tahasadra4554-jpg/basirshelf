import { Database, TriangleAlert } from "lucide-react";

import type { Book } from "@/lib/types";

import { degraded, getDataSource, lastError, usesSupabase } from "@/lib/db";

import { BookShelf } from "@/components/books/book-shelf";
import { HomeHero } from "@/components/home/home-hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyTrust } from "@/components/home/why-trust";
import { Container } from "@/components/site/container";

export const revalidate = 0;

export default async function HomePage() {
  let books: Book[] = [];
  let loadError: string | null = null;

  try {
    books = await getDataSource().listBooks();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load books.";
  }

  const totalSections = books.reduce(
    (sum, book) => sum + (book.section_count ?? 0),
    0,
  );
  const isDegraded = usesSupabase() && degraded();

  return (
    <>
      <HomeHero bookCount={books.length} unitCount={totalSections} />

      {isDegraded ? (
        <Container className="pt-8">
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-card px-5 py-4 text-sm shadow-soft text-foreground"
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-foreground">
                Showing the local sample catalogue — the database could not be
                reached.
              </p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                <code>supabase/schema.sql</code> has not been applied to the
                Supabase project yet. Teacher changes will not be saved until
                then.
              </p>
              {lastError() ? (
                <p
                  className="mt-1.5 truncate text-[11px] text-muted-foreground"
                  title={lastError() ?? ""}
                >
                  {lastError()}
                </p>
              ) : null}
            </div>
          </div>
        </Container>
      ) : usesSupabase() ? (
        <Container className="pt-8">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3.5 py-1 text-xs font-semibold text-[#92400E] dark:text-[#FBBF24]">
            <Database className="size-3.5 text-[#F59E0B]" aria-hidden="true" />
            Live catalogue from Supabase
          </p>
        </Container>
      ) : null}

      <Container className="scroll-mt-24 py-14 sm:py-20" id="books">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow text-[#B45309] dark:text-[#FBBF24]">
            Course library
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#1A365D] dark:text-[#FCD34D] text-balance sm:text-4xl">
            Six books, one clear path
          </h2>
          <div className="amber-rule" />
          <p className="mt-4 text-sm leading-8 text-muted-foreground text-pretty sm:text-base">
            Start with Interchange 1 or Connect 1 and move up as you are ready.
            Open any book to see every unit, its video lesson and its PDF
            handout.
          </p>
        </div>

        {loadError ? (
          <div
            role="alert"
            className="mx-auto max-w-md rounded-2xl border border-destructive/40 bg-card p-6 text-center"
          >
            <h3 className="font-serif text-lg font-semibold text-destructive">
              The books could not be loaded
            </h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {loadError}
            </p>
          </div>
        ) : (
          <BookShelf books={books} />
        )}
      </Container>

      <WhyTrust />

      <HowItWorks />
    </>
  );
}
