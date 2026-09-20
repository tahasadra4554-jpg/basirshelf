import "server-only";

import type { Book, BookWithSections, Section } from "@/lib/types";

import { createAnonClient, createServiceClient } from "@/lib/supabase/client";
import { withRls } from "@/lib/supabase/rls";

const BOOK_SELECT =
  "id, title, description, cover_image_url, teacher_id, created_at, teacher_name:profiles(full_name)";

type BookRow = Book & {
  teacher_name?: { full_name: string | null } | null;
};

function normalizeBook(row: BookRow): Book {
  const { teacher_name, ...rest } = row;
  return {
    ...(rest as Book),
    teacher_name:
      (Array.isArray(teacher_name)
        ? (teacher_name[0]?.full_name ?? null)
        : (teacher_name?.full_name ?? null)) ?? null,
  };
}

async function attachCounts(books: Book[]): Promise<Book[]> {
  if (books.length === 0) return [];
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("sections")
    .select("book_id")
    .in(
      "book_id",
      books.map((b) => b.id),
    );
  const counts = new Map<string, number>();
  (data ?? []).forEach((row: { book_id: string }) => {
    counts.set(row.book_id, (counts.get(row.book_id) ?? 0) + 1);
  });
  return books.map((book) => ({
    ...book,
    section_count: counts.get(book.id) ?? 0,
  }));
}

function sortSections(sections: Section[]): Section[] {
  return [...sections].sort(
    (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
  );
}

export const supabaseStore = {
  async listBooks(): Promise<Book[]> {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return attachCounts(
      ((data ?? []) as unknown as BookRow[]).map(normalizeBook),
    );
  },

  async getBook(id: string): Promise<BookWithSections | null> {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const book = normalizeBook(data as unknown as BookRow);
    const { data: sections, error: sectionsError } = await supabase
      .from("sections")
      .select("*")
      .eq("book_id", id)
      .order("sort_order", { ascending: true });
    if (sectionsError) throw new Error(sectionsError.message);

    return {
      ...book,
      section_count: sections?.length ?? 0,
      sections: sortSections((sections ?? []) as Section[]),
    };
  },

  /** Every teacher manages the whole catalogue, so this ignores the id. */
  async listBooksByTeacher(teacherId: string): Promise<Book[]> {
    void teacherId;
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return attachCounts(
      ((data ?? []) as unknown as BookRow[]).map(normalizeBook),
    );
  },

  async listSections(bookId: string): Promise<Section[]> {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .eq("book_id", bookId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return sortSections((data ?? []) as Section[]);
  },

  async createBook(input: {
    title: string;
    description?: string | null;
    cover_image_url?: string | null;
    teacher_id: string;
  }): Promise<Book> {
    return withRls("teacher", input.teacher_id, async (client) => {
      const { data, error } = await client
        .from("books")
        .insert({
          title: input.title,
          description: input.description ?? null,
          cover_image_url: input.cover_image_url ?? null,
          teacher_id: input.teacher_id,
        })
        .select("id, title, description, cover_image_url, teacher_id, created_at")
        .single();
      if (error) throw new Error(error.message);
      return {
        ...(data as Book),
        teacher_name: null,
        section_count: 0,
      };
    });
  },

  async updateBook(
    id: string,
    patch: Partial<
      Pick<Book, "title" | "description" | "cover_image_url" | "teacher_id">
    >,
    actorId: string,
  ): Promise<Book | null> {
    return withRls("teacher", actorId, async (client) => {
      const { data, error } = await client
        .from("books")
        .update(patch)
        .eq("id", id)
        .select("id, title, description, cover_image_url, teacher_id, created_at")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? ({ ...data, teacher_name: null } as Book) : null;
    });
  },

  async deleteBook(id: string, actorId: string): Promise<boolean> {
    return withRls("teacher", actorId, async (client) => {
      const { data, error } = await client
        .from("books")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw new Error(error.message);
      return (data?.length ?? 0) > 0;
    });
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
    actorId: string,
  ): Promise<Section> {
    return withRls("teacher", actorId, async (client) => {
      let sortOrder = input.sort_order ?? null;
      if (!sortOrder || sortOrder <= 0) {
        const { data: last } = await client
          .from("sections")
          .select("sort_order")
          .eq("book_id", input.book_id)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        sortOrder = ((last?.sort_order as number | undefined) ?? 0) + 1;
      }

      const row: Record<string, unknown> = {
        book_id: input.book_id,
        title: input.title,
        video_url: input.video_url ?? null,
        handout_url: input.handout_url ?? null,
        image_url: input.image_url ?? input.images_url ?? null,
        images_url: input.images_url ?? input.image_url ?? null,
        audio_url: input.audio_url ?? null,
        sort_order: sortOrder,
      };

      let res = await client.from("sections").insert(row).select("*").single();
      if (res.error && /images_url/i.test(res.error.message)) {
        delete row.images_url;
        res = await client.from("sections").insert(row).select("*").single();
      }
      if (res.error) throw new Error(res.error.message);
      const data = res.data as Section;
      return { ...data, images_url: data.images_url ?? data.image_url ?? null };
    });
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
    actorId: string,
  ): Promise<Section | null> {
    return withRls("teacher", actorId, async (client) => {
      let res = await client
        .from("sections")
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (res.error && /images_url/i.test(res.error.message)) {
        const fallbackPatch = { ...patch } as Record<string, unknown>;
        delete fallbackPatch.images_url;
        if (patch.images_url && !fallbackPatch.image_url) {
          fallbackPatch.image_url = patch.images_url;
        }
        res = await client
          .from("sections")
          .update(fallbackPatch)
          .eq("id", id)
          .select("*")
          .maybeSingle();
      }
      if (res.error) throw new Error(res.error.message);
      const data = (res.data as Section | null) ?? null;
      return data ? { ...data, images_url: data.images_url ?? data.image_url ?? null } : null;
    });
  },

  async deleteSection(id: string, actorId: string): Promise<boolean> {
    return withRls("teacher", actorId, async (client) => {
      const { data, error } = await client
        .from("sections")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw new Error(error.message);
      return (data?.length ?? 0) > 0;
    });
  },

  /** Uploads a handout PDF to the public `handouts` bucket. */
  async uploadMedia(
    file: { name: string; type: string; arrayBuffer: ArrayBuffer },
    bucket: "handouts" | "covers" | "images" | "audio",
    bookId: string,
    actorId: string,
  ): Promise<string> {
    const supabase = createServiceClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${bookId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, Buffer.from(file.arrayBuffer), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    void actorId;
    return data.publicUrl;
  },
};
