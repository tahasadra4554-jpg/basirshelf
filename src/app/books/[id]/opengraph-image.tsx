import { ImageResponse } from "@vercel/og";

import { OG_FONTS } from "@/lib/og-fonts";

import { getDataSource } from "@/lib/db";
import { levelForBook } from "@/components/books/book-card";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BasirShelf — Basir Language Institute";
/** Book rows rarely change; keeps the card cheap on every share. */
export const revalidate = 3600;

const CREAM = "#FDFBF7";
const NAVY = "#1A365D";
const INDIGO = "#5A67D8";
const INDIGO_TEXT = "#4C51BF";
const MUTED = "#4E4A45";

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max).lastIndexOf(" ");
  return `${text.slice(0, cut > 40 ? cut : max - 1).trimEnd()}…`;
}

/**
 * Open Graph card for a book, so a link shared on WhatsApp or Telegram shows
 * the cover, title, level and unit count instead of a bare URL.
 */
export default async function BookOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getDataSource().getBook(id).catch(() => null);

  const title = book?.title ?? "BasirShelf";
  const level = book ? levelForBook(book.title) : null;
  const units = book?.sections.length ?? 0;
  const description = book?.description
    ? clip(book.description, 118)
    : "Structured videos and handouts for every unit of the Interchange series.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: CREAM,
          fontFamily: "Inter",
          color: "#16233A",
        }}
      >
        {/* Cover panel */}
        <div
          style={{
            width: 420,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 52,
            background: NAVY,
            color: CREAM,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 19,
              letterSpacing: 3,
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            Interchange Series
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {book?.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover_image_url}
                alt=""
                width={316}
                height={300}
                style={{
                  width: 316,
                  height: 300,
                  objectFit: "cover",
                  borderRadius: 12,
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 58,
                  lineHeight: 1.15,
                  fontFamily: "Playfair Display",
                  fontWeight: 700,
                }}
              >
                {title}
              </div>
            )}
            <div
              style={{
                display: "flex",
                width: 96,
                height: 6,
                borderRadius: 3,
                background: INDIGO,
                marginTop: 26,
              }}
            />
          </div>
        </div>

        {/* Text panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 58,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 19,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: INDIGO_TEXT,
                fontWeight: 600,
              }}
            >
              Basir Language Institute
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 74,
                lineHeight: 1.08,
                fontFamily: "Playfair Display",
                fontWeight: 700,
                color: NAVY,
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 25,
                lineHeight: 1.5,
                color: MUTED,
                maxWidth: 620,
              }}
            >
              {description}
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {level ? (
              <div
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "#EEF1F7",
                  color: NAVY,
                  fontSize: 21,
                  fontWeight: 600,
                }}
              >
                {level}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                background: "#ECEEFB",
                color: INDIGO_TEXT,
                fontSize: 21,
                fontWeight: 600,
              }}
            >
              {units} units · video + PDF handout
            </div>
            <div
              style={{
                display: "flex",
                marginLeft: "auto",
                fontSize: 21,
                color: MUTED,
                fontWeight: 600,
              }}
            >
              basirshelf.vercel.app
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [...OG_FONTS] },
  );
}
