import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChecklistBlock from '@/components/ChecklistBlock'

// ── Block icons ──────────────────────────────────────────────────────────────

const BLOCK_ICONS: Record<string, string> = {
  text:      '📝',
  checklist: '☑️',
  audio:     '🎙️',
  link:      '🔗',
  phone:     '📞',
  file:      '📄',
  image:     '🖼️',
  timeline:  '📅',
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

// ── Card wrapper ─────────────────────────────────────────────────────────────

function BlockCard({
  type,
  label,
  date,
  children,
}: {
  type: string
  label?: string
  date?: string
  children: React.ReactNode
}) {
  const icon = BLOCK_ICONS[type]
  const hasHeader = !!(label)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {hasHeader && (
        <div className="flex items-start gap-3 px-5 pt-5 pb-1">
          {icon && <span className="text-xl leading-none mt-0.5 flex-shrink-0">{icon}</span>}
          <h3 className="text-lg font-semibold text-gray-800 leading-snug">{label}</h3>
        </div>
      )}
      {date && (
        <p className="text-sm text-gray-400 px-5 pt-2">{formatDate(date)}</p>
      )}
      <div className={hasHeader || date ? 'px-5 pb-5 pt-3' : 'p-5'}>{children}</div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: hub } = await supabase
    .from('hubs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!hub) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === hub.user_id

  if (hub.privacy_mode === 'private') {
    if (!user) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-5xl mb-4 select-none">&#128274;</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">This hub is private</h1>
            <p className="text-base text-gray-500 mb-6">Sign in as the owner to view this hub.</p>
            <a
              href={`/login?next=/h/${slug}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      )
    }
    if (user.id !== hub.user_id) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-5xl mb-4 select-none">&#128274;</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">This hub is private</h1>
            <p className="text-base text-gray-500">You don't have permission to view this hub.</p>
          </div>
        </div>
      )
    }
  }

  if (hub.mode === 'redirect' && hub.redirect_url) {
    redirect(hub.redirect_url)
  }

  const { data: contentBlocks } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('hub_id', hub.id)
    .order('sort_order')

  const color = hub.theme_color ?? '#3B82F6'

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Owner edit bar */}
      {isOwner && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-20">
          <span className="text-xs text-gray-400">You are viewing your hub</span>
          <a
            href={`/dashboard/hub/${hub.id}/edit`}
            className="text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
          >
            Edit hub
          </a>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {hub.image_url ? (
        <>
          {/* Image hero — title only, no description in overlay */}
          <div
            className="relative w-full overflow-hidden"
            style={{ height: 'clamp(260px, 45vw, 460px)' }}
          >
            <img
              src={hub.image_url}
              alt={hub.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 md:px-10 md:pb-10">
              <h1
                className="text-[2rem] md:text-[3rem] font-bold text-white leading-tight"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}
              >
                {hub.title}
              </h1>
            </div>
          </div>
          {/* Description below image */}
          {hub.description && (
            <div className="max-w-xl mx-auto px-4 pt-6 pb-0">
              <p className="text-[1.05rem] text-gray-600 leading-relaxed">
                {hub.description}
              </p>
            </div>
          )}
        </>
      ) : (
        <div
          className="relative px-6 py-16 md:py-24 text-center"
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/15 pointer-events-none" />
          <div className="relative">
            <h1 className="text-[2rem] md:text-[3rem] font-bold text-white leading-tight">
              {hub.title}
            </h1>
            {hub.description && (
              <p className="mt-3 text-white/85 text-[1.05rem] leading-relaxed max-w-sm mx-auto">
                {hub.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Content blocks ───────────────────────────────────────────────── */}
      <main className="max-w-xl mx-auto px-4 py-8 space-y-4">
        {contentBlocks && contentBlocks.length > 0 ? (
          contentBlocks.map(block => {
            const d = block.data as any

            // ── Link button ────────────────────────────────────────────────
            if (block.type === 'link') {
              if (!d.url) return null
              return (
                <a
                  key={block.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full font-semibold py-4 px-6 rounded-2xl shadow-sm text-white text-base transition-all active:scale-[0.98] active:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  <span>🔗</span>
                  <span>{d.label || d.url}</span>
                </a>
              )
            }

            // ── Phone button ───────────────────────────────────────────────
            if (block.type === 'phone') {
              if (!d.url) return null
              return (
                <a
                  key={block.id}
                  href={`tel:${d.url}`}
                  className="flex items-center justify-center gap-2.5 w-full font-semibold py-4 px-6 rounded-2xl shadow-sm text-white text-base transition-all active:scale-[0.98] active:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  <span>📞</span>
                  <span>{d.label || d.url}</span>
                </a>
              )
            }

            // ── File button ────────────────────────────────────────────────
            if (block.type === 'file') {
              if (!d.url) return null
              return (
                <a
                  key={block.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full font-semibold py-4 px-6 rounded-2xl shadow-sm text-white text-base transition-all active:scale-[0.98] active:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  <span>📄</span>
                  <span>{d.label || 'File'}</span>
                </a>
              )
            }

            // ── Audio / Voice note ─────────────────────────────────────────
            if (block.type === 'audio') {
              if (!d.url) return null
              return (
                <BlockCard key={block.id} type="audio" label={d.label} date={d.date}>
                  <audio src={d.url} controls className="w-full" />
                </BlockCard>
              )
            }

            // ── Text / Note ────────────────────────────────────────────────
            if (block.type === 'text') {
              return (
                <BlockCard key={block.id} type="text" label={d.label} date={d.date}>
                  <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed">
                    {d.text}
                  </p>
                </BlockCard>
              )
            }

            // ── Checklist ──────────────────────────────────────────────────
            if (block.type === 'checklist') {
              return (
                <ChecklistBlock
                  key={block.id}
                  blockId={block.id}
                  label={d.label ?? ''}
                  items={d.items ?? []}
                  color={color}
                />
              )
            }

            // ── Image ──────────────────────────────────────────────────────
            if (block.type === 'image') {
              if (!d.url) return null
              return (
                <div key={block.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <img src={d.url} alt={d.caption || ''} className="w-full object-cover" />
                  {d.caption && (
                    <p className="text-sm text-gray-500 px-5 py-3">{d.caption}</p>
                  )}
                </div>
              )
            }

            // ── Timeline ───────────────────────────────────────────────────
            if (block.type === 'timeline') {
              return (
                <BlockCard key={block.id} type="timeline" label={d.label}>
                  <div
                    className="relative pl-6 border-l-2"
                    style={{ borderColor: color + '50' }}
                  >
                    {(d.events ?? []).map((event: any, i: number) => (
                      <div key={event.id ?? i} className="mb-5 last:mb-0 relative">
                        <span
                          className="absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        {event.date && (
                          <p className="text-sm text-gray-400 mb-0.5">{event.date}</p>
                        )}
                        <p className="text-base text-gray-700">{event.text}</p>
                      </div>
                    ))}
                  </div>
                </BlockCard>
              )
            }

            return null
          })
        ) : (
          <p className="text-center text-gray-400 text-base py-16">No content added yet.</p>
        )}
      </main>

      <footer className="text-center py-12 text-xs text-gray-300">
        © 2026 QRMagNotes | Developed by{' '}
        <a
          href="https://websketching.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400 transition-colors underline"
        >
          Websketching
        </a>
      </footer>
    </div>
  )
}
