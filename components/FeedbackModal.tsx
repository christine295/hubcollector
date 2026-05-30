'use client'

import { useState } from 'react'

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    if (res.ok) {
      setDone(true)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-stone-800">Send Feedback</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors p-1 -mr-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-6">
          {done ? (
            <div className="py-6 text-center">
              <p className="text-2xl mb-2">✓</p>
              <p className="text-sm font-medium text-stone-700">Thanks — got it!</p>
              <p className="text-xs text-stone-400 mt-1">Christine will see this shortly.</p>
              <button type="button" onClick={onClose} className="mt-4 text-sm text-stone-500 hover:text-stone-700 underline transition-colors">
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-500 mb-3">Bug, idea, or anything on your mind — Christine reads every one.</p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
              />
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <div className="flex gap-2.5 mt-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !message.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
