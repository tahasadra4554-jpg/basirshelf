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
    "Master English with the Basir Institute Standard. Structured videos and handouts for every unit of the Interchange series.",
  keywords: [
    "language learning",
    "Interchange",
    "Basir Language Institute",
    "BasirShelf",
    "English course",
    "PDF handouts",
  ],
  openGraph: {
    title: "BasirShelf — Basir Language Institute",
    description:
      "Master English with the Basir Institute Standard. Structured videos and handouts for every unit of the Interchange series.",
    type: "website",
    locale: "en_US",
    siteName: "BasirShelf",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BasirShelf — Basir Language Institute",
    description:
      "Structured videos and handouts for every unit of the Interchange series.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBF7" },
    { media: "(prefers-color-scheme: dark)", color: "#101828" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies the saved theme before React hydrates. Kept inline and tiny so it
 * costs nothing and cannot be deferred behind the bundle.
 */
const THEME_BOOTSTRAP = `(function(){try{var s=localStorage.getItem("basirshelf:theme")||"system";var d=s==="dark"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${playfair.variable}`}
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
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--card-foreground)",
            },
          }}
        />
      </body>
    </html>
  );
}
