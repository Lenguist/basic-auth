'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'
import { ensureProfileForCurrentUser, fetchMyProfile, saveMyProfile } from '@/lib/profile'

export default function ProfilePage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  // Avatar postponed until we add uploads

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (!data.session) {
        router.push('/auth')
        return
      }
      setSession(data.session)
      await ensureProfileForCurrentUser()
      const p = await fetchMyProfile()
      if (p) {
        setUsername(p.username ?? '')
        setDisplayName(p.display_name ?? '')
        setBio(p.bio ?? '')
      }
      setLoading(false)
    }
    init()
  }, [router])

  const usernameValid = useMemo(() => {
    if (!username) return true
    return /^[a-z0-9_.]{3,20}$/.test(username)
  }, [username])

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    const res = await saveMyProfile({
      username: username || null,
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: null,
    })
    if (!res.ok) setMessage(res.message)
    else setMessage('Saved!')
    setSaving(false)
  }

  if (!session || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-700 dark:text-gray-200">{loading ? 'Loading…' : 'Redirecting…'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
      <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="e.g. maksym_b"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            3–20 chars, lowercase letters, numbers, underscore, dot
          </p>
          {!usernameValid && (
            <p className="mt-1 text-sm text-red-600">Invalid username format.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short bio"
            className="min-h-24 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !usernameValid}
            className="btn-primary px-5 py-2"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {message && <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>}
        </div>
      </div>
    </div>
  )
}


