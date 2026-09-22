import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

import "./globals.css";

/* Body + UI: geometric sans. Headings + book titles: refined serif. */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  fallback: ["Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://basirshelf.vercel.app"),
  title: {
    default: "BasirShelf — Basir Language Institute",
    template: "%s | BasirShelf",
  },
  description:
    "Master English with the Basir Institute Standard. Structured videos and handouts for every unit of the Interchange and Connect series.",
  keywords: [
    "language learning",
    "Interchange",
    "Connect",
    "Basir Language Institute",
    "BasirShelf",
    "English course",
    "PDF handouts",
  ],
  openGraph: {
    title: "BasirShelf — Basir Language Institute",
    description:
      "Master English with the Basir Institute Standard. Structured videos and handouts for every unit of the Interchange and Connect series.",
    type: "website",
    locale: "en_US",
    siteName: "BasirShelf",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BasirShelf — Basir Language Institute",
    description:
      "Structured videos and handouts for every unit of the Interchange and Connect series.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A1628" },
    { media: "(prefers-color-scheme: light)", color: "#FDFBF7" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies the saved theme before React hydrates.
 * Dark mode is the DEFAULT for all first-time visitors!
 */
const THEME_BOOTSTRAP = `(function(){try{var s=localStorage.getItem("basirshelf:theme")||"dark";var d=s!=="light";var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`dark ${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="paper min-h-dvh bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only-focusable fixed start-4 top-4 z-100 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-navy-foreground shadow-float focus:not-sr-only"
        >
          Skip to main content
        </a>

        <div className="flex min-h-screen w-full flex-col">
          <SiteHeader />
          <main id="main" className="w-full flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>

        <Toaster
          position="top-center"
          dir="ltr"
          closeButton
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
              borderRadius: "14px",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              background: "#0F1B2D",
              color: "#FEF3C7",
            },
          }}
        />
      </body>
    </html>
  );
}
