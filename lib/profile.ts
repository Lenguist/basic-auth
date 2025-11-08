'use client'

import { supabaseBrowser } from '@/lib/supabaseBrowserClient'

export type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}

export async function ensureProfileForCurrentUser() {
  const { data: sessionData } = await supabaseBrowser.auth.getSession()
  const session = sessionData.session
  if (!session) return
  await supabaseBrowser.from('profiles').upsert([{ id: session.user.id }], { onConflict: 'id' })
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: sessionData } = await supabaseBrowser.auth.getSession()
  const session = sessionData.session
  if (!session) return null
  const res = await supabaseBrowser.from('profiles').select('*').eq('id', session.user.id).single()
  if (res.error) return null
  return res.data as unknown as Profile
}

export async function saveMyProfile(input: {
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: sessionData } = await supabaseBrowser.auth.getSession()
  const session = sessionData.session
  if (!session) return { ok: false, message: 'Not authenticated' }
  const res = await supabaseBrowser
    .from('profiles')
    .upsert([{ id: session.user.id, ...input }], { onConflict: 'id' })
  if (res.error) {
    // Handle unique violation for username
    if ((res.error as any).code === '23505') {
      return { ok: false, message: 'Username is taken' }
    }
    return { ok: false, message: res.error.message }
  }
  return { ok: true }
}


