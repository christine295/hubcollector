'use client'

import { useState } from 'react'

type FeedbackItem = {
  id: string
  message: string
  status: 'new' | 'read' | 'resolved'
  created_at: string
  profiles: { username: string | null; email: string } | null
}

const STATUS_STYLE: Record<string, string> = {
  new:      'bg-violet-50 text-violet-700 border border-violet-200',
  read:     'bg-stone-100 text-stone-500 border border-stone-200',
  resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FeedbackPanel({ initialFeedback }: { initialFeedback: FeedbackItem[] }) {
  const [items, setItems] = useState(initialFeedback)
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'resolved'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  async function setStatus(id: string, status: 'read' | 'resolved') {
    setUpdating(id)
    const res = await fetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setItems(prev => prev.map(f => f.id === id ? { ...f, status } : f))
    }
    setUpdating(null)
  }

  const counts = {
    all: items.length,
    new: items.filter(f => f.status === 'new').length,
    read: items.filter(f => f.status === 'read').length,
    resolved: items.filter(f => f.status === 'resolved').length,
  }

  const visible = filter === 'all' ? items : items.filter(f => f.status === filter)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(['all', 'new', 'read', 'resolved'] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-stone-400 py-6 text-center">No feedback in this category.</p>
      ) : (
        <div className="divide-y divide-stone-100">
          {visible.map(item => (
            <div key={item.id} className="py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span className="font-medium text-stone-600">
                    @{item.profiles?.username ?? '—'}
                  </span>
                  <span>·</span>
                  <span>{item.profiles?.email}</span>
                  <span>·</span>
                  <span>{fmt(item.created_at)}</span>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed mb-3">{item.message}</p>
              {item.status !== 'resolved' && (
                <div className="flex gap-2">
                  {item.status === 'new' && (
                    <button
                      type="button"
                      onClick={() => setStatus(item.id, 'read')}
                      disabled={updating === item.id}
                      className="text-xs text-stone-500 border border-stone-200 hover:bg-stone-50 px-3 py-1 rounded-lg transition-colors disabled:opacity-40"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setStatus(item.id, 'resolved')}
                    disabled={updating === item.id}
                    className="text-xs text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-3 py-1 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
