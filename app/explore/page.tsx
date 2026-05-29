import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

const TEMPLATE_LABELS: Record<string, { emoji: string; label: string }> = {
  artwork:      { emoji: '🎨', label: 'Artwork Archive' },
  book:         { emoji: '📖', label: 'Book Notes' },
  diary:        { emoji: '📔', label: 'Diary / Life Log' },
  garden:       { emoji: '🌱', label: 'Garden Planner' },
  goal:         { emoji: '🎯', label: 'Goal Tracker' },
  grocery:      { emoji: '🛒', label: 'Grocery List' },
  hub_collector:{ emoji: '🔗', label: 'Hub Menu' },
  journal:      { emoji: '📓', label: 'Daily Reflection' },
  maintenance:  { emoji: '🔧', label: 'Home Maintenance' },
  packing:      { emoji: '🧳', label: 'Packing List' },
  pet:          { emoji: '🐾', label: 'Pet Profile' },
  plant:        { emoji: '🪴', label: 'Plant Profile' },
  recipe:       { emoji: '🍳', label: 'Recipe' },
  ritual:       { emoji: '🕯️', label: 'Ritual' },
  shadow_work:  { emoji: '🌑', label: 'Shadow Work' },
  travel:       { emoji: '✈️', label: 'Travel Journal' },
  vehicle:      { emoji: '🚗', label: 'Vehicle' },
  box:          { emoji: '📦', label: "What's in the Box?" },
  workout:      { emoji: '💪', label: 'Workout' },
}

const FILTER_TEMPLATES = [
  { id: 'recipe',   emoji: '🍳', label: 'Recipes' },
  { id: 'ritual',   emoji: '🕯️', label: 'Rituals' },
  { id: 'pet',      emoji: '🐾', label: 'Pets' },
  { id: 'plant',    emoji: '🪴', label: 'Plants' },
  { id: 'book',     emoji: '📖', label: 'Books' },
  { id: 'journal',  emoji: '📓', label: 'Journals' },
  { id: 'travel',   emoji: '✈️', label: 'Travel' },
  { id: 'workout',  emoji: '💪', label: 'Fitness' },
  { id: 'garden',   emoji: '🌱', label: 'Gardens' },
  { id: 'artwork',  emoji: '🎨', label: 'Art' },
  { id: 'diary',    emoji: '📔', label: 'Diaries' },
  { id: 'box',      emoji: '📦', label: 'Storage' },
  { id: 'maintenance', emoji: '🔧', label: 'Home' },
]

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const { template: templateFilter } = await searchParams
  const supabase = await createClient()

  // Leaderboard queries — graceful: resolve to null if columns not yet migrated
  const [
    { data: topViewed },
    { data: topHearted },
    { data: topSaved },
    { data: topShared },
    hubsResult,
    authResult,
  ] = await Promise.all([
    supabase.from('hubs').select('id, title, slug, theme_color, view_count, user_id')
      .eq('privacy_mode', 'public').eq('mode', 'landing')
      .order('view_count' as any, { ascending: false }).limit(5),
    supabase.from('hubs').select('id, title, slug, theme_color, heart_count, user_id')
      .eq('privacy_mode', 'public').eq('mode', 'landing')
      .order('heart_count' as any, { ascending: false }).limit(5),
    supabase.from('hubs').select('id, title, slug, theme_color, save_count, user_id')
      .eq('privacy_mode', 'public').eq('mode', 'landing')
      .order('save_count' as any, { ascending: false }).limit(5),
    supabase.from('hubs').select('id, title, slug, theme_color, share_count, user_id')
      .eq('privacy_mode', 'public').eq('mode', 'landing')
      .order('share_count' as any, { ascending: false }).limit(5),
    (async () => {
      let q = supabase
        .from('hubs')
        .select('id, title, description, slug, theme_color, template_id, user_id, updated_at')
        .eq('privacy_mode', 'public')
        .eq('mode', 'landing')
        .order('updated_at', { ascending: false })
        .limit(48)
      if (templateFilter && TEMPLATE_LABELS[templateFilter]) q = q.eq('template_id', templateFilter)
      return q
    })(),
    supabase.auth.getUser(),
  ] as const)

  const hubs = (hubsResult as any).data as any[] | null
  const user = (authResult as any).data?.user ?? null

  // Filter leaderboard results to non-zero counts only
  const leaderViewed = (topViewed ?? []).filter((h: any) => (h.view_count ?? 0) > 0)
  const leaderHearted = (topHearted ?? []).filter((h: any) => (h.heart_count ?? 0) > 0)
  const leaderSaved = (topSaved ?? []).filter((h: any) => (h.save_count ?? 0) > 0)
  const leaderShared = (topShared ?? []).filter((h: any) => (h.share_count ?? 0) > 0)
  const showLeaderboard = leaderViewed.length > 0 || leaderHearted.length > 0 || leaderSaved.length > 0 || leaderShared.length > 0

  // Collect all user_ids (leaderboard + grid) for one profile fetch
  const allLeaderHubs = [...leaderViewed, ...leaderHearted, ...leaderSaved, ...leaderShared]
  const allUserIds = [...new Set([
    ...(hubs ?? []).map((h: any) => h.user_id),
    ...allLeaderHubs.map((h: any) => h.user_id),
  ])]
  const { data: profiles } = allUserIds.length > 0
    ? await supabase.from('profiles').select('id, username').in('id', allUserIds)
    : { data: [] }
  const usernameMap: Record<string, string> = {}
  ;(profiles ?? []).forEach((p: any) => { usernameMap[p.id] = p.username })

  // Fetch heart counts for grid hubs
  const hubIds = (hubs ?? []).map((h: any) => h.id)
  const { data: heartRows } = hubIds.length > 0
    ? await supabase.from('hub_hearts').select('hub_id').in('hub_id', hubIds)
    : { data: [] }
  const heartCounts: Record<string, number> = {}
  ;(heartRows ?? []).forEach((h: any) => { heartCounts[h.hub_id] = (heartCounts[h.hub_id] ?? 0) + 1 })

  const enrichedHubs: any[] = (hubs ?? []).map((h: any) => ({
    ...h,
    owner_username: usernameMap[h.user_id] ?? '',
    hearts: (h.heart_count ?? heartCounts[h.id]) ?? 0,
  }))

  const activeTemplate = templateFilter && TEMPLATE_LABELS[templateFilter]
    ? TEMPLATE_LABELS[templateFilter]
    : null

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-stone-200 px-4 py-3.5 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-stone-900">Explore HubCollector™</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
                Dashboard »
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors"
              >
                Create free »
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Intro */}
        <div className="mb-6">
          <p className="text-sm text-stone-500 leading-[1.65]">
            Public Hubs created by the HubCollector community — recipes, rituals, journals, plant profiles, and more.
            {!user && (
              <> <Link href="/login" className="text-blue-500 hover:text-blue-700 underline underline-offset-2">Create your own »</Link></>
            )}
          </p>
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-stone-700 mb-3">Top Hubs</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: 'Most Viewed',  icon: '👁',  data: leaderViewed,  metricKey: 'view_count'  },
                { label: 'Most Hearted', icon: '♥',   data: leaderHearted, metricKey: 'heart_count' },
                { label: 'Most Saved',   icon: '🔖',  data: leaderSaved,   metricKey: 'save_count'  },
                { label: 'Most Shared',  icon: '↗',   data: leaderShared,  metricKey: 'share_count' },
              ].filter(col => col.data.length > 0).map(col => (
                <div key={col.label} className="bg-white rounded-xl border border-stone-100 p-4">
                  <h3 className="text-xs font-semibold text-stone-500 mb-3 flex items-center gap-1.5">
                    <span>{col.icon}</span>{col.label}
                  </h3>
                  <ol className="space-y-2.5">
                    {col.data.map((hub: any, i: number) => (
                      <li key={hub.id}>
                        <a
                          href={`/h/${usernameMap[hub.user_id] ?? ''}/${hub.slug}`}
                          className="flex items-center gap-2 group"
                        >
                          <span className="text-[10px] text-stone-300 w-3 shrink-0 font-mono">{i + 1}</span>
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: hub.theme_color ?? '#E5E7EB' }}
                          />
                          <span className="flex-1 text-xs text-stone-700 truncate group-hover:text-stone-900 transition-colors leading-tight">
                            {hub.title}
                          </span>
                          <span className="text-[10px] text-stone-400 shrink-0 font-medium tabular-nums">
                            {formatCount(hub[col.metricKey] ?? 0)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Template filter pills */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          <Link
            href="/explore"
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !templateFilter
                ? 'bg-stone-800 text-white border-stone-800'
                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
            }`}
          >
            All
          </Link>
          {FILTER_TEMPLATES.map(t => (
            <Link
              key={t.id}
              href={`/explore?template=${t.id}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                templateFilter === t.id
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
              }`}
            >
              {t.emoji} {t.label}
            </Link>
          ))}
        </div>

        {/* Results count */}
        {enrichedHubs.length > 0 && (
          <p className="text-xs text-stone-400 mb-4">
            {enrichedHubs.length} Hub{enrichedHubs.length !== 1 ? 's' : ''}
            {activeTemplate ? ` · ${activeTemplate.emoji} ${activeTemplate.label}` : ''}
          </p>
        )}

        {/* Hub grid */}
        {enrichedHubs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">✦</div>
            <p className="text-stone-400 text-sm mb-4">
              {templateFilter ? `No public ${activeTemplate?.label ?? ''} Hubs yet.` : 'No public Hubs yet.'}
            </p>
            {!user && (
              <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2">
                Be the first — create a Hub »
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {enrichedHubs.map(hub => {
              const template = hub.template_id ? TEMPLATE_LABELS[hub.template_id] : null
              return (
                <div
                  key={hub.id}
                  className="bg-white rounded-xl border border-stone-100 hover:shadow-md transition-all overflow-hidden"
                  style={{ borderLeft: `3px solid ${hub.theme_color ?? '#E5E7EB'}` }}
                >
                  {/* Hub link — title + description */}
                  <a
                    href={`/h/${hub.owner_username}/${hub.slug}`}
                    className="block px-4 pt-4 pb-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-stone-900 leading-snug text-sm truncate">{hub.title}</h2>
                        {hub.description && (
                          <p className="text-xs text-stone-400 mt-0.5 leading-snug line-clamp-2">{hub.description}</p>
                        )}
                      </div>
                      {template && (
                        <span className="shrink-0 text-[11px] text-stone-400 bg-stone-50 px-1.5 py-px rounded-full whitespace-nowrap">
                          {template.emoji} {template.label}
                        </span>
                      )}
                    </div>
                  </a>
                  {/* Footer row — profile link + counts */}
                  <div className="flex items-center justify-between px-4 pb-3.5">
                    <a
                      href={`/h/${hub.owner_username}`}
                      className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      @{hub.owner_username}
                    </a>
                    {(hub.hearts > 0 || (hub.save_count ?? 0) > 0) && (
                      <span className="flex items-center gap-1.5 text-[10px]">
                        {hub.hearts > 0 && (
                          <span className="flex items-center gap-0.5 text-rose-300">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                            {hub.hearts}
                          </span>
                        )}
                        {(hub.save_count ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-blue-300">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                            </svg>
                            {hub.save_count}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
