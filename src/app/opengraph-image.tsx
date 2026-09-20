import { ImageResponse } from "@vercel/og";

import { OG_FONTS } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BasirShelf — Basir Language Institute";

const CREAM = "#FDFBF7";
const NAVY = "#1A365D";
const INDIGO = "#5A67D8";
const INDIGO_TEXT = "#4C51BF";
const MUTED = "#4E4A45";

/** Site-level Open Graph card. */
export default async function SiteOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: CREAM,
          fontFamily: "Inter",
          color: "#16233A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: NAVY,
              alignItems: "center",
              justifyContent: "center",
              color: CREAM,
              fontSize: 28,
              fontFamily: "Playfair Display",
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: MUTED,
              fontWeight: 600,
            }}
          >
            Basir Language Institute
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              lineHeight: 1.06,
              fontFamily: "Playfair Display",
              fontWeight: 700,
              color: NAVY,
              maxWidth: 980,
            }}
          >
            Master English with the Basir Institute Standard.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 28,
              lineHeight: 1.5,
              color: MUTED,
              maxWidth: 860,
            }}
          >
            Structured videos and handouts for every unit of the Interchange
            series.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[
            "Interchange 1 · Elementary",
            "Interchange 2 · Pre-Intermediate",
            "Interchange 3 · Intermediate",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 999,
                background: "#EEF1F7",
                color: NAVY,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: 22,
              color: INDIGO_TEXT,
              fontWeight: 600,
            }}
          >
            basirshelf.vercel.app
          </div>
        </div>

        <div
          style={{
            display: "flex",
            position: "absolute",
            right: 0,
            top: 0,
            width: 8,
            height: "100%",
            background: INDIGO,
          }}
        />
      </div>
    ),
    { ...size, fonts: [...OG_FONTS] },
  );
}
