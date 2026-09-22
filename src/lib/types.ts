export type Role = "student" | "teacher";

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  teacher_id: string | null;
  created_at: string;
  sort_order?: number | null;
  /** Joined in queries: display name of the owning teacher */
  teacher_name?: string | null;
  /** Joined in queries: amount of published sections */
  section_count?: number;
}

export interface Section {
  id: string;
  book_id: string;
  title: string;
  video_url: string | null;
  handout_url: string | null;
  /** Lesson image uploaded to the public `images` bucket (or an external link). */
  image_url: string | null;
  /** Comma-separated list of image URLs or a gallery link. */
  images_url?: string | null;
  /** Lesson audio uploaded to the public `audio` bucket (or an external link). */
  audio_url: string | null;
  sort_order: number;
  created_at: string;
}

export type SectionFileType = "video" | "audio" | "pdf" | "image";

export interface SectionFile {
  id: string;
  section_id: string;
  type: SectionFileType;
  name: string;
  url: string;
  sort_order: number;
  created_at: string;
}

/** A book bundled with its ordered sections (book detail page). */
export interface BookWithSections extends Book {
  sections: Section[];
}

export interface SectionWithFiles extends Section {
  files: SectionFile[];
}

export interface BookWithSectionsAndFiles extends Book {
  sections: SectionWithFiles[];
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };
