'use client'

import { useState } from 'react'

// ── Inline SVG icons ─────────────────────────────────────────────────────────

type P = { className?: string }
const ic = (path: string, extra?: string) =>
  ({ className = 'w-4 h-4' }: P) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {path.split('|').map((d, i) => <path key={i} d={d} />)}
      {extra && <path d={extra} />}
    </svg>
  )

const NoteIcon     = ic('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2|M9 12h6|M9 16h4')
const CheckIcon    = ic('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2|M9 12l2 2 4-4')
const MicIcon      = ic('M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z|M19 10v1a7 7 0 01-14 0v-1|M12 19v3|M9 22h6')
const LinkIcon     = ic('M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71|M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71')
const PhoneIcon    = ic('M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z')
const FileIcon     = ic('M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z|M13 2v7h7')
const ClockIcon    = ({ className = 'w-4 h-4' }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
)
const ArrowUpRightIcon = ({ className = 'w-3.5 h-3.5' }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7M7 7h10v10" />
  </svg>
)
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
    strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M19 9l-7 7-7-7" />
  </svg>
)

function BlockIcon({ type, className = 'w-4 h-4' }: { type: string; className?: string }) {
  const props = { className }
  switch (type) {
    case 'text':      return <NoteIcon  {...props} />
    case 'checklist': return <CheckIcon {...props} />
    case 'audio':     return <MicIcon   {...props} />
    case 'link':      return <LinkIcon  {...props} />
    case 'phone':     return <PhoneIcon {...props} />
    case 'file':      return <FileIcon  {...props} />
    case 'timeline':  return <ClockIcon {...props} />
    default:          return null
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function defaultOpen(type: string, label: string): boolean {
  const l = label.toLowerCase()
  if (l.includes('overview') || l.includes('step') || l.includes('note') || l.includes('invocation') || l.includes('words')) return true
  if (l.includes('setup') || l.includes('correspond') || l.includes('photo') || l.includes('memor') || l.includes('follow') || l.includes('playlist') || l.includes('voice')) return false
  return true
}

// ── Checklist (self-contained, with localStorage) ────────────────────────────

function ChecklistItems({ blockId, items, color }: { blockId: string; items: { id: string; text: string }[]; color: string }) {
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const s = localStorage.getItem(`checklist-${blockId}`)
      return s ? new Set(JSON.parse(s)) : new Set()
    } catch { return new Set() }
  })

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem(`checklist-${blockId}`, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const allDone = items.length > 0 && items.every(i => checked.has(i.id))

  return (
    <div>
      <ul className="space-y-2.5">
        {items.map(item => (
          <li key={item.id}>
            <button type="button" onClick={() => toggle(item.id)}
              className="flex items-start gap-3 w-full text-left py-0.5 group"
            >
              <span
                className="mt-0.5 w-[1.0625rem] h-[1.0625rem] rounded border flex-shrink-0 flex items-center justify-center transition-colors"
                style={{ borderColor: checked.has(item.id) ? color : '#c7c4bf', backgroundColor: checked.has(item.id) ? color : 'transparent' }}
              >
                {checked.has(item.id) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className={`text-[0.875rem] leading-[1.6] transition-colors ${checked.has(item.id) ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                {item.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {allDone && (
        <button type="button"
          onClick={() => { setChecked(new Set()); try { localStorage.removeItem(`checklist-${blockId}`) } catch {} }}
          className="mt-4 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          Reset all
        </button>
      )}
    </div>
  )
}

// ── Collapsible Section ───────────────────────────────────────────────────────

function Section({
  type, label, open, onToggle, warm = false, children,
}: {
  type: string; label: string; open: boolean; onToggle: () => void; warm?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border overflow-hidden ${warm ? 'bg-stone-50/80 border-stone-100' : 'bg-white border-stone-100/80'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <span className="text-stone-400 flex-shrink-0">
          <BlockIcon type={type} />
        </span>
        <span className="flex-1 text-[0.875rem] font-semibold text-stone-800 tracking-[-0.01em] leading-snug">
          {label}
        </span>
        <ChevronIcon open={open} />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[4000px]' : 'max-h-0'}`}>
        {open && <div className="border-t border-stone-100 mx-5" />}
        <div className="px-5 pb-5 pt-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HubView({
  hub, blocks, color, isOwner,
}: {
  hub: any; blocks: any[]; color: string; isOwner: boolean
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {}
    blocks.forEach(b => { s[b.id] = defaultOpen(b.type, b.data?.label ?? '') })
    return s
  })

  const toggle = (id: string) => setOpen(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>

      {/* Owner bar */}
      {isOwner && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-stone-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-20">
          <span className="text-xs text-stone-400 tracking-wide">Viewing your hub</span>
          <a href={`/dashboard/hub/${hub.id}/edit`}
            className="text-xs font-medium text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 transition-colors"
          >
            Edit
          </a>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {hub.image_url ? (
        <>
          <div className="relative w-full overflow-hidden" style={{ height: 'clamp(280px, 48vw, 480px)' }}>
            <img src={hub.image_url} alt={hub.title}
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-10 md:pb-12">
              <h1
                className="text-[2rem] md:text-[2.75rem] font-bold text-white leading-tight tracking-[-0.025em]"
                style={{ textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}
              >
                {hub.title}
              </h1>
            </div>
          </div>
          {hub.description && (
            <div className="max-w-xl mx-auto px-6 pt-7 pb-1">
              <p className="text-[0.9375rem] text-stone-500 leading-[1.8] font-light">
                {hub.description}
              </p>
              <div className="mt-6 border-t border-stone-100" />
            </div>
          )}
        </>
      ) : (
        <div className="relative px-6 py-16 md:py-24 text-center" style={{ backgroundColor: color }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none" />
          <div className="relative">
            <h1 className="text-[2rem] md:text-[2.75rem] font-bold text-white leading-tight tracking-[-0.025em]">
              {hub.title}
            </h1>
            {hub.description && (
              <p className="mt-3 text-white/75 text-[0.9375rem] leading-[1.8] max-w-sm mx-auto font-light">
                {hub.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Blocks ────────────────────────────────────────────────────────── */}
      <main className="max-w-xl mx-auto px-4 py-8 space-y-2.5">
        {blocks.length > 0 ? blocks.map(block => {
          const d = block.data as any
          const isOpen = open[block.id] ?? true

          // ── Action blocks (link / phone / file) ─────────────────────────
          if (block.type === 'link' || block.type === 'phone' || block.type === 'file') {
            if (!d.url) return null
            const href = block.type === 'phone' ? `tel:${d.url}` : d.url
            return (
              <a
                key={block.id}
                href={href}
                {...(block.type !== 'phone' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex items-center gap-3.5 w-full px-5 py-4 rounded-xl border transition-all active:opacity-70 group"
                style={{ borderColor: `${color}30`, background: `${color}07` }}
              >
                <span className="flex-shrink-0" style={{ color }}>
                  <BlockIcon type={block.type} className="w-[1.0625rem] h-[1.0625rem]" />
                </span>
                <span className="flex-1 text-[0.9375rem] font-medium text-stone-800 leading-snug">
                  {d.label || d.url}
                </span>
                <ArrowUpRightIcon className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
              </a>
            )
          }

          // ── Image ────────────────────────────────────────────────────────
          if (block.type === 'image') {
            if (!d.url) return null
            return (
              <div key={block.id} className="my-2 rounded-xl overflow-hidden shadow-sm">
                <img src={d.url} alt={d.caption || ''} className="w-full object-cover" />
                {d.caption && (
                  <p className="text-xs text-stone-400 px-4 pt-2.5 pb-3 bg-white">
                    {d.caption}
                  </p>
                )}
              </div>
            )
          }

          // ── Collapsible blocks ───────────────────────────────────────────
          const label = d.label || block.type

          return (
            <Section
              key={block.id}
              type={block.type}
              label={label}
              open={isOpen}
              onToggle={() => toggle(block.id)}
              warm={block.type === 'checklist'}
            >
              {/* Text / Note */}
              {block.type === 'text' && (
                <>
                  {d.date && <p className="text-xs text-stone-400 mb-3">{formatDate(d.date)}</p>}
                  <p className="text-[0.9375rem] text-stone-600 whitespace-pre-line leading-[1.8]">
                    {d.text || <span className="text-stone-300 italic">No content yet.</span>}
                  </p>
                </>
              )}

              {/* Checklist */}
              {block.type === 'checklist' && (
                <ChecklistItems blockId={block.id} items={d.items ?? []} color={color} />
              )}

              {/* Audio */}
              {block.type === 'audio' && (
                <>
                  {d.date && <p className="text-xs text-stone-400 mb-3">{formatDate(d.date)}</p>}
                  {d.url
                    ? <audio src={d.url} controls className="w-full rounded-lg" />
                    : <p className="text-sm text-stone-300 italic">No recording yet.</p>
                  }
                </>
              )}

              {/* Timeline */}
              {block.type === 'timeline' && (
                <div className="relative pl-5 border-l" style={{ borderColor: `${color}35` }}>
                  {(d.events ?? []).map((ev: any, i: number) => (
                    <div key={ev.id ?? i} className="mb-5 last:mb-0 relative">
                      <span className="absolute -left-[18px] top-[5px] w-2.5 h-2.5 rounded-full ring-2 ring-[#FAF9F7]"
                        style={{ backgroundColor: color }} />
                      {ev.date && <p className="text-xs text-stone-400 mb-1">{ev.date}</p>}
                      <p className="text-[0.9375rem] text-stone-600 leading-[1.7]">{ev.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )
        }) : (
          <p className="text-center text-stone-400 text-sm py-16">No content yet.</p>
        )}
      </main>

      <footer className="text-center py-12 text-xs text-stone-300">
        © 2026 QRMagNotes | Developed by{' '}
        <a href="https://websketching.com" target="_blank" rel="noopener noreferrer"
          className="hover:text-stone-400 transition-colors underline">
          Websketching
        </a>
      </footer>
    </div>
  )
}
