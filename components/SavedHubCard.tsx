'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

type SavedHubData = {
  id: string
  hub_id: string
  collection_id: string | null
  last_viewed_at: string | null
  hub: {
    id: string
    title: string
    slug: string
    theme_color: string | null
    template_id: string | null
    updated_at: string
    privacy_mode: string
  }
  owner_username: string
}

export default function SavedHubCard({
  savedHub,
  folders,
  onUnsave,
  onCollectionChange,
}: {
  savedHub: SavedHubData
  folders: { id: string; title: string }[]
  onUnsave: (hubId: string) => void
  onCollectionChange: (hubId: string, collectionId: string | null) => void
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { hub, owner_username } = savedHub
  const currentCollection = folders.find(f => f.id === savedHub.collection_id)

  const isUpdated = savedHub.last_viewed_at !== null
    && new Date(hub.updated_at) > new Date(savedHub.last_viewed_at)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const publicUrl = `/h/${owner_username}/${hub.slug}`

  return (
    <div
      onClick={() => router.push(publicUrl)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5 cursor-pointer hover:shadow-md transition-all"
      style={{ borderLeft: `3px solid ${hub.theme_color ?? '#E5E7EB'}` }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 leading-snug">{hub.title}</h3>
            {isUpdated && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-px rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                Updated
              </span>
            )}
          </div>
          <div className="mt-0.5 space-y-0.5">
            <p className="text-[11px] text-gray-400 leading-tight">by @{owner_username}</p>
            {currentCollection && (
              <p className="text-[11px] text-gray-300 leading-tight">📁 {currentCollection.title}</p>
            )}
          </div>
        </div>

        {/* Right: template badge + kebab */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div ref={menuRef} className="relative mb-0.5">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              aria-label="Actions"
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md px-2 py-0.5 transition-colors text-lg leading-none"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); router.push(publicUrl); setMenuOpen(false) }}
                  className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Hub
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    onUnsave(savedHub.hub_id)
                    setMenuOpen(false)
                  }}
                  className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove from Saved
                </button>
                <div
                  onClick={e => e.stopPropagation()}
                  className="px-4 py-2.5 border-t border-gray-100"
                >
                  <p className="text-xs text-gray-400 mb-1.5">Move to Collection</p>
                  <select
                    value={savedHub.collection_id ?? ''}
                    onChange={e => { onCollectionChange(savedHub.hub_id, e.target.value || null); setMenuOpen(false) }}
                    title="Move to Collection"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">No Collection</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {hub.template_id && TEMPLATE_LABELS[hub.template_id] && (
            <span className="text-[11px] font-normal px-1.5 py-px rounded-full bg-stone-50 text-stone-400">
              {TEMPLATE_LABELS[hub.template_id].emoji} {TEMPLATE_LABELS[hub.template_id].label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
