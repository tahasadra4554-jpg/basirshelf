import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { Book, BookWithSections, Section, SectionFile, SectionWithFiles, BookWithSectionsAndFiles } from "@/lib/types";

/**
 * File-backed data store used when Supabase is not configured yet.
 */

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface LocalDb {
  profiles: {
    id: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }[];
  books: Book[];
  sections: Section[];
  section_files: SectionFile[];
}

function seedTemplate(): LocalDb {
  return { profiles: [], books: [], sections: [], section_files: [] };
}

function read(): LocalDb {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    return {
      profiles: parsed.profiles ?? [],
      books: parsed.books ?? [],
      sections: parsed.sections ?? [],
      section_files: (parsed as any).section_files ?? [],
    };
  } catch {
    const fresh = seedTemplate();
    write(fresh);
    return fresh;
  }
}

function write(db: LocalDb) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + "\n", "utf8");
}

function withTeacherName(db: LocalDb, books: Book[]): Book[] {
  return books.map((book) => {
    const teacher = db.profiles.find((p) => p.id === book.teacher_id);
    return {
      ...book,
      teacher_name: teacher?.full_name ?? null,
      section_count: db.sections.filter((s) => s.book_id === book.id).length,
    };
  });
}

function sortSections(sections: Section[]): Section[] {
  return [...sections].sort(
    (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
  );
}

function sortFiles(files: SectionFile[]): SectionFile[] {
  return [...files].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
}

function filesFromLegacySection(section: Section): SectionFile[] {
  const files: SectionFile[] = [];
  const now = new Date().toISOString();
  if (section.video_url && section.video_url.trim()) {
    files.push({
      id: `legacy-video-${section.id}`,
      section_id: section.id,
      type: "video",
      name: `${section.title} - Video`,
      url: section.video_url,
      sort_order: 0,
      created_at: now,
    });
  }
  if (section.audio_url && section.audio_url.trim()) {
    files.push({
      id: `legacy-audio-${section.id}`,
      section_id: section.id,
      type: "audio",
      name: `${section.title} - Audio`,
      url: section.audio_url,
      sort_order: 0,
      created_at: now,
    });
  }
  if (section.handout_url && section.handout_url.trim()) {
    files.push({
      id: `legacy-pdf-${section.id}`,
      section_id: section.id,
      type: "pdf",
      name: `${section.title} - Handout`,
      url: section.handout_url,
      sort_order: 0,
      created_at: now,
    });
  }
  const rawImages = (section as any).images_url || section.image_url;
  if (rawImages && rawImages.trim()) {
    const urls = rawImages.split(",").map((s: string) => s.trim()).filter(Boolean);
    urls.forEach((url: string, idx: number) => {
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) return;
      files.push({
        id: `legacy-image-${section.id}-${idx}`,
        section_id: section.id,
        type: "image",
        name: urls.length > 1 ? `${section.title} - Image ${idx + 1}` : `${section.title} - Image`,
        url,
        sort_order: idx,
        created_at: now,
      });
    });
  }
  return files;
}

export const localStore = {
  async listBooks(): Promise<Book[]> {
    const db = read();
    return withTeacherName(
      db,
      [...db.books].sort(
        (a, b) =>
          (a.sort_order ?? 999) - (b.sort_order ?? 999) ||
          a.title.localeCompare(b.title),
      ),
    );
  },

  async getBook(id: string): Promise<BookWithSections | null> {
    const db = read();
    const book = db.books.find((b) => b.id === id);
    if (!book) return null;
    const [enriched] = withTeacherName(db, [book]);
    return {
      ...enriched,
      sections: sortSections(
        db.sections.filter((section) => section.book_id === id),
      ),
    };
  },

  async getBookWithFiles(id: string): Promise<BookWithSectionsAndFiles | null> {
    const db = read();
    const book = db.books.find((b) => b.id === id);
    if (!book) return null;
    const [enriched] = withTeacherName(db, [book]);
    const sectionList = sortSections(db.sections.filter((s) => s.book_id === id));
    const sectionsWithFiles: SectionWithFiles[] = sectionList.map((section) => {
      let sectionFiles = db.section_files.filter((f) => f.section_id === section.id);
      if (sectionFiles.length === 0) {
        sectionFiles = filesFromLegacySection(section);
      }
      return {
        ...section,
        files: sortFiles(sectionFiles),
      };
    });
    return {
      ...enriched,
      sections: sectionsWithFiles,
    };
  },

  /** Every teacher manages the whole catalogue, so this ignores the id. */
  async listBooksByTeacher(teacherId: string): Promise<Book[]> {
    void teacherId;
    const db = read();
    return withTeacherName(
      db,
      [...db.books].sort(
        (a, b) =>
          (a.sort_order ?? 999) - (b.sort_order ?? 999) ||
          a.title.localeCompare(b.title),
      ),
    );
  },

  async listSections(bookId: string): Promise<Section[]> {
    return sortSections(read().sections.filter((s) => s.book_id === bookId));
  },

  async listSectionFiles(sectionId: string): Promise<SectionFile[]> {
    const db = read();
    let files = db.section_files.filter((f) => f.section_id === sectionId);
    if (files.length === 0) {
      const section = db.sections.find((s) => s.id === sectionId);
      if (section) files = filesFromLegacySection(section);
    }
    return sortFiles(files);
  },

  async listFilesByBook(bookId: string): Promise<SectionFile[]> {
    const db = read();
    const sections = db.sections.filter((s) => s.book_id === bookId);
    const ids = new Set(sections.map((s) => s.id));
    let files = db.section_files.filter((f) => ids.has(f.section_id));
    if (files.length === 0) {
      files = sections.flatMap((s) => filesFromLegacySection(s));
    }
    return sortFiles(files);
  },

  async createBook(input: {
    title: string;
    description?: string | null;
    cover_image_url?: string | null;
    teacher_id: string;
  }): Promise<Book> {
    const db = read();
    const book: Book = {
      id: randomUUID(),
      title: input.title,
      description: input.description ?? null,
      cover_image_url: input.cover_image_url ?? null,
      teacher_id: input.teacher_id,
      created_at: new Date().toISOString(),
    };
    db.books.push(book);
    write(db);
    return { ...book, teacher_name: null, section_count: 0 };
  },

  async updateBook(
    id: string,
    patch: Partial<
      Pick<Book, "title" | "description" | "cover_image_url" | "teacher_id">
    >,
    _actorId?: string,
  ): Promise<Book | null> {
    const db = read();
    const index = db.books.findIndex((b) => b.id === id);
    if (index === -1) return null;
    db.books[index] = { ...db.books[index], ...patch };
    write(db);
    return withTeacherName(db, [db.books[index]])[0] ?? null;
  },

  async deleteBook(id: string, _actorId?: string): Promise<boolean> {
    const db = read();
    const before = db.books.length;
    const sectionIds = db.sections.filter((s) => s.book_id === id).map((s) => s.id);
    db.books = db.books.filter((b) => b.id !== id);
    db.sections = db.sections.filter((s) => s.book_id !== id);
    db.section_files = db.section_files.filter((f) => !sectionIds.includes(f.section_id));
    write(db);
    return db.books.length < before;
  },

  async createSection(
    input: {
      book_id: string;
      title: string;
      video_url?: string | null;
      handout_url?: string | null;
      image_url?: string | null;
      images_url?: string | null;
      audio_url?: string | null;
      sort_order?: number | null;
    },
    _actorId?: string,
  ): Promise<Section> {
    const db = read();
    const siblings = db.sections.filter((s) => s.book_id === input.book_id);
    const nextOrder =
      input.sort_order && input.sort_order > 0
        ? input.sort_order
        : (siblings.reduce((max, s) => Math.max(max, s.sort_order), 0) ?? 0) + 1;

    const section: Section = {
      id: randomUUID(),
      book_id: input.book_id,
      title: input.title,
      video_url: input.video_url ?? null,
      handout_url: input.handout_url ?? null,
      image_url: input.image_url ?? null,
      images_url: input.images_url ?? input.image_url ?? null,
      audio_url: input.audio_url ?? null,
      sort_order: nextOrder,
      created_at: new Date().toISOString(),
    };
    db.sections.push(section);
    write(db);
    return section;
  },

  async updateSection(
    id: string,
    patch: Partial<
      Pick<
        Section,
        | "title"
        | "video_url"
        | "handout_url"
        | "image_url"
        | "images_url"
        | "audio_url"
        | "sort_order"
      >
    >,
    _actorId?: string,
  ): Promise<Section | null> {
    const db = read();
    const index = db.sections.findIndex((s) => s.id === id);
    if (index === -1) return null;
    db.sections[index] = { ...db.sections[index], ...patch };
    write(db);
    return db.sections[index] ?? null;
  },

  async deleteSection(id: string, _actorId?: string): Promise<boolean> {
    const db = read();
    const before = db.sections.length;
    db.sections = db.sections.filter((s) => s.id !== id);
    db.section_files = db.section_files.filter((f) => f.section_id !== id);
    write(db);
    return db.sections.length < before;
  },

  async createSectionFile(
    input: { section_id: string; type: string; name: string; url: string; sort_order?: number | null },
    _actorId?: string,
  ): Promise<SectionFile> {
    const db = read();
    const file: SectionFile = {
      id: randomUUID(),
      section_id: input.section_id,
      type: input.type as any,
      name: input.name,
      url: input.url,
      sort_order: input.sort_order ?? 0,
      created_at: new Date().toISOString(),
    };
    db.section_files.push(file);
    write(db);
    return file;
  },

  async updateSectionFile(
    id: string,
    patch: Partial<Pick<SectionFile, "name" | "url" | "sort_order" | "type">>,
    _actorId?: string,
  ): Promise<SectionFile | null> {
    const db = read();
    const idx = db.section_files.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    db.section_files[idx] = { ...db.section_files[idx], ...patch } as SectionFile;
    write(db);
    return db.section_files[idx];
  },

  async deleteSectionFile(id: string, _actorId?: string): Promise<boolean> {
    const db = read();
    const before = db.section_files.length;
    db.section_files = db.section_files.filter((f) => f.id !== id);
    write(db);
    return db.section_files.length < before;
  },

  /** Local mode has no object storage — the message is surfaced to the teacher. */
  async uploadMedia(
    _file: { name: string; type: string; arrayBuffer: ArrayBuffer },
    _bucket: "handouts" | "covers" | "images" | "audio",
    _bookId: string,
    _actorId: string,
  ): Promise<string> {
    throw new Error(
      "File uploads require a Supabase Storage connection (set the environment variables).",
    );
  },
};
