# BasirShelf — Basir Language Institute

**Live:** https://basirshelf.vercel.app

BasirShelf is the digital library of **Basir Language Institute**. Three course
books (Interchange 1–3), each split into ordered units; every unit carries a
video lesson (YouTube / Aparat, external link only — never an uploaded file)
and a PDF handout stored in a public Supabase Storage bucket.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui**,
backed by **Supabase** (Postgres + RLS + Storage) and deployed on **Vercel**.

---

## Design system — “The Modern Language Library”

The UI follows the *quiet authority* of a language institute:

| Token        | Value     | Role                                          |
| ------------ | --------- | --------------------------------------------- |
| `--navy`     | `#1A365D` | Deep Navy — headings, primary surfaces, CTAs  |
| `--background` | `#FDFBF7` | Warm Cream — paper-like, low eye strain       |
| `--indigo`   | `#5A67D8` | Electric Indigo — hover, focus, accents only  |
| `--indigo-text` | `#4C51BF` | Darkened indigo for small text on cream (6.28:1) |

- **Typography:** Playfair Display (serif) for headings and book titles, Inter
  (geometric sans) for body and UI — the signature pairing of high-end
  educational brands.
- **Layout:** the library leads with Interchange 1 as a full-width featured
  banner (cover left, copy right) above two shelf cards; every cover renders
  uncropped in its natural 3:4 portrait ratio, exactly as on the book page.
  A **text mode / shelf mode** toggle swaps the library between a
  typographic list and the visual bookshelf.
- **Motion:** one shared easing curve, 300–400 ms reveals, a single gentle
  pulse on button press, soft card lifts on hover. Everything respects
  `prefers-reduced-motion`.

### Accessibility (WCAG 2.1 AA)

- `npm run audit:a11y` reads the exact shipped hex values out of
  `src/app/globals.css` and checks **35 foreground/background pairs** (text
  4.5:1, UI borders/focus 3:1) in **both light and dark themes**. Current
  result: **35/35 pass**.
- Light/dark/system theme toggle with a pre-hydration script (no flash),
  `color-scheme` set per theme.
- Skip link, landmark structure (`header/main/footer/nav`), one `h1` per page,
  visible `:focus-visible` rings everywhere, `aria-live` result counts,
  `aria-pressed` toggles, semantic lists and tables, alt/aria names on covers
  (the surrounding link carries the accessible name).
- Lessons: embedded YouTube player with **playback-speed control**
  (`setPlaybackRate` over the iframe postMessage API, 0.5×–2×) and a
  **captions toggle** (`cc_load_policy`, remount-and-resume), plus a
  guaranteed “open in a new tab” link with `rel="noopener noreferrer"`.
- Mobile-first: sticky header with instant search, thumb-friendly targets on
  coarse pointers.

### Performance & sharing

- All imagery is generated (SVG / Satori) — zero stock photos, minimal bytes.
- Every book page publishes a branded **Open Graph card** (cover, title,
  level, unit count) rendered by `src/app/books/[id]/opengraph-image.tsx`
  (Satori + inlined TTF data via `src/lib/og-fonts.ts`, so generation works
  offline and at build time). WhatsApp/Telegram shares look like product
  pages, not bare URLs.

---

## Structure

```
books  →  sections (units, sort_order)  →  video_url (external) + handout_url (Storage PDF)
```

### Tables (RLS-enabled, `supabase/schema.sql`)

- `profiles` — `id` (auth.users), `full_name`, `role` student|teacher, `created_at`
- `books` — `id`, `title`, `description`, `cover_image_url`, `teacher_id`, `created_at`
- `sections` — `id`, `book_id` (cascade), `title`, `video_url`, `handout_url`,
  `image_url`, `audio_url`, `sort_order`, `created_at`

### Shared teacher access

All teachers have **identical rights over the whole catalogue**: write
policies (`books_*_teacher`, `sections_*`) gate on `is_teacher()` only — no
per-book ownership. `teacher_id` is stored as “created by” and is never
rendered anywhere (cards, detail page, search). Verified by
`npm run test:sql` (25 checks), including a cross-teacher write.

### Pages

- `/` — hero, instant-filtered library (bento + text mode), “Why students
  trust BasirShelf”, how-it-works, institute footer
- `/books/[id]` — editorial header (breadcrumb, badges, serif title), ordered
  units with in-page player + PDF handout downloads
- `/teacher` — role-gated dashboard: add/edit/delete books and sections,
  upload handouts (public `handouts` bucket), attach video links
- `/login`, `/signup` — email + password (default role student)
- `/teacher-login` — hidden route; username + password; session cookie
  `basirshelf_session` (HS256 JWT), role teacher

---

## Teacher media

- **Book covers:** direct upload from the teacher panel (`covers` bucket) or an
  image link; a generated cover is used when neither is set.
- **Per unit:** an **Image** slot (upload or link → `images` bucket), an
  **Audio** slot (upload or link → `audio` bucket) and a **PDF** slot (upload
  or link → `handouts` bucket). Students get an embedded player for videos,
  a native audio player, the lesson image and the PDF download.
- Uploads are validated server-side (MIME type + size) before hitting Storage.

## Local development

```bash
npm install
npm run dev            # http://localhost:3000

# Database (needs SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF in .env.local)
npm run db:setup       # schema + seed (idempotent)

# Checks
npm run typecheck      # tsc --noEmit
npm run build          # production build
npm run test:sql       # 28 RLS/seed checks on embedded Postgres
npm run audit:a11y     # WCAG contrast audit of the shipped palette
npm run gen:og-fonts   # rebuild src/lib/og-fonts.ts from src/assets/fonts
```

### Environment (`.env.local`, gitignored)

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
SUPABASE_SERVICE_ROLE_KEY=eyJ…            # legacy JWT — required for Storage uploads
SUPABASE_SECRET_KEY=                       # optional: enables strict in-DB RLS JWTs
SESSION_SECRET=                            # cookie signing secret
NEXT_PUBLIC_SITE_URL=https://basirshelf.vercel.app
SUPABASE_ACCESS_TOKEN=sbp_…               # Management API (db:setup only)
SUPABASE_PROJECT_REF=<ref>
```

Gotcha worth remembering: Supabase Storage only accepts a **compact JWS** as
bearer token — the legacy `service_role` JWT works, the new opaque
`sb_secret_…` keys return `403 Invalid Compact JWS`.

---

## Accounts

| Who        | Username / email      | Password      |
| ---------- | --------------------- | ------------- |
| Teacher    | `teacher1_hamid`      | `Xk9mP2qL7w`  |
| Teacher    | `teacher2_sara`       | `B4nR8tY3vZ`  |
| Teacher    | `teacher3_reza`       | `M6cQ1sD9fH`  |
| Teacher    | `teacher4_mina`       | `T5jW7eK2pA`  |
| Teacher    | `teacher5_ali`        | `R3yU8iO4nC`  |
| Teacher    | `mr.khotanlo`         | `Khotanlo1678`|
| Teacher    | `mr.babaeian`         | `Babaeian1389`|
| Students   | sign up at `/signup`  | own password  |

---

## Deployment

Vercel (`vercel.json`: `framework: nextjs`, region `fra1`).

```bash
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

Re-apply SQL at any time with `npm run db:setup` (schema and seed are both
idempotent; the seed upserts books/descriptions and never deletes data).
Books ship with the real Interchange cover art stored in the public `covers`
bucket (`covers/interchange-{1,2,3}.png`); the seed carries those URLs so a
re-seed keeps the covers attached.

---

## Status

| Check                     | Result                                    |
| ------------------------- | ----------------------------------------- |
| `tsc --noEmit`            | clean                                     |
| `next build`              | 13 routes incl. 2 Open Graph generators   |
| `npm run test:sql`        | 28 passed, 0 failed                       |
| `npm run audit:a11y`      | 35/35 pairs ≥ required ratio (light+dark) |
| Live CRUD over RLS        | create / update / delete verified earlier |
