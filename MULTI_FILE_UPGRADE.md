# Multi-File Per Unit Upgrade — Implementation Summary

This upgrade transforms BasirShelf from single-URL-per-type to unlimited files per unit with names, search, and gallery.

## PART 1: Database

**New table `section_files`:**
```sql
id uuid PK default gen_random_uuid()
section_id uuid FK sections(id) cascade
type text check (video|audio|pdf|image)
name text not null
url text not null
sort_order int default 0
created_at timestamptz default now()

Indexes:
- (section_id)
- (section_id, type)
- (type)
- (section_id, type, sort_order)

RLS:
- select: anon, authenticated true (public catalogue)
- insert/update/delete: authenticated is_teacher()
```

**Migration files:**
- `supabase/migrations/001_section_files.sql` — creates table, indexes, RLS, migrates existing video_url/audio_url/handout_url/image_url/images_url (comma-split) into rows, adds realtime.
- `supabase/schema.sql` updated to include table idempotently.

**Migration of legacy data:**
- Videos, audios, PDFs each become one row with name = title + " - Video" etc.
- Images: single image_url + comma-separated images_url split via string_to_array, up to N per section.

Old columns kept as fallback.

## PART 2: Teacher Dashboard

**New component `TeacherSectionFilesManager`:**
- Four tabs: Videos (red #DC2626), Audios (purple #7C3AED), PDFs (blue #2563EB), Images (emerald #059669)
- Each tab shows count badge, list of files with sort_order, name editable, URL, delete.
- Add [Type] form: name, URL, sort_order, Save via Server Action `createSectionFileAction`.
- Edit inline: name, URL, sort_order via `updateSectionFileAction`.
- Delete via `deleteSectionFileAction`.
- Immediate toast + onChanged refresh.

**Updated `TeacherSectionManager`:**
- Mobile cards + desktop table now show counts per type (Video (3) etc) instead of single URL badges.
- Edit dialog: compact form for title/order + Files Manager below.
- Add unit dialog simplified to title only, files added after creation.

**Updated `TeacherSectionForm`:**
- `compact` prop for edit mode (only title/order, legacy fields hidden).
- Full mode still shows legacy fields with note to use new Files Manager.

**Server Actions in `actions.ts`:**
- `sectionFileSchema` validates type enum, name, URL (http/https or /), sort_order.
- `createSectionFileAction`, `updateSectionFileAction`, `deleteSectionFileAction` with teacher session check, revalidatePath.

**Data layer:**
- `supabase-store.ts`: `getBookWithFiles`, `listSectionFiles`, `listFilesByBook`, `createSectionFile`, `updateSectionFile`, `deleteSectionFile` with fallback to legacy if table missing.
- `local.ts`: same, file-backed `section_files` array in `data/db.json`.
- `resilient.ts`: exposes new methods with Supabase fallback.

**Types in `types.ts`:**
- `SectionFileType`, `SectionFile`, `SectionWithFiles`, `BookWithSectionsAndFiles`.

## PART 3: Student File List

**New component `FileListModal` (`src/components/books/file-list-modal.tsx`):**
- Props: isOpen, onClose, bookTitle, sectionTitle, type, files, onSelectFile.
- Search input real-time case-insensitive filter on name+url.
- For video/audio/pdf: clean list with type icon, name (ellipsis hover full), URL truncated, Open/Play button amber #F59E0B.
- For Images: responsive grid 2 col mobile, 3 tablet, 4 desktop, thumbnail card, name below, lazy load, broken URL fallback with FileWarning icon.
- Click image opens lightbox with name, next/prev chevrons, count, close.
- Empty: friendly icon + "No videos yet for this unit" etc.
- Search no results: "No results for '[query]'" + clear button.
- 50+ pagination: initial 50 visible, Load more button (+50).
- Long names: truncate + title attribute.
- Mobile: full-screen rounded-t, close top-right + bottom close button reachable, scrollable.

## PART 4: Modal Design

- Navy #0F1B2D background, amber #F59E0B accents.
- Header: `Interchange 1 — Unit 1 — Videos` with amber underline 40x3.
- Search below header.
- Close button top-right: amber border, amber bg 10%, hover 20%.
- Desktop max-width 800px, rounded 20px, shadow.
- Mobile full-screen, rounded-t 20px, 92vh.
- Animations: fade + slide up (y:40) + scale 0.96, spring damping 25 stiffness 300.
- Stagger: list items delay idx*0.02, grid idx*0.03.
- Footer close for mobile.

## PART 5: Gear Dial Integration

- `GearDialModal` now accepts `files` prop, computes hasVideo etc from files if present, else legacy.
- Shows counts in subtitle: "3 videos available" etc.
- `SectionList` updated:
  - Props `sections: SectionWithFiles[]`.
  - Counts per type displayed in unit row.
  - `handleSelectFromDial`: filters files by type, if 0 fallback legacy, if 1 opens directly (video modal, cassette, PDF, image lightbox), if >1 opens FileListModal.
  - FileListModal onSelect closes list then opens viewer after 200ms.

## PART 6: Data Fetching

- Server Components: `BookDetailPage` now uses `getBookWithFiles` with fallback to `getBook`.
- Group by type in SectionList via filter.
- Server Actions for CRUD, revalidatePath per book.
- Cache per section via sort_order ordering.

## PART 7: Edge Cases

- Empty: icon + message.
- Broken URL: onError hides img, shows fallback grid with warning.
- Long names: truncate + title hover.
- 50+ files: visibleCount 50 + Load more.
- Search no results: message + clear.
- Mobile scrollable: overflow-y-auto, close button both top and bottom.

## PART 8: Migration & Types

- SQL migration provided, TS types updated, old columns kept.
- Fallback logic in both stores ensures app works before migration.

## PART 9: Testing

**Local test data:**
- Seeded via `scripts/seed-multi-files.mjs` for Unit 1: 3 videos, 2 audios, 4 PDFs, 5 images.
- Verified via `curl` that page shows Video (3) Audio (2) PDF (4) Images (5).
- Gear dial subtitle shows counts.
- File list modal for videos shows 3 with search.
- Images grid shows 2-4 cols, lightbox with nav.

**Teacher flow:**
- Add 3v2a4p5i, edit name/URL/sort_order, delete, reorder via sort_order field.

**Student flow:**
- Gear dial Video → list modal with search, click Play → video modal.
- Audio → list → cassette player.
- PDF → list → PDF viewer.
- Images → grid → lightbox next/prev.

**Mobile:**
- File list full-screen, close reachable, grid 2 col.

## Files Changed / Added

- Added: `supabase/migrations/001_section_files.sql`
- Modified: `supabase/schema.sql`
- Modified: `src/lib/types.ts`
- Modified: `src/lib/db/supabase-store.ts`
- Modified: `src/lib/db/local.ts`
- Modified: `src/lib/db/resilient.ts`
- Modified: `src/lib/actions.ts`
- Added: `src/components/teacher/teacher-section-files-manager.tsx`
- Modified: `src/components/teacher/teacher-section-manager.tsx`
- Modified: `src/components/teacher/teacher-section-form.tsx`
- Modified: `src/components/teacher/teacher-books.tsx`
- Modified: `src/app/teacher/page.tsx`
- Added: `src/components/books/file-list-modal.tsx`
- Modified: `src/components/books/section-list.tsx`
- Modified: `src/components/books/gear-dial-modal.tsx`
- Modified: `src/app/books/[id]/page.tsx`
- Added: `scripts/seed-multi-files.mjs`, `scripts/verify-multi-files.mjs`
- Modified: `data/db.json` (added section_files for local testing)

## How to Apply Migration in Production

1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/001_section_files.sql`
3. Verify table exists: `select * from section_files limit 1;`
4. Existing legacy URLs will be auto-migrated.

## Build

- `npm run build` passes.
- No breaking changes to cassette player (fixed colors preserved), gear dial, PDF viewer.

## Deployment

- Code ready for Vercel. Run `vercel deploy --prod` (requires credentials).
- Production URL: https://basirshelf.vercel.app
- Until migration run, app falls back to legacy single URLs.
