import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText, Layers, PlayCircle } from "lucide-react";

import { getDataSource } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { levelForBook } from "@/components/books/book-card";
import { BookCover } from "@/components/books/book-cover";
import { SectionList } from "@/components/books/section-list";
import { Container } from "@/components/site/container";

export const revalidate = 0;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const book = await getDataSource().getBook(id).catch(() => null);
  if (!book) return { title: "Book not found" };

  const level = levelForBook(book.title);
  const description =
    book.description ??
    `${book.title} from the Basir Language Institute library — video lessons and PDF handouts for every unit.`;

  return {
    title: book.title,
    description,
    openGraph: {
      title: `${book.title} — BasirShelf`,
      description,
      type: "article",
      siteName: "BasirShelf",
      locale: "en_US",
      // A branded card rendered per book: cover, title, level, unit count.
      images: [
        {
          url: `/books/${encodeURIComponent(book.id)}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${book.title}${level ? `, ${level}` : ""} — Basir Language Institute`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.title} — BasirShelf`,
      description,
    },
  };
}

export default async function BookDetailPage({ params }: Params) {
  const { id } = await params;

  let book = null;
  try {
    book = await getDataSource().getBook(id);
  } catch {
    book = null;
  }
  if (!book) notFound();

  const level = levelForBook(book.title);
  const ready = book.sections.filter(
    (section) =>
      section.video_url ||
      section.handout_url ||
      section.image_url ||
      section.audio_url,
  );
  // Only link to a unit panel that actually exists — the media panel renders
  // for units that already carry a video, an audio lesson or an image.
  const playableUnit =
    book.sections.find(
      (section) => section.video_url || section.audio_url || section.image_url,
    ) ?? null;

  return (
    <>
      {/* Editorial header */}
      <div className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_10%_0%,#ffffff_0%,#f6f2e9_52%,#efe9dd_100%)] dark:bg-[radial-gradient(110%_80%_at_10%_0%,#1a2440_0%,#101828_55%,#0b1120_100%)]" />
          <div className="bg-grid mask-fade-b absolute inset-0 opacity-50" />
        </div>

        <Container className="py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="transition-colors duration-300 hover:text-foreground"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/#books"
                  className="transition-colors duration-300 hover:text-foreground"
                >
                  Library
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-foreground" aria-current="page">
                {book.title}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1 flex justify-start">
              <div
                data-testid="book-detail-cover"
                className="relative aspect-[3/4] w-[60%] min-w-[180px] max-w-xs md:w-full md:max-w-sm mr-auto overflow-hidden rounded-2xl border border-border shadow-float"
              >
                <BookCover
                  title={book.title}
                  coverImageUrl={book.cover_image_url}
                  level={level}
                  priority
                />
              </div>
            </div>

            <div className="min-w-0 md:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-navy px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-navy-foreground uppercase">
                  Interchange Series
                </span>
                {level ? (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {level}
                  </span>
                ) : null}
                <span className="num-latin inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-foreground">
                  <Layers className="size-3.5 text-indigo-text dark:text-indigo" aria-hidden="true" />
                  {book.sections.length} units
                </span>
                {ready.length > 0 ? (
                  <span className="num-latin inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[11px] font-semibold text-success">
                    <PlayCircle className="size-3.5" aria-hidden="true" />
                    {ready.length} ready to study
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 font-serif text-3xl leading-tight font-semibold tracking-tight text-navy text-balance sm:text-4xl lg:text-5xl">
                {book.title}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-muted-foreground text-pretty sm:text-base">
                {book.description ?? "No description yet."}
              </p>

              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
                <div>
                  <dt className="eyebrow text-muted-foreground">On the shelf since</dt>
                  <dd className="mt-1.5 font-semibold text-foreground">
                    {formatDate(book.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground">Institute</dt>
                  <dd className="mt-1.5 font-semibold text-foreground">
                    Basir Language Institute
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-muted-foreground">Handouts</dt>
                  <dd className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <FileText
                      className="size-3.5 text-indigo-text dark:text-indigo"
                      aria-hidden="true"
                    />
                    PDF, offline-ready
                  </dd>
                </div>
              </dl>

              <div className="mt-8">
                {playableUnit ? (
                  <a
                    href={`#unit-${playableUnit.id}-panel`}
                    className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground shadow-soft transition-all duration-300 hover:bg-navy/90 hover:shadow-float"
                  >
                    Start with {playableUnit.title}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                ) : (
                  <a
                    href="#units"
                    className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground shadow-soft transition-all duration-300 hover:bg-navy/90 hover:shadow-float"
                  >
                    Browse all {book.sections.length} units
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Units */}
      <Container className="py-12 sm:py-16">
        <div
          id="units"
          className="mb-8 flex scroll-mt-32 flex-wrap items-end justify-between gap-3"
        >
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Units
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Listed in course order. Tap the gear dial on any unit to spin and select your lesson media.
            </p>
          </div>
          <Link
            href="/#books"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-text underline-offset-4 transition-colors duration-300 hover:underline dark:text-indigo"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to the library
          </Link>
        </div>

        <SectionList sections={book.sections} bookTitle={book.title} />
      </Container>
    </>
  );
}
