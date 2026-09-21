"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult, Book, Section } from "@/lib/types";

import { getDataSource, usesSupabase } from "@/lib/db";
import { createSessionCookie, destroySessionCookie, getSession } from "@/lib/session";
import { findTeacherByUsername, STUDENT_ROLE } from "@/lib/teachers";
import { isSafeExternalUrl } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/client";

const urlField = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || isSafeExternalUrl(value), {
    message: "The link must start with http or https.",
  });

const bookSchema = z.object({
  title: z.string().trim().min(2, "The book title is too short.").max(120),
  description: z.string().trim().max(1000).optional(),
  cover_image_url: urlField,
});

const sectionSchema = z.object({
  title: z.string().trim().min(2, "The unit title is too short.").max(160),
  video_url: urlField,
  handout_url: urlField,
  image_url: urlField,
  images_url: z.string().trim().optional(),
  audio_url: urlField,
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
});

const credentialsSchema = z.object({
  username: z.string().trim().min(3, "Enter your username."),
  password: z.string().min(6, "The password is too short."),
});

const emailPasswordSchema = z.object({
  email: z.string().trim().email("That email is not valid."),
  password: z.string().min(6, "The password must be at least 6 characters."),
  full_name: z.string().trim().min(2, "Enter your full name.").optional(),
});

function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

export async function teacherLoginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Validation error");

  const account = findTeacherByUsername(parsed.data.username);
  if (!account || account.password !== parsed.data.password) {
    return fail("Incorrect username or password.");
  }

  await createSessionCookie({
    sub: account.id,
    username: account.username,
    name: account.full_name,
    role: "teacher",
  });

  revalidatePath("/", "layout");
  return { ok: true, message: `Welcome, ${account.full_name}` };
}

export async function getCurrentUserAction(): Promise<{
  email: string;
  name: string | null;
  role: string;
} | null> {
  // 1. Try server client Supabase auth
  if (usesSupabase()) {
    try {
      const serverClient = await createSupabaseServerClient();
      const { data } = await serverClient.auth.getUser();
      if (data?.user) {
        const meta = (data.user.user_metadata ?? {}) as {
          full_name?: string | null;
          role?: string | null;
        };
        return {
          email: data.user.email ?? "",
          name: meta.full_name ?? data.user.email ?? null,
          role: meta.role === "teacher" ? "teacher" : "student",
        };
      }
    } catch {
      // Ignore
    }
  }

  // 2. Try session cookie (e.g. teachers or local session)
  const session = await getSession();
  if (session) {
    return {
      email: session.username ? `${session.username}@basir.internal` : "",
      name: session.name,
      role: session.role,
    };
  }

  return null;
}

export async function studentSignUpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Validation error");

  if (!usesSupabase()) {
    return fail(
      "Sign-up requires a Supabase connection. Set the environment variables in .env.local.",
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const password = parsed.data.password;
  const fullName = parsed.data.full_name?.trim() || null;

  const serverClient = await createSupabaseServerClient();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let createdUser = false;
  let userId: string | null = null;

  // 1. Try to create user via Service Role Admin (auto-confirms email so student never gets blocked by "Email not confirmed")
  if (serviceKey) {
    try {
      const serviceClient = createServiceClient();
      const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: STUDENT_ROLE,
        },
      });

      if (!createError && createData?.user) {
        createdUser = true;
        userId = createData.user.id;
      } else if (createError) {
        const msg = createError.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists") || (createError as any).status === 422) {
          return fail("این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد شوید.");
        }
      }
    } catch (adminErr) {
      console.error("Admin user creation failed, falling back to standard signUp:", adminErr);
    }
  }

  // 2. Fallback to standard signUp if not created via admin
  if (!createdUser) {
    const { data: signUpData, error: signUpError } = await serverClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: STUDENT_ROLE,
        },
      },
    });

    if (signUpError) {
      return fail(translateAuthError(signUpError.message));
    }

    userId = signUpData?.user?.id ?? null;

    // If unconfirmed, attempt auto-confirm with service role
    if (serviceKey && userId) {
      try {
        const serviceClient = createServiceClient();
        await serviceClient.auth.admin.updateUserById(userId, { email_confirm: true });
      } catch {}
    }
  }

  // 3. Immediately sign in the newly registered user to establish session cookies in browser
  let { data: signInData, error: signInError } = await serverClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError && serviceKey) {
    // If signin fails because email wasn't confirmed, auto-confirm and retry
    try {
      const serviceClient = createServiceClient();
      const linkRes = await serviceClient.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (linkRes.data?.user?.id) {
        await serviceClient.auth.admin.updateUserById(linkRes.data.user.id, { email_confirm: true });
        const retry = await serverClient.auth.signInWithPassword({ email, password });
        signInData = retry.data;
        signInError = retry.error;
      }
    } catch {}
  }

  // 4. Also set the app session cookie
  const activeUserId = userId ?? signInData?.user?.id;
  if (activeUserId) {
    await createSessionCookie({
      sub: activeUserId,
      name: fullName ?? email.split("@")[0],
      role: "student",
    });
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "حساب کاربری شما با موفقیت ایجاد شد و وارد شدید. خوش آمدید!" };
}

export async function studentLoginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = emailPasswordSchema
    .omit({ full_name: true })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Validation error");

  if (!usesSupabase()) {
    return fail(
      "Sign-in requires a Supabase connection. Set the environment variables in .env.local.",
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const password = parsed.data.password;
  const serverClient = await createSupabaseServerClient();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let { data, error } = await serverClient.auth.signInWithPassword({
    email,
    password,
  });

  // If Supabase rejected because email was unconfirmed, auto-confirm it using admin API and retry!
  if (error && (error.message.includes("not confirmed") || error.message.includes("Email not confirmed"))) {
    if (serviceKey) {
      try {
        const serviceClient = createServiceClient();
        const linkRes = await serviceClient.auth.admin.generateLink({
          type: "magiclink",
          email,
        });
        if (linkRes.data?.user?.id) {
          await serviceClient.auth.admin.updateUserById(linkRes.data.user.id, {
            email_confirm: true,
          });
          // Retry signing in now that email is confirmed!
          const retry = await serverClient.auth.signInWithPassword({
            email,
            password,
          });
          data = retry.data;
          error = retry.error;
        }
      } catch (confirmErr) {
        console.error("Auto-confirm on login failed:", confirmErr);
      }
    }
  }

  if (error) return fail(translateAuthError(error.message));

  // Also set the app session cookie for unified session state
  if (data?.user) {
    const meta = (data.user.user_metadata ?? {}) as {
      full_name?: string | null;
      role?: string | null;
    };
    await createSessionCookie({
      sub: data.user.id,
      name: meta.full_name ?? data.user.email?.split("@")[0] ?? "Student",
      role: meta.role === "teacher" ? "teacher" : "student",
    });
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "با موفقیت وارد شدید." };
}

export async function signOutAction(): Promise<ActionResult> {
  await destroySessionCookie();
  if (usesSupabase()) {
    try {
      const serverClient = await createSupabaseServerClient();
      await serverClient.auth.signOut();
    } catch {}
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "با موفقیت خارج شدید." };
}

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials"))
    return "ایمیل یا رمز عبور اشتباه است.";
  if (message.includes("already registered") || message.includes("already exists"))
    return "این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد شوید.";
  if (message.includes("Password should be") || message.includes("least 6 characters"))
    return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
  if (message.includes("Email address") && message.includes("is invalid"))
    return "فرمت ایمیل نامعتبر است. لطفاً یک ایمیل معتبر وارد کنید.";
  if (message.includes("Email not confirmed"))
    return "ایمیل تأیید نشده است. لطفاً مجدداً تلاش کنید.";
  if (message.includes("rate limit"))
    return "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.";
  return message;
}

/* ------------------------------------------------------------------ *
 * Books
 * ------------------------------------------------------------------ */

export async function createBookAction(
  _prev: ActionResult<Book> | null,
  formData: FormData,
): Promise<ActionResult<Book>> {
  try {
    const session = await requireTeacherFromCookie();
    const parsed = bookSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      cover_image_url: formData.get("cover_image_url"),
    });
    if (!parsed.success)
      return fail(parsed.error.issues[0]?.message ?? "Validation error");

    const book = await getDataSource().createBook({
      title: parsed.data.title,
      description: parsed.data.description || null,
      cover_image_url: parsed.data.cover_image_url || null,
      teacher_id: session.sub,
    });

    revalidatePath("/teacher");
    revalidatePath(`/books/${book.id}`);
    revalidatePath("/");
    return { ok: true, data: book, message: `Book “${book.title}” created.` };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function updateBookAction(
  _prev: ActionResult<Book> | null,
  formData: FormData,
): Promise<ActionResult<Book>> {
  try {
    const session = await requireTeacherFromCookie();
    const id = String(formData.get("id") ?? "");
    if (!id) return fail("Invalid book id.");

    const parsed = bookSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      cover_image_url: formData.get("cover_image_url"),
    });
    if (!parsed.success)
      return fail(parsed.error.issues[0]?.message ?? "Validation error");

    const existing = await getDataSource().getBook(id);
    if (!existing) return fail("Book not found.");

    const book = await getDataSource().updateBook(
      id,
      {
        title: parsed.data.title,
        description: parsed.data.description || null,
        cover_image_url: parsed.data.cover_image_url || null,
      },
      session.sub,
    );

    if (!book) return fail("Could not update the book.");

    revalidatePath("/teacher");
    revalidatePath(`/books/${id}`);
    revalidatePath("/");
    return { ok: true, data: book, message: "Book updated." };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function deleteBookAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireTeacherFromCookie();
    const id = String(formData.get("id") ?? "");
    if (!id) return fail("Invalid book id.");

    const existing = await getDataSource().getBook(id);
    if (!existing) return fail("Book not found.");

    const deleted = await getDataSource().deleteBook(id, session.sub);

    if (!deleted) return fail("Could not delete the book.");

    revalidatePath("/teacher");
    revalidatePath("/");
    return { ok: true, message: "The book and its units were deleted." };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

export async function createSectionAction(
  _prev: ActionResult<Section> | null,
  formData: FormData,
): Promise<ActionResult<Section>> {
  try {
    const session = await requireTeacherFromCookie();
    const bookId = String(formData.get("book_id") ?? "");
    if (!bookId) return fail("No book selected.");

    const parsed = sectionSchema.safeParse({
      title: formData.get("title"),
      video_url: formData.get("video_url"),
      handout_url: formData.get("handout_url"),
      image_url: formData.get("image_url"),
      audio_url: formData.get("audio_url"),
      sort_order: formData.get("sort_order"),
    });
    if (!parsed.success)
      return fail(parsed.error.issues[0]?.message ?? "Validation error");

    const book = await getDataSource().getBook(bookId);
    if (!book) return fail("Book not found.");

    const section = await getDataSource().createSection(
      {
        book_id: bookId,
        title: parsed.data.title,
        video_url: parsed.data.video_url || null,
        handout_url: parsed.data.handout_url || null,
        image_url: parsed.data.image_url || null,
        images_url: parsed.data.images_url || null,
        audio_url: parsed.data.audio_url || null,
        sort_order: parsed.data.sort_order || null,
      },
      session.sub,
    );

    revalidatePath(`/books/${bookId}`);
    revalidatePath("/teacher");
    return { ok: true, data: section, message: `Unit “${section.title}” added.` };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function updateSectionAction(
  _prev: ActionResult<Section> | null,
  formData: FormData,
): Promise<ActionResult<Section>> {
  try {
    const session = await requireTeacherFromCookie();
    const id = String(formData.get("id") ?? "");
    if (!id) return fail("Invalid unit id.");

    const parsed = sectionSchema.safeParse({
      title: formData.get("title"),
      video_url: formData.get("video_url"),
      handout_url: formData.get("handout_url"),
      image_url: formData.get("image_url"),
      audio_url: formData.get("audio_url"),
      sort_order: formData.get("sort_order"),
    });
    if (!parsed.success)
      return fail(parsed.error.issues[0]?.message ?? "Validation error");

    const sections = await allSections();
    const target = sections.find((s) => s.id === id);
    if (!target) return fail("Unit not found.");

    const book = await getDataSource().getBook(target.book_id);
    if (!book) return fail("Book not found.");

    const patch = {
      title: parsed.data.title,
      video_url: parsed.data.video_url || null,
      handout_url: parsed.data.handout_url || null,
      image_url: parsed.data.image_url || null,
      images_url: parsed.data.images_url || null,
      audio_url: parsed.data.audio_url || null,
      sort_order: parsed.data.sort_order ?? target.sort_order,
    };

    const section = await getDataSource().updateSection(id, patch, session.sub);

    if (!section) return fail("Could not update the unit.");

    revalidatePath(`/books/${section.book_id}`);
    revalidatePath("/teacher");
    return { ok: true, data: section, message: "Unit updated." };
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function deleteSectionAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireTeacherFromCookie();
    const id = String(formData.get("id") ?? "");
    const bookId = String(formData.get("book_id") ?? "");
    if (!id) return fail("Invalid unit id.");

    const book = await getDataSource().getBook(bookId);
    if (!book) return fail("Book not found.");

    const deleted = await getDataSource().deleteSection(id, session.sub);

    if (!deleted) return fail("Could not delete the unit.");

    revalidatePath(`/books/${bookId}`);
    revalidatePath("/teacher");
    return { ok: true, message: "Unit deleted." };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/**
 * Uploads a teacher file to the matching public Supabase Storage bucket and
 * returns its public URL, so the form can store it on the book / unit.
 *
 * Buckets and allowed types:
 *   cover   → `covers`   (image/jpeg|png|webp, ≤ 8 MB)
 *   image   → `images`   (image/jpeg|png|webp|gif, ≤ 10 MB)
 *   audio   → `audio`    (common audio types, ≤ 50 MB)
 *   handout → `handouts` (application/pdf, ≤ 25 MB)
 */
export type MediaKind = "cover" | "image" | "audio" | "handout";

const MEDIA_RULES: Record<
  MediaKind,
  { bucket: "covers" | "images" | "audio" | "handouts"; mimes: string[]; label: string; maxMb: number }
> = {
  cover: {
    bucket: "covers",
    mimes: ["image/jpeg", "image/png", "image/webp"],
    label: "cover image",
    maxMb: 8,
  },
  image: {
    bucket: "images",
    mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    label: "unit image",
    maxMb: 10,
  },
  audio: {
    bucket: "audio",
    mimes: [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/aac",
      "audio/mp4",
      "audio/m4a",
      "audio/x-m4a",
      "audio/webm",
      "audio/flac",
    ],
    label: "audio file",
    maxMb: 50,
  },
  handout: {
    bucket: "handouts",
    mimes: ["application/pdf"],
    label: "PDF handout",
    maxMb: 25,
  },
};

export async function uploadMediaAction(
  _prev: ActionResult<{ url: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await requireTeacherFromCookie();
    const kindRaw = String(formData.get("kind") ?? "");
    if (!(kindRaw in MEDIA_RULES)) return fail("Unknown upload type.");
    const kind = kindRaw as MediaKind;

    const bookId = String(formData.get("book_id") ?? "");

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0)
      return fail("No file selected.");

    const rule = MEDIA_RULES[kind];
    const type = (file.type || "").toLowerCase();
    if (!rule.mimes.includes(type)) {
      return fail(
        `That file type is not allowed for the ${rule.label}. Allowed: ${rule.mimes
          .map((m) => m.split("/")[1])
          .join(", ")}.`,
      );
    }
    if (file.size > rule.maxMb * 1024 * 1024) {
      return fail(`The ${rule.label} must be smaller than ${rule.maxMb} MB.`);
    }

    if (bookId) {
      const book = await getDataSource().getBook(bookId);
      if (!book) return fail("Book not found.");
    }

    if (!usesSupabase()) {
      return fail(
        "File uploads require Supabase Storage. Set the environment variables first.",
      );
    }

    const { supabaseStore } = await import("@/lib/db/supabase-store");
    const url = await supabaseStore.uploadMedia(
      { name: file.name, type, arrayBuffer: await file.arrayBuffer() },
      rule.bucket,
      bookId || "new",
      session.sub,
    );

    return { ok: true, data: { url }, message: "File uploaded." };
  } catch (error) {
    return fail(toMessage(error));
  }
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

async function requireTeacherFromCookie() {
  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    throw new Error("You must sign in with a teacher account for this action.");
  }
  return session;
}

async function allSections(): Promise<Section[]> {
  const store = getDataSource();
  const books = await store.listBooks();
  const groups = await Promise.all(
    books.map((book) => store.listSections(book.id)),
  );
  return groups.flat();
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error. Please try again.";
}
