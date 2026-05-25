'use client'

import { useState } from 'react'

type Item = { id: string; text: string }

export default function ChecklistBlock({
  blockId,
  label,
  items,
  color,
}: {
  blockId: string
  label: string
  items: Item[]
  color: string
}) {
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem(`checklist-${blockId}`)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem(`checklist-${blockId}`, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const allChecked = items.length > 0 && items.every(i => checked.has(i.id))

  function resetAll() {
    setChecked(new Set())
    try { localStorage.removeItem(`checklist-${blockId}`) } catch {}
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5 pb-1">
        {label && (
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none mt-0.5 flex-shrink-0">☑️</span>
            <h3 className="text-lg font-semibold text-gray-800 leading-snug">{label}</h3>
          </div>
        )}
        {allChecked && (
          <button
            type="button"
            onClick={resetAll}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-3 pt-0.5"
          >
            Reset
          </button>
        )}
      </div>

      <ul className="px-5 pb-5 pt-3 space-y-3">
        {items.map(item => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="flex items-center gap-3.5 w-full text-left group py-0.5"
            >
              <span
                className="w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                style={{
                  borderColor: checked.has(item.id) ? color : '#d1d5db',
                  backgroundColor: checked.has(item.id) ? color : 'transparent',
                }}
              >
                {checked.has(item.id) && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className={`text-base leading-snug transition-colors ${checked.has(item.id) ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {item.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
