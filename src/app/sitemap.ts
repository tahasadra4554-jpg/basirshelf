import type { MetadataRoute } from "next";

import { getDataSource } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://basirshelf.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/signup`, changeFrequency: "yearly", priority: 0.5 },
    // /teacher and /teacher-login stay out of the sitemap (staff only)
  ];

  try {
    const books = await getDataSource().listBooks();
    return [
      ...staticEntries,
      ...books.map((book) => ({
        url: `${BASE}/books/${book.id}`,
        lastModified: new Date(book.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Never let a sitemap crash the build; fall back to the static routes.
    return staticEntries;
  }
}
