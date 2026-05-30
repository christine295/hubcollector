# HubCollector

A QR-code hub platform for attaching evolving digital content to physical objects, spaces, and experiences. A user creates a hub with a stable URL (`/h/[slug]`), prints the QR code, and places it on something physical. The content behind the QR can be updated at any time without reprinting.

Targeting household, creative, ritual, and eventually business use cases (property records, customer hubs, product pages). Help content must stay template-agnostic — generic across all use cases, not ritual-specific.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — auth (email + Google OAuth) + database + Storage (images, audio)
- **Tailwind CSS**
- **`qrcode` npm package** — QR PNG generation in browser
- **`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`** — drag-and-drop for block reordering in ContentBlocksEditor

## Running locally

Node.js is installed at `C:\Program Files\nodejs\` but is NOT in the system PATH. Always prefix node/npm commands:

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev
```

App runs at http://localhost:3000

## Environment variables

Stored in `.env.local` (not committed). See `.env.local.example` for keys needed:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase project ref: `hiotzlktznkznjxjakup`

## Project structure

```
app/
  page.tsx                           — redirects to /dashboard or /login
  login/page.tsx                     — Google OAuth only; both email login and email signup grayed out pending SMTP; threads ?next= param through OAuth redirectTo so post-login destination is preserved
  signup/page.tsx                    — Google OAuth only; email form grayed out pending SMTP setup
  setup/page.tsx                     — username picker; shown once after first login (when username_confirmed=false); redirects to /dashboard on confirm
  auth/callback/route.ts             — OAuth callback handler; reads ?next= param and redirects there after auth
  help/page.tsx                      — in-app onboarding & inspiration page (no auth required); async server component; checks auth to set CTA link target (logged-in → /dashboard/hub/new?template=id, logged-out → /login?next=...); uses HelpTemplateGrid client component for template section; sections: intro, popular uses, template cards + lightbox modal, how hubs work, collections, block types, advanced styling, tips
  dashboard/collections/page.tsx     — main dashboard; collection cards (expandable, click to select/filter hub list); hub list below; auto-creates "My Hubs" collection on first load
  dashboard/hub/new/page.tsx         — create hub; reads ?template= and ?collection= search params and passes both to HubForm
  dashboard/hub/[id]/edit/page.tsx   — edit hub (Content tab + Settings tab)
  dashboard/hub/[id]/print/page.tsx  — print QR card
  h/[username]/[slug]/page.tsx       — public hub page; increments view_count via increment_view_count RPC for non-owner visits; passes save/heart state + autoSave to HubView
  h/[username]/page.tsx             — profile page; avatar, display_name, bio, social_links, badges, public hubs grid; Edit Profile for owner
  explore/page.tsx                  — explore; Top Hubs leaderboard (Most Viewed/Hearted/Saved/Shared); template filter; hub grid
  settings/profile/page.tsx         — profile editing (client component); display_name, bio, avatar upload, social links; PATCH /api/profile

components/
  HubCard.tsx              — dashboard card; clickable (navigates to edit); visible "Clone as new list →" strip above tags/date row; ⋮ kebab (Edit/View/Copy link/Download QR/Print card/Clone as new list/Move to collection); colored left border from hub.theme_color (3px inline style); template badge + mode + privacy pills; account status badge (restricted/suspended) shown when not active
  HubForm.tsx              — create/edit form; TEMPLATES array; BLOCKS_BY_TEMPLATE map; all *_BLOCKS consts; tabs on edit (Content / Settings); slug auto-resolves collisions on create (tries base, base-2, …); 42501 RLS error shows friendly "account restricted" message
  CloneHubModal.tsx        — modal for cloning a hub; fetches blocks on open; all checked by default; All/None shortcuts; title pre-filled "Copy of …"; calls POST /api/hub/[hubId]/clone; redirects to edit on success
  HelpTemplateGrid.tsx     — client component for the help page template section
  HubView.tsx              — PUBLIC hub renderer (client component); checklist uses 20px square checkboxes with white checkmark SVG, 44px min-height rows; footer shows "♥ Created with HubCollector™" (linked, TM unlinked) instead of SiteFooter
  ContentBlocksEditor.tsx  — block editor; checklist edit form has no ☐ symbol, full-width dashed "+ Add item" button separated from FormActions; sequential Save/Close/Remove flow; dnd-kit drag-and-drop reordering
  WelcomeCard.tsx          — founder onboarding; 9 cards total (3 journey + 5 feature + 1 closing); localStorage key hc_dismissed_cards; see WelcomeCard section
  FeedbackModal.tsx        — modal for submitting feedback; calls POST /api/feedback; shows ✓ confirmation; "Christine reads every one" copy
  FeedbackPanel.tsx        — admin client component; filter by status (new/read/resolved); optimistic status updates via PATCH /api/admin/feedback/[id]
  ModerationPanel.tsx      — admin client component on /admin/users/[id]; Restrict/Unrestrict/Suspend/Unsuspend + Remove content + Terminate (ban+keep email) + GDPR delete (true erasure, frees email); terminate and GDPR both require typing username; redirects to /admin after terminal actions
  SavedHubCard.tsx         — dashboard card for saved (non-owned) hubs; ⋮ kebab (View Hub / Remove from Saved / Move to Collection)
  ChecklistBlock.tsx       — standalone checklist component (used only in edit preview)
  DeleteHubForm.tsx        — delete confirmation; used in HubForm Settings danger zone
  QRButton.tsx             — downloads QR PNG via qrcode package
  SiteFooter.tsx           — footer used on dashboard, help, and legal pages (NOT on public hub pages); nav links + trademark + copyright

app/
  admin/page.tsx                    — admin dashboard (Christine-only, gated by email); tabs: Overview (stats + users table with account_status badges + View links), Feedback (FeedbackPanel), Welcome Cards (full card content), Roadmap (hardcoded ROADMAP const)
  admin/users/[id]/page.tsx         — user detail view; sticky red admin banner; profile info, activity stats, hub table, collections; ModerationPanel at top

app/api/hub/[hubId]/
  content_blocks/route.ts      — GET (list), POST (create) content blocks
  content_blocks/[id]/route.ts — PATCH (update data or sort_order), DELETE
  clone/route.ts               — POST; verifies ownership; auto-deduplicates slug; creates new hub (private) + selected blocks in sort order
  save/route.ts                — POST (save hub), DELETE (unsave), PATCH (update collection_id on saved_hubs row)
  heart/route.ts               — POST (heart hub), DELETE (unheart)
  share/route.ts               — POST (increment share_count via RPC; no auth required)

app/api/feedback/route.ts              — POST; authenticated users submit feedback (message); inserts to feedback table
app/api/admin/feedback/[id]/route.ts   — PATCH; admin-only; updates feedback status (new/read/resolved)
app/api/admin/users/[id]/route.ts      — DELETE; terminate: bans 876000h + account_status=terminated + deletes hubs; keeps auth record so email stays taken
app/api/admin/users/[id]/status/route.ts  — PATCH; actions: restrict/unrestrict/suspend/unsuspend; suspend also calls Supabase auth ban
app/api/admin/users/[id]/content/route.ts — DELETE; removes all user's hubs (cascades blocks)
app/api/admin/users/[id]/gdpr/route.ts    — DELETE; true auth user deletion for GDPR/erasure requests; frees email
app/api/profile/route.ts               — PATCH (update display_name, bio, avatar_url, social_links for current user)

lib/
  types.ts                    — Hub, ContentBlock, Profile, SavedHub types
  version.ts                  — VERSION constant (e.g. 'v0.1'); displayed in dashboard header (desktop only)
  supabase/client.ts          — browser Supabase client
  supabase/server.ts          — server Supabase client (anon key + user auth context)
  supabase/admin.ts           — service role client (bypasses RLS); requires SUPABASE_SERVICE_ROLE_KEY env var; server-only
  supabase/uploadPhoto.ts     — upload image to hub-photos Storage bucket
  supabase/uploadAudio.ts     — upload audio to hub-audio Storage bucket
  supabase/uploadAvatar.ts    — upload avatar to hub-photos bucket under avatars/${userId}/ prefix

lib/config.ts               — global feature flags; `BETA_PHASE = true` auto-assigns 🧪 Beta Tester badge to all profile pages
ADMIN_EMAIL constant         — 'christine@websketching.com'; hardcoded in all admin routes and pages

proxy.ts            — Next.js 16 proxy (replaces middleware.ts); protects /dashboard routes
supabase/schema.sql — full DB schema + RLS policies
supabase/admin_report.sql — internal SQL report (7 queries); run sections individually in Supabase SQL editor (CTE replaced with inline subquery for compatibility)
HELP.md             — developer reference: block shapes, design notes, template authoring guide
```

## Database

Tables — all with RLS enabled:
- **profiles** — auto-created via trigger on `auth.users` insert
- **hubs** — owned by user; publicly readable for `/h/[slug]`; columns include `collection_id` (FK → collections), `privacy_mode`, `tags text[]`, `template_id text`
- **collections** — user-owned folders; hubs.collection_id references this
- **content_blocks** — belongs to hub; type + data (JSONB) + sort_order
- **profiles** (extended) — `display_name`, `bio`, `avatar_url`, `social_links jsonb`, `saved_count integer` (trigger-maintained), `badges text[]` (manually assigned via SQL; `BETA_PHASE` in `lib/config.ts` overlays 'beta' for everyone automatically)
- **saved_hubs** — user saves another user's hub; columns: `user_id`, `hub_id`, `collection_id` (FK → collections, nullable), `last_viewed_at` (timestamptz); UNIQUE(user_id, hub_id); RLS: users manage their own rows; a second SELECT policy allows public reads of collection-assigned non-private saved hubs (for Hub Collector pages)
- **hub_hearts** — user hearts a hub; columns: `user_id`, `hub_id`; UNIQUE(user_id, hub_id); RLS: anyone can read (SELECT USING true); only the user can insert/delete their own hearts

`hub_links` table has been fully removed. All content is now in `content_blocks`.

### content_blocks type constraint

```sql
type text not null check (type in ('text', 'image', 'audio', 'file', 'link', 'phone', 'checklist', 'timeline', 'note', 'collection_menu'))
```

If this constraint is wrong in your Supabase instance, fix it:
```sql
ALTER TABLE public.content_blocks DROP CONSTRAINT content_blocks_type_check;
ALTER TABLE public.content_blocks ADD CONSTRAINT content_blocks_type_check
  CHECK (type IN ('text', 'image', 'audio', 'file', 'link', 'phone', 'checklist', 'timeline', 'note', 'collection_menu'));
```

### RLS for content_blocks

Block inserts/updates **must go through the API routes** (`/api/hub/[hubId]/content_blocks`), not direct Supabase client calls. RLS requires server-side auth context; direct client inserts fail silently.

## Core concepts

**Hub modes:**
- `landing` — shows the public content page (HubView); labelled **"Interactive Page"** in both create and edit UI (was "Landing Page" in create mode — corrected for consistency)
- `redirect` — instantly redirects to `redirect_url`; labelled **"Redirect Link"** in the UI; destination URL field appears inline immediately below the mode buttons, not at the bottom of the form

New hubs default to `private` visibility.

**Privacy:**
- `public` — anyone can find and view
- `unlisted` — only people with the link can view
- `private` — only the owner when signed in (others see a lock screen)

**Hub type (`template_id`):**
Stored as a text column on hubs. Set automatically when a hub is created from a template. Can also be set retroactively in the hub's Settings tab → "Hub type" dropdown — this only adds the badge label on the dashboard card; it does not add or remove content blocks.

**Collections:**
- User-facing label is "Collection/Collections". DB table is still `collections`; FK is still `collection_id`.
- Dashboard shows collection cards above the hub list (always visible, not in an accordion).
- Clicking a card selects it and filters the hub list below to that collection; clicking again deselects.
- Description (optional) appears on the card only when it is the active/selected collection.
- Collection ⋮ kebab: + Add hub, Edit (name + description), Delete.
- Hub assignment is done via the hub card's ⋮ kebab → "Move to collection" (no inline select on the card).
- First login auto-creates a "My Hubs" collection if the user has none.

The QR code always points to `/h/[username]/[slug]`. The slug is permanent — changing it breaks printed QR codes. The username is derived from the user's email prefix and stored on the `profiles` table.

## Content blocks

Each block has `type`, `data` (JSONB), and `sort_order`. Supported types:

| Type | Data shape |
|------|-----------|
| `text` | `{ label, text, date? }` |
| `checklist` | `{ label, items: [{ id, text }] }` |
| `audio` | `{ label, url, date? }` |
| `link` | `{ label, url }` |
| `phone` | `{ label, url }` |
| `file` | `{ label, url }` |
| `image` | `{ url, caption }` |
| `timeline` | `{ label, events: [{ id, date, text }] }` |
| `collection_menu` | `{ collection_id: string, excluded_hub_ids: string[] }` |

## Public view (HubView.tsx)

`app/h/[username]/[slug]/page.tsx` is a server component that looks up the profile by username, then the hub by user_id + slug, and passes props to `HubView`. It also:
- Pre-fetches `collectionHubs: Record<string, any[]>` (keyed by block ID) for any `collection_menu` blocks — including saved hubs the page owner has assigned to each collection (owner_username attached to each hub for correct public URL generation)
- Fetches `heartCount` (visible to all), `isSaved`, and `userHearted` for the current visitor
- Updates `saved_hubs.last_viewed_at` (best-effort await) when a logged-in non-owner who has saved the hub visits the page

All interactive rendering is in `components/HubView.tsx` (client component). HubView never fetches hub data directly.

**HubView visitor bar:** shown for non-owners (both logged-in and logged-out); sticky top bar with heart toggle + count on the left and Save Hub / ✓ Saved button on the right. Clicking either while logged out redirects to `/login?next=…`.

**Design system:**
- Background: `#FAF9F7` (warm cream) via `bg-[#FAF9F7]`
- Stone color palette throughout (`stone-*`)
- Blocks render as `divide-y divide-stone-100` hairline-separated rows — no stacked cards
- Collapsed sections: `py-3 text-sm font-medium text-stone-500`
- Expanded sections: `font-semibold text-stone-800`, content indented `pl-6`
- Checklist: 8px circle bullets (no checkbox box); `begin again` resets
- Link/phone/file: quiet text rows with small accent-opacity icon + arrow
- Image: edge-to-edge `rounded-xl`, no card wrapper
- Timeline: thin accent-color left border, tiny dot with `box-shadow: 0 0 0 2px #FAF9F7` ring

**Ceremonial/styled text (`isCeremonial()`):**
Any `text` block whose label contains `invocation`, `words to speak`, `quote`, `passage`, `poem`, `prayer`, or `sacred` renders in italic with a thin accent-color left border.

**Default collapse state (`defaultOpen()`):**
- Open: label contains `overview`, `step`, `note`, `invocation`, `words`
- Closed: label contains `setup`, `correspond`, `photo`, `memor`, `follow`, `playlist`, `voice`
- All others: open by default

## Templates

Defined in `TEMPLATES` array in `components/HubForm.tsx`. Template picker shown before create form. All blocks are created via `BLOCKS_BY_TEMPLATE` record in `handleSubmit` — no per-template branching needed.

**20 templates (alphabetical, Blank first):** Blank, Artwork Archive (8 blocks), Book / Reading Notes (7 blocks), Daily Reflection / Journal (10 blocks), Diary / Life Log (10 blocks), Garden Planner (9 blocks), Goal / Habit Tracker (6 blocks), Grocery List (20 blocks), Home Maintenance Log (8 blocks), Hub Collector (2 blocks), Pet Profile (8 blocks), Plant Profile (8 blocks), Recipe (8 blocks), Ritual (14 blocks), Shadow Work Journal (12 blocks), Travel Journal (7 blocks), Travel Packing List (18 blocks), Vehicle Maintenance (9 blocks), What's in the Box? (8 blocks), Workout Tracker (8 blocks).

Both Grocery List and Travel Packing List are designed as **master clone templates** — the user creates the hub once, then clones it (selecting only needed categories) for each use. See Clone Hub section below.

See `HELP.md` for the full block-by-block breakdown of each template.

### Adding a new template
1. Add an entry to `TEMPLATES` in `components/HubForm.tsx`
2. Define a `YOUR_TEMPLATE_BLOCKS` const (follow `RITUAL_BLOCKS` or `RECIPE_BLOCKS` as pattern) — place it **before** `BLOCKS_BY_TEMPLATE` to avoid forward-reference errors
3. Add `your_id: YOUR_TEMPLATE_BLOCKS` to the `BLOCKS_BY_TEMPLATE` record
4. Add a tag placeholder to `TAG_PLACEHOLDERS` record
5. Add audio label suggestions to `AUDIO_SUGGESTIONS` in `ContentBlocksEditor.tsx`
6. Add checklist label placeholder to `CHECKLIST_LABEL_PLACEHOLDER` in `ContentBlocksEditor.tsx`
7. Add an entry to the `TEMPLATES` array in `app/help/page.tsx` — include `templateId` (must match the id in HubForm), `name`, `emoji`, `tagline`, `description`, `borderClass`, and `blocks` array (for the lightbox modal)
8. Add a matching entry to `TEMPLATE_LABELS` in `components/HubCard.tsx`
9. All block inserts use `fetch('/api/hub/${newHub.id}/content_blocks', { method: 'POST' })` automatically via the map in `handleSubmit`

## Sort order

`moveBlock()` in `ContentBlocksEditor.tsx` swaps by array index and normalizes all sort_orders to `0, 1, 2, …` on every move. This heals gaps or duplicates from partial template inserts. Only changed blocks are PATCHed.

New blocks are inserted with `sort_order: blocks.length`.

## Dashboard

**File:** `app/dashboard/collections/page.tsx` (client component)

- Background: `bg-[#FAF9F7]` (warm cream, matches public hub view)
- Header (desktop): HubCollector™ logo + VERSION + bordered **Explore**, **Profile**, **Help** links + ⚙ **Settings gear** dropdown (View Profile · Edit Profile · Send feedback · [Admin — Christine only] · Sign out)
- Header (mobile): logo only + **☰ hamburger** (Explore/Profile/Help as full-width tappable rows) + ⚙ gear; VERSION hidden on mobile
- Stats line: `X Hubs · X Collections · X Saved` (Saved only shown when > 0) above the `+ New Hub` CTA
- **WelcomeCard** renders below stats (see WelcomeCard section)
- **Collections** section: sorted **A→Z by title** (DB query uses `.order('title', { ascending: true })`); empty collections show `empty` in muted italic instead of `0 Hubs`; **Uncollected** (computed) always renders last
- **Search & filters** (search input + All modes + All visibility dropdowns): placed **below Collections**, directly above the hub list — they filter the list they're adjacent to
- **Hub list** sorted alphabetically A→Z by `title` (DB query uses `.order('title', { ascending: true })`)
- **All Hubs** section header: grid SVG icon + `text-sm font-semibold`
- **Saved Hubs section**: rendered below the owned hub list; only shown when the user has saved hubs; uses `SavedHubCard`; loads via parallel query in `fetchData`; also loads owner usernames (separate profiles query) and heart counts for owned hubs
- **Heart counts**: loaded for all owned hubs and passed as `heartCount` prop to `HubCard`; displayed as ♥ N in bottom-right of card when > 0

## WelcomeCard

**File:** `components/WelcomeCard.tsx` — founder onboarding card on the dashboard.

**localStorage key:** `hc_dismissed_cards` — JSON array of dismissed card keys. Each card has a unique key; dismissed cards never reappear unless the key changes.

**Display order** (first undismissed card wins):

| # | Key | Condition | Title |
|---|-----|-----------|-------|
| 1 | `journey-welcome-v1` | hubCount === 0 | "Hi, I'm Christine" — founder intro, create first hub CTA |
| 2 | `journey-first-hub-v1` | hubCount === 1 | "You've created your first Hub" — print QR CTA |
| 3 | `journey-growing-v1` | hubCount >= 2 | "You're building something" — create Collection CTA |
| 4 | `feature-clone-v1` | hubCount >= 1 | "Build it once, reuse it forever" — Clone Hub feature; CTA → /dashboard/hub/new?template=packing |
| 5 | `feature-explore-v1` | hubCount >= 1 | "I built you a place to explore" — Explore page CTA |
| 6 | `feature-save-hubs-v1` | hubCount >= 1 | "You can now save other people's Hubs" |
| 7 | `feature-profile-v1` | hubCount >= 1 | "Your profile page is live" — Edit Profile CTA |
| 8 | `feature-social-v1` | hubCount >= 1 | "Hearts, shares, and views" |
| 9 | `journey-established-v1` | hubCount >= 4 | "You've got the hang of it" — closing, shown only after all feature cards dismissed |

All cards use `isFounder: true` — Christine's photo + warm first-person voice. Feature cards use `Just shipped` label. **Adding a new feature card:** add to `FEATURE_CARDS` array in `WelcomeCard.tsx` (first entry = first shown after journey cards); bump key suffix (`v2`) to resurface an updated announcement.

All cards have an × dismiss button. Founder photo: `/public/Christine.jpg` (circular avatar, `object-top` crop). Falls back to teal "C" initial if photo missing.

## HubForm edit mode

Edit page (`app/dashboard/hub/[id]/edit/page.tsx`) uses Content / Settings tabs. **Delete hub has been removed from the edit page header** — it lives in the Settings tab at the bottom in a "Danger zone" section (renders `<DeleteHubForm hubId={hub.id} />`).

Content tab renders `<ContentBlocksEditor hubId={hub.id} hubTitle={hub.title} />`. Settings tab has all hub fields: Collection, Hub type (template_id dropdown), title, slug, mode, visibility, tags, description, image, theme color, then danger zone.

The `✓ Saved` chip appears for 2.5s after a block is updated (`savedBlockId` state).

**`initialTemplateId` prop:** when passed to `HubForm` (from `/dashboard/hub/new?template=id`), the template picker is skipped entirely and the matching template's title, slug, description, theme color, and template_id are pre-applied as initial state. The `preselected` variable looks up the template from the `TEMPLATES` array at component initialization.

**Mode selector UX:** both create and edit modes show an explanation sentence above the buttons ("What happens when someone scans the QR code or visits this Hub's URL."). When "Redirect Link" is selected, the Destination URL input appears immediately below the mode buttons — not at the bottom of the form.

## ContentBlocksEditor

**Sequential editing flow:**
- On load, block 1 is automatically opened in edit mode (`setEditingBlockId(loaded[0].id)`)
- `openNextBlock(id)` — finds current block's index, sets `editingBlockId` to the next block, or null if at the last block
- **Save** → saves data via PATCH, then calls `openNextBlock`
- **Close** → skips saving, calls `openNextBlock` (advances without saving)
- Adding new blocks (+ Add Content Block flow) → Close just dismisses the add form; no sequential progression

**FormShell** is now a plain container (title + children only). No Cancel button.

**FormActions** component renders `[Save] [Close]` with an optional `[Remove]` pushed right (red text, `ml-auto`). Remove only appears when `onRemove` prop is provided — it is passed when editing an existing block but NOT when adding a new one. AudioForm has its own Close + Remove buttons (it doesn't use FormActions).

Block rows show a **content indicator dot**: solid green (`bg-emerald-400`) if the block has content, hollow gray ring (`border border-gray-300`) if empty. Empty block rows also render on `bg-gray-50` instead of white.

`blockHasContent(block)` determines this:
- `text/audio/link/phone/file` → `data.url` or `data.text` is non-empty
- `checklist` → `data.items.length > 0`
- `timeline` → `data.events.length > 0`
- `image` → `data.url` is non-empty

**Drag-and-drop reordering:**
- Uses `@dnd-kit/core` + `@dnd-kit/sortable`. Each non-editing block row is wrapped in `SortableBlockRow` (defined in the same file).
- A 6-dot grip handle (`GripIcon`) is rendered at the left of each row. Drag the handle to reorder.
- `handleDragEnd` uses `arrayMove` then normalizes `sort_order` to `0,1,2,…` and PATCHes only changed blocks.
- `PointerSensor` has a 5px activation distance to prevent accidental drags on click.
- ▲▼ arrow buttons are kept for keyboard/accessibility fallback — do not remove them.

## HubCard color coding

Each hub card has a 3px colored left border using `hub.theme_color` via inline style (`style={{ borderLeft: '3px solid ${hub.theme_color}' }}`). This is intentional — dynamic colors cannot be expressed as static Tailwind classes.

`TEMPLATE_LABELS` in `HubCard.tsx` now covers all 19 non-blank templates. If a new template is added to `HubForm.tsx`, add a matching entry to `TEMPLATE_LABELS`.

## Legal pages

`/privacy`, `/terms`, `/acceptable-use`, `/content-licensing` — all exist as Next.js pages with full content. Their headers link back to **`/dashboard`** (not `/help`). If adding new legal pages, follow the same pattern: `← Dashboard` link in the header, `<SiteFooter />` at the bottom.

## Help system

- `/help` — in-app onboarding & inspiration page (no auth required), linked from dashboard header; **async server component** that checks auth; passes `templates` data and `isLoggedIn` to `HelpTemplateGrid`; template cards use static Tailwind `borderClass` strings (e.g. `border-l-blue-500`) — no inline styles
- `HelpTemplateGrid.tsx` — client component; manages `openTemplate` modal state; renders 2-col grid with "Create this Hub »" + "See blocks" per card; lightbox modal shows block table + Create CTA; `isLoggedIn` determines whether CTA links to `/dashboard/hub/new?template=id` or `/login?next=...`
- `HELP.md` — developer reference in repo root

Both files must stay template-agnostic in general sections. Template-specific content belongs only inside the per-template section.

**Navigation arrows:** all `«` Back / Dashboard and `»` forward CTAs use double guillemet Unicode characters (`«` U+00AB, `»` U+00BB). Do not use SVG chevrons or `←`/`→` Unicode arrows.

**`/help` page structure** (in order):
1. What is HubCollector? — intro + callout box
2. What people use it for — flex-wrap pill grid (15 popular uses)
3. Templates — 2-col card grid (via HelpTemplateGrid) + lightbox modal for block details; each card has "Create this Hub »" CTA and "See blocks" button
4. How hubs work — mode cards (2-col) + privacy cards (3-col)
5. Collections & Organization
6. Sharing & Social — 3 cards: Save Hub, Updated badge, Hearts
7. Block types — 2-col card grid with emoji
8. Advanced styling — ceremonial text + collapse behavior
9. Good to know — 8 tips (includes saving and hearts)

## Known Next.js 16 notes

- `middleware.ts` is renamed to `proxy.ts` and exports `proxy()` not `middleware()`
- Route params are Promises: `const { id } = await params` in server components
- `cookies()` is async: `const cookieStore = await cookies()`

## Not yet built

- SMTP configuration: both email login and email signup are grayed out in the UI pending SMTP setup. Only Google OAuth works. Configure via Supabase dashboard → Authentication → Settings → SMTP.
- Free tier enforcement (hub/collection limits)
- Paid feature: `hide_footer` flag to remove footer branding on public hubs
- Sort order normalization on load (gaps only heal on first move, not on page load)

## DB migrations applied (Supabase SQL editor)

Beyond the base schema in `supabase/schema.sql`, these have been applied to the live project:

```sql
alter table public.hubs add column if not exists collection_id uuid references public.collections(id) on delete set null;
alter table public.hubs add column if not exists privacy_mode text not null default 'public' check (privacy_mode in ('public', 'unlisted', 'private'));
alter table public.hubs add column if not exists tags text[] not null default '{}';
alter table public.hubs add column if not exists template_id text;
ALTER TABLE public.content_blocks DROP CONSTRAINT IF EXISTS content_blocks_type_check;
ALTER TABLE public.content_blocks ADD CONSTRAINT content_blocks_type_check
  CHECK (type IN ('text', 'image', 'audio', 'file', 'link', 'phone', 'checklist', 'timeline', 'note', 'collection_menu'));
-- collection_menu added for Hub Collector feature (2026-05-27)

-- saved_hubs, hub_hearts, updated_at triggers (2026-05-29)
CREATE TABLE public.saved_hubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_id uuid NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  last_viewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, hub_id)
);
ALTER TABLE public.saved_hubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved hubs" ON public.saved_hubs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public reads collection-assigned saved hubs" ON public.saved_hubs FOR SELECT USING (
  collection_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.hubs WHERE id = saved_hubs.hub_id AND privacy_mode != 'private')
);

CREATE TABLE public.hub_hearts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_id uuid NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, hub_id)
);
ALTER TABLE public.hub_hearts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hearts" ON public.hub_hearts FOR SELECT USING (true);
CREATE POLICY "Users can heart" ON public.hub_hearts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unheart" ON public.hub_hearts FOR DELETE USING (auth.uid() = user_id);

-- Auto-update hubs.updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER hubs_set_updated_at BEFORE UPDATE ON public.hubs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Touch hubs.updated_at when content_blocks change (powers Updated badge)
CREATE OR REPLACE FUNCTION public.update_hub_on_block_change() RETURNS TRIGGER AS $$ BEGIN UPDATE public.hubs SET updated_at = NOW() WHERE id = COALESCE(NEW.hub_id, OLD.hub_id); RETURN COALESCE(NEW, OLD); END; $$ LANGUAGE plpgsql;
CREATE TRIGGER content_blocks_touch_hub AFTER INSERT OR UPDATE OR DELETE ON public.content_blocks FOR EACH ROW EXECUTE FUNCTION public.update_hub_on_block_change();
```

**Engagement metrics + profile fields + save_count (run after social features):**

```sql
-- Hub metric columns
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS heart_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.hubs ADD COLUMN IF NOT EXISTS save_count integer NOT NULL DEFAULT 0;

-- Backfills
UPDATE public.hubs SET heart_count = (SELECT COUNT(*) FROM public.hub_hearts WHERE hub_id = hubs.id);
UPDATE public.hubs SET save_count  = (SELECT COUNT(*) FROM public.saved_hubs  WHERE hub_id = hubs.id);

-- Heart count trigger
CREATE OR REPLACE FUNCTION public.update_hub_heart_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.hubs SET heart_count = heart_count + 1 WHERE id = NEW.hub_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.hubs SET heart_count = GREATEST(heart_count - 1, 0) WHERE id = OLD.hub_id;
  END IF; RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER hub_hearts_update_heart_count
  AFTER INSERT OR DELETE ON public.hub_hearts FOR EACH ROW EXECUTE FUNCTION public.update_hub_heart_count();

-- Save count trigger
CREATE OR REPLACE FUNCTION public.update_hub_save_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.hubs SET save_count = save_count + 1 WHERE id = NEW.hub_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.hubs SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.hub_id;
  END IF; RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER saved_hubs_update_save_count
  AFTER INSERT OR DELETE ON public.saved_hubs FOR EACH ROW EXECUTE FUNCTION public.update_hub_save_count();

-- SECURITY DEFINER functions for atomic RPC increments (bypass RLS)
CREATE OR REPLACE FUNCTION public.increment_view_count(p_hub_id uuid)
  RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ UPDATE public.hubs SET view_count = view_count + 1 WHERE id = p_hub_id; $$;
CREATE OR REPLACE FUNCTION public.increment_share_count(p_hub_id uuid)
  RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ UPDATE public.hubs SET share_count = share_count + 1 WHERE id = p_hub_id; $$;

-- Profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saved_count integer NOT NULL DEFAULT 0;

-- Backfill + trigger for saved_count on profiles
UPDATE public.profiles p SET saved_count = (SELECT COUNT(*) FROM public.saved_hubs WHERE user_id = p.id);
CREATE OR REPLACE FUNCTION public.update_profile_saved_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.profiles SET saved_count = saved_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.profiles SET saved_count = GREATEST(saved_count - 1, 0) WHERE id = OLD.user_id;
  END IF; RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER saved_hubs_update_profile_saved_count
  AFTER INSERT OR DELETE ON public.saved_hubs FOR EACH ROW EXECUTE FUNCTION public.update_profile_saved_count();
```

**Still needs to be run** (username + per-user slug uniqueness):

```sql
-- Add username to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

UPDATE public.profiles
SET username = REGEXP_REPLACE(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(SPLIT_PART(email, '@', 1)), '[^a-z0-9-]+', '-', 'g')), '-+', '-', 'g')
WHERE username IS NULL;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Update signup trigger to auto-set username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    new.id,
    new.email,
    REGEXP_REPLACE(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(SPLIT_PART(new.email, '@', 1)), '[^a-z0-9-]+', '-', 'g')), '-+', '-', 'g')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow public read of profiles (username appears in public hub URLs)
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Change hub slug uniqueness: global → per-user
ALTER TABLE public.hubs DROP CONSTRAINT IF EXISTS hubs_slug_key;
ALTER TABLE public.hubs ADD CONSTRAINT hubs_slug_user_unique UNIQUE (user_id, slug);

-- Username confirmation flag (used by /setup page)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_confirmed boolean NOT NULL DEFAULT false;
-- Mark existing users as already confirmed (they went through the migration)
UPDATE public.profiles SET username_confirmed = true WHERE username IS NOT NULL;
```

**Feedback table + account moderation (2026-05-30):**

```sql
-- Feedback table
CREATE TABLE public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved'))
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can submit feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);

-- Account moderation status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text
  NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active', 'restricted', 'suspended', 'terminated'));

-- Restrict hub creation for non-active accounts (replaces the simple INSERT policy)
DROP POLICY IF EXISTS "Users can insert own hubs" ON public.hubs;
CREATE POLICY "Users can insert own hubs" ON public.hubs FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_status = 'active'
  ));
```

## Clone Hub

`POST /api/hub/[hubId]/clone` — owner-only. Body: `{ title: string, selectedBlockIds: string[] }`.

- Verifies ownership via `eq('user_id', user.id)` on the source hub
- Auto-deduplicates slug: tries `base`, `base-2`, … `base-10`, falls back to `base-${Date.now()}`
- Creates new hub copying: `mode`, `redirect_url`, `description`, `theme_color`, `template_id`, `collection_id`, `tags`; `privacy_mode` always `'private'`
- Inserts selected blocks filtered by `hub_id = hubId AND id IN selectedBlockIds`, re-numbered `sort_order 0,1,2,…`
- Returns `{ hub: { id, slug } }`; client redirects to `/dashboard/hub/[id]/edit`

`CloneHubModal.tsx` — all blocks pre-checked; All/None shortcuts; type-color badges; title pre-filled "Copy of …". Checklist checked state is localStorage-keyed by block ID — new block IDs start fresh automatically, no reset needed.

## Admin Dashboard

**Route:** `/admin` — server component; gated by `user.email === 'christine@websketching.com'`; uses `createAdminClient()` (service role, bypasses RLS).

**Requires:** `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel environment variables.

**Tabs (URL-based via `searchParams.tab`):**
- `''` (Overview) — stat cards (users, active 7d/30d, hubs, blocks, new feedback) + users table with activity status + account_status badges; View → links to user detail
- `feedback` — FeedbackPanel client component; filter new/read/resolved; Mark read / Resolve buttons
- `cards` — all 9 welcome cards with full body text and CTA
- `roadmap` — hardcoded ROADMAP const in `app/admin/page.tsx`; edit in code

**User detail:** `/admin/users/[id]` — sticky red "Admin Access — Read Only" banner; profile info, activity stats, hub table with block counts; ModerationPanel.

## Account Moderation

**ModerationPanel** (`components/ModerationPanel.tsx`) — client component on user detail page.

| Action | API | Effect |
|---|---|---|
| Restrict | PATCH /status `{action:'restrict'}` | Sets `account_status='restricted'`; RLS blocks new hub creation |
| Unrestrict | PATCH /status `{action:'unrestrict'}` | Sets `account_status='active'` |
| Suspend | PATCH /status `{action:'suspend'}` | Supabase auth ban (876000h) + `account_status='suspended'` |
| Unsuspend | PATCH /status `{action:'unsuspend'}` | Lifts ban + `account_status='active'` |
| Remove content | DELETE /content | Deletes all hubs (cascades blocks, saved_hubs, hub_hearts) |
| Terminate | DELETE /[id] | Ban + `account_status='terminated'` + delete hubs; keeps auth record (email stays taken); requires typing username |
| GDPR delete | DELETE /gdpr | True auth user deletion; frees email; only for verified erasure requests; requires typing username |

RLS error code `42501` maps to friendly "Your account has been restricted" message in HubForm.

## Feedback System

Users submit via **Send feedback** in the ⚙ settings dropdown → `FeedbackModal` → `POST /api/feedback`.
Admin views and manages via `/admin?tab=feedback` → `FeedbackPanel` → `PATCH /api/admin/feedback/[id]`.
Status flow: `new` → `read` → `resolved`.
