import "server-only";

import type { Book, BookWithSections, Section } from "@/lib/types";

import { localStore } from "@/lib/db/local";
import { supabaseStore } from "@/lib/db/supabase-store";

/**
 * Reads prefer Supabase and transparently fall back to the local seed store,
 * so the catalogue stays visible while the project is being set up (schema not
 * applied yet, network blip, wrong keys). `degraded()` tells the UI that the
 * data is not coming from the database.
 */

let lastReadError: string | null = null;

async function preferSupabase<T>(work: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    const result = await work();
    lastReadError = null;
    return result;
  } catch (error) {
    lastReadError = error instanceof Error ? error.message : String(error);
    return fallback();
  }
}

export function degraded(): boolean {
  return lastReadError !== null;
}

export function lastError(): string | null {
  return lastReadError;
}

export const resilientStore = {
  listBooks: () =>
    preferSupabase(
      () => supabaseStore.listBooks(),
      () => localStore.listBooks(),
    ),

  getBook: (id: string) =>
    preferSupabase(
      () => supabaseStore.getBook(id),
      () => localStore.getBook(id),
    ),

  listBooksByTeacher: (teacherId: string) =>
    preferSupabase(
      () => supabaseStore.listBooksByTeacher(teacherId),
      () => localStore.listBooksByTeacher(teacherId),
    ),

  listSections: (bookId: string) =>
    preferSupabase(
      () => supabaseStore.listSections(bookId),
      () => localStore.listSections(bookId),
    ),

  // Writes never fall back silently — the teacher must see the real error.
  createBook: (input: Parameters<typeof supabaseStore.createBook>[0]) =>
    supabaseStore.createBook(input),

  updateBook: (
    id: string,
    patch: Parameters<typeof supabaseStore.updateBook>[1],
    actorId: string,
  ) => supabaseStore.updateBook(id, patch, actorId),

  deleteBook: (id: string, actorId: string) =>
    supabaseStore.deleteBook(id, actorId),

  createSection: (
    input: Parameters<typeof supabaseStore.createSection>[0],
    actorId: string,
  ) => supabaseStore.createSection(input, actorId),

  updateSection: (
    id: string,
    patch: Parameters<typeof supabaseStore.updateSection>[1],
    actorId: string,
  ) => supabaseStore.updateSection(id, patch, actorId),

  deleteSection: (id: string, actorId: string) =>
    supabaseStore.deleteSection(id, actorId),

  uploadMedia: (
    file: Parameters<typeof supabaseStore.uploadMedia>[0],
    bucket: Parameters<typeof supabaseStore.uploadMedia>[1],
    bookId: string,
    actorId: string,
  ) => supabaseStore.uploadMedia(file, bucket, bookId, actorId),
};

export type DataSource = typeof resilientStore;

export type { Book, BookWithSections, Section };
