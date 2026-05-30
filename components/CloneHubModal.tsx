'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ContentBlock } from '@/lib/types'

const TYPE_LABEL: Record<string, string> = {
  checklist:       'checklist',
  text:            'text',
  image:           'image',
  link:            'link',
  phone:           'phone',
  file:            'file',
  audio:           'audio',
  timeline:        'timeline',
  note:            'note',
  collection_menu: 'menu',
}

const TYPE_COLOR: Record<string, string> = {
  checklist:       'bg-emerald-50 text-emerald-600',
  text:            'bg-stone-50 text-stone-500',
  image:           'bg-blue-50 text-blue-500',
  link:            'bg-indigo-50 text-indigo-500',
  phone:           'bg-purple-50 text-purple-500',
  file:            'bg-amber-50 text-amber-600',
  audio:           'bg-pink-50 text-pink-500',
  timeline:        'bg-teal-50 text-teal-600',
  note:            'bg-stone-50 text-stone-500',
  collection_menu: 'bg-blue-50 text-blue-500',
}

export default function CloneHubModal({
  hubId,
  hubTitle,
  onClose,
}: {
  hubId: string
  hubTitle: string
  onClose: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState(`Copy of ${hubTitle}`)
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [fetching, setFetching] = useState(true)
  const [cloning, setCloning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/hub/${hubId}/content_blocks`)
      .then(r => r.json())
      .then(d => {
        const b: ContentBlock[] = d.content_blocks ?? []
        setBlocks(b)
        setSelected(new Set(b.map(bl => bl.id)))
      })
      .catch(() => setError('Failed to load blocks'))
      .finally(() => setFetching(false))
  }, [hubId])

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  async function handleClone() {
    if (!title.trim()) { setError('Name is required'); return }
    if (selected.size === 0) { setError('Select at least one block'); return }
    setCloning(true)
    setError(null)
    const res = await fetch(`/api/hub/${hubId}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), selectedBlockIds: [...selected] }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setCloning(false)
      return
    }
    router.push(`/dashboard/hub/${data.hub.id}/edit`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-stone-800">Clone Hub</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors p-1 -mr-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Name */}
          <label className="block mb-5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Name</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
              placeholder="New hub name"
              autoFocus
            />
          </label>

          {/* Block selection header */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Include blocks</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelected(new Set(blocks.map(b => b.id)))}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                None
              </button>
            </div>
          </div>

          {/* Block list */}
          {fetching ? (
            <div className="py-10 text-center text-sm text-stone-400">Loading…</div>
          ) : blocks.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400">No blocks found</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {blocks.map(block => {
                const label = block.data?.label || TYPE_LABEL[block.type] || block.type
                const isChecked = selected.has(block.id)
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => toggle(block.id)}
                    className={`w-full flex items-center gap-3 py-3 text-left transition-opacity ${isChecked ? 'opacity-100' : 'opacity-40'}`}
                  >
                    <span className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                      isChecked ? 'bg-stone-700 border-stone-700' : 'border-stone-300 bg-white'
                    }`}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 text-sm text-stone-700 leading-tight truncate">{label}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${TYPE_COLOR[block.type] ?? 'bg-stone-50 text-stone-400'}`}>
                      {TYPE_LABEL[block.type] ?? block.type}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pb-6 pt-3 border-t border-stone-100">
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClone}
              disabled={cloning || fetching || selected.size === 0}
              className="flex-1 py-3 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cloning ? 'Cloning…' : 'Clone Hub'}
            </button>
          </div>
          <p className="text-[11px] text-stone-400 text-center mt-2.5">
            {selected.size} of {blocks.length} block{blocks.length !== 1 ? 's' : ''} selected · saved as private
          </p>
        </div>
      </div>
    </div>
  )
}
