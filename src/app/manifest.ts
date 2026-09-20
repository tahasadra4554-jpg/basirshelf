import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BasirShelf — Basir Language Institute",
    short_name: "BasirShelf",
    description:
      "The digital library of Basir Language Institute: course books, video lessons and PDF handouts.",
    lang: "en",
    dir: "ltr",
    start_url: "/",
    display: "standalone",
    background_color: "#FDFBF7",
    theme_color: "#1A365D",
    categories: ["education"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
