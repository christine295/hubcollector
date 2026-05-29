'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar } from '@/lib/supabase/uploadAvatar'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [socialLinks, setSocialLinks] = useState<{ label: string; url: string }[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, bio, avatar_url, social_links')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUsername((profile as any).username ?? '')
        setDisplayName((profile as any).display_name ?? '')
        setBio((profile as any).bio ?? '')
        setAvatarUrl((profile as any).avatar_url ?? '')
        setSocialLinks((profile as any).social_links ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    const url = await uploadAvatar(file, userId)
    if (url) setAvatarUrl(url)
    setUploading(false)
  }

  function addLink() {
    setSocialLinks(prev => [...prev, { label: '', url: '' }])
  }

  function updateLink(i: number, field: 'label' | 'url', value: string) {
    setSocialLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  function removeLink(i: number) {
    setSocialLinks(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const validLinks = socialLinks.filter(l => l.url.trim())
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        social_links: validLinks,
      }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const { error: msg } = await res.json()
      setError(msg ?? 'Something went wrong')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center text-stone-400 text-sm">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-stone-200 px-4 py-3.5 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href={`/h/${username}`} className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
            « Profile
          </Link>
          <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
            Dashboard »
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-stone-900 mb-8">Edit Profile</h1>

        <form onSubmit={handleSave} className="space-y-7">

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">Profile Photo</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover object-top bg-stone-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-2xl font-semibold text-teal-600 select-none">
                  {(displayName || username)[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 transition-colors"
                >
                  {uploading ? 'Uploading…' : 'Upload photo'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A short line about you or your hubs"
              maxLength={160}
              rows={2}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
            <p className="text-[11px] text-stone-400 mt-1">{bio.length}/160</p>
          </div>

          {/* Social links */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Social Links</label>
            <div className="space-y-2">
              {socialLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateLink(i, 'label', e.target.value)}
                    placeholder="Label (e.g. Website)"
                    className="w-28 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={e => updateLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="text-stone-300 hover:text-red-400 transition-colors text-lg leading-none px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {socialLinks.length < 5 && (
              <button
                type="button"
                onClick={addLink}
                className="mt-2 text-sm text-teal-600 hover:text-teal-700 transition-colors"
              >
                + Add link
              </button>
            )}
          </div>

          {/* Username (read-only info) */}
          <div className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-3.5">
            <p className="text-xs text-stone-500 leading-[1.65]">
              Your username is <span className="font-mono font-medium">@{username}</span> — it&apos;s permanent
              and encoded in your QR codes. It can&apos;t be changed.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving || uploading}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
          </button>

        </form>
      </main>

      <SiteFooter />
    </div>
  )
}
