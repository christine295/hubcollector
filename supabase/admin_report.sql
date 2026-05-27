-- ============================================================
-- QRMagNotes — Internal Admin / Testing Report
-- Run in Supabase SQL Editor (authenticated as postgres / service role)
-- NOT exposed publicly. RLS does not apply in the SQL editor.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. PER-USER SUMMARY
-- ════════════════════════════════════════════════════════════
-- Columns marked [not tracked] require additional instrumentation.

WITH user_stats AS (
  SELECT
    p.id                                                          AS user_id,
    p.email,
    p.username,
    p.created_at                                                  AS signed_up_at,
    u.last_sign_in_at,

    COUNT(DISTINCT col.id)                                        AS collections_count,
    COUNT(DISTINCT h.id)                                         AS hubs_count,
    COUNT(DISTINCT cb.id)                                        AS blocks_count,

    -- Photo/image blocks (proxy for uploaded photos — not a share count)
    COUNT(DISTINCT cb.id) FILTER (WHERE cb.type = 'image')       AS image_blocks,
    -- Audio/voice note blocks
    COUNT(DISTINCT cb.id) FILTER (WHERE cb.type = 'audio')       AS audio_blocks,

    -- Most recent content activity across hubs and blocks
    GREATEST(
      MAX(h.updated_at),
      MAX(cb.updated_at)
    )                                                             AS last_content_activity_at

  FROM public.profiles p
  LEFT JOIN auth.users u            ON u.id        = p.id
  LEFT JOIN public.collections col  ON col.user_id = p.id
  LEFT JOIN public.hubs h           ON h.user_id   = p.id
  LEFT JOIN public.content_blocks cb ON cb.hub_id  = h.id
  GROUP BY p.id, p.email, p.username, p.created_at, u.last_sign_in_at
)
SELECT
  user_id,
  email,
  username,
  signed_up_at::date                                AS signup_date,
  last_sign_in_at::date                             AS last_signin_date,
  collections_count,
  hubs_count,
  blocks_count,
  image_blocks,
  audio_blocks,

  -- QR scan count: NOT TRACKED — see "Missing Data" section below
  NULL::int                                         AS qr_scans,
  -- Collaborator invites: NOT TRACKED (feature not built)
  NULL::int                                         AS invites_sent,

  COALESCE(last_content_activity_at, signed_up_at)::date  AS last_activity_date,

  CASE
    WHEN hubs_count = 0 AND signed_up_at > now() - interval '7 days'
      THEN 'just signed up'
    WHEN hubs_count = 0
      THEN 'no activity'
    WHEN COALESCE(last_content_activity_at, signed_up_at) > now() - interval '7 days'
      THEN 'active'
    WHEN COALESCE(last_content_activity_at, signed_up_at) > now() - interval '30 days'
      THEN 'recent'
    ELSE 'inactive'
  END                                               AS status

FROM user_stats
ORDER BY last_activity_date DESC NULLS LAST;


-- ════════════════════════════════════════════════════════════
-- 2. OVERALL TOTALS
-- ════════════════════════════════════════════════════════════

SELECT
  COUNT(DISTINCT p.id)                                                                    AS total_users,
  COUNT(DISTINCT p.id) FILTER (WHERE u.last_sign_in_at > now() - interval '7 days')      AS active_users_7d,
  COUNT(DISTINCT p.id) FILTER (WHERE u.last_sign_in_at > now() - interval '30 days')     AS active_users_30d,
  COUNT(DISTINCT col.id)                                                                  AS total_collections,
  COUNT(DISTINCT h.id)                                                                    AS total_hubs,
  COUNT(DISTINCT cb.id)                                                                   AS total_blocks,
  ROUND(
    COUNT(DISTINCT h.id)::numeric / NULLIF(COUNT(DISTINCT p.id), 0), 1
  )                                                                                       AS avg_hubs_per_user,
  ROUND(
    COUNT(DISTINCT cb.id)::numeric / NULLIF(COUNT(DISTINCT h.id), 0), 1
  )                                                                                       AS avg_blocks_per_hub

FROM public.profiles p
LEFT JOIN auth.users u             ON u.id        = p.id
LEFT JOIN public.collections col   ON col.user_id = p.id
LEFT JOIN public.hubs h            ON h.user_id   = p.id
LEFT JOIN public.content_blocks cb ON cb.hub_id   = h.id;


-- ════════════════════════════════════════════════════════════
-- 3. NEWEST USERS (last 10)
-- ════════════════════════════════════════════════════════════

SELECT
  username,
  email,
  created_at::date  AS joined_date
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;


-- ════════════════════════════════════════════════════════════
-- 4. MOST ACTIVE TESTERS (by block count, top 10)
-- ════════════════════════════════════════════════════════════

SELECT
  p.username,
  p.email,
  COUNT(DISTINCT h.id)                            AS hubs,
  COUNT(DISTINCT col.id)                          AS collections,
  COUNT(DISTINCT cb.id)                           AS blocks,
  COUNT(DISTINCT cb.id) FILTER (WHERE cb.type = 'image') AS images,
  COUNT(DISTINCT cb.id) FILTER (WHERE cb.type = 'audio') AS audio_notes,
  MAX(GREATEST(h.updated_at, cb.updated_at))::date AS last_active
FROM public.profiles p
LEFT JOIN public.collections col   ON col.user_id = p.id
LEFT JOIN public.hubs h            ON h.user_id   = p.id
LEFT JOIN public.content_blocks cb ON cb.hub_id   = h.id
GROUP BY p.id, p.username, p.email
ORDER BY blocks DESC, hubs DESC
LIMIT 10;


-- ════════════════════════════════════════════════════════════
-- 5. TEMPLATE USAGE BREAKDOWN
-- ════════════════════════════════════════════════════════════

SELECT
  COALESCE(template_id, '(none / blank)')  AS template,
  COUNT(*)                                 AS hub_count,
  COUNT(DISTINCT user_id)                  AS users_using
FROM public.hubs
GROUP BY template_id
ORDER BY hub_count DESC;


-- ════════════════════════════════════════════════════════════
-- 6. BLOCK TYPE BREAKDOWN
-- ════════════════════════════════════════════════════════════

SELECT
  type,
  COUNT(*)  AS total_blocks
FROM public.content_blocks
GROUP BY type
ORDER BY total_blocks DESC;


-- ════════════════════════════════════════════════════════════
-- 7. HUB PRIVACY + MODE BREAKDOWN
-- ════════════════════════════════════════════════════════════

SELECT
  privacy_mode,
  mode,
  COUNT(*)  AS hub_count
FROM public.hubs
GROUP BY privacy_mode, mode
ORDER BY hub_count DESC;


-- ════════════════════════════════════════════════════════════
-- MISSING DATA — what is not currently tracked
-- ════════════════════════════════════════════════════════════
--
-- The following columns in query 1 return NULL because the data
-- is not captured anywhere in the current schema:
--
-- 1. QR SCANS / HUB ACCESSES
--    No scan tracking exists. The public hub page (/h/[username]/[slug])
--    renders but does not log visits.
--
--    Minimum to add:
--      CREATE TABLE public.hub_scans (
--        id         uuid primary key default gen_random_uuid(),
--        hub_id     uuid not null references public.hubs(id) on delete cascade,
--        scanned_at timestamptz not null default now(),
--        user_agent text   -- optional; strip to browser family only for privacy
--      );
--      -- Insert via the /h/[slug] server component or an Edge Function,
--      -- not from the client (avoids RLS complications).
--      -- No RLS needed if inserts are server-only and selects are owner-only.
--
-- 2. COLLABORATOR INVITES
--    The collaboration/invite feature has not been built yet.
--    No action needed until the feature exists.
--
-- 3. UPLOADED/SHARED PHOTOS
--    Image uploads are tracked indirectly: each uploaded photo creates a
--    content_blocks row with type = 'image'. The `image_blocks` column in
--    query 1 is a reliable proxy for the number of uploaded photos.
--    A dedicated photo-sharing table is only needed if sharing becomes
--    its own feature separate from hub content blocks.
