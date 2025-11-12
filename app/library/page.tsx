'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'

type LibraryItem = {
  openalex_id: string
  inserted_at: string
  status?: 'to_read' | 'reading' | 'read'
  papers: {
    openalex_id: string
    title: string
    authors_json: string[] | null
    year?: number | null
    url?: string | null
    source?: string | null
  } | null
}

export default function LibraryPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'to_read' | 'reading' | 'read'>('all')

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (!data.session) {
        router.push('/auth')
        return
      }
      setSession(data.session)
      const res = await supabaseBrowser
        .from('user_papers')
        .select('openalex_id, inserted_at, status, papers(*)')
        .order('inserted_at', { ascending: false })
      if (!res.error) setItems((res.data as any) ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  async function updateStatus(openalex_id: string, status: 'to_read' | 'reading' | 'read') {
    setUpdating(openalex_id)
    const res = await supabaseBrowser
      .from('user_papers')
      .update({ status })
      .match({ openalex_id, user_id: session!.user.id })
      .select()
    if (!res.error) {
      setItems((prev) =>
        prev.map((it) => (it.openalex_id === openalex_id ? { ...it, status } : it))
      )
    }
    setUpdating(null)
  }

  if (!session || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-700 dark:text-gray-200">{loading ? 'Loading…' : 'Redirecting…'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">Your Library</h1>
      <div className="mb-3 flex items-center gap-2">
        {(['all', 'to_read', 'reading', 'read'] as const).map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 text-sm rounded ${
              filter === f ? 'btn-primary' : 'btn-secondary'
            }`}
            onClick={() => setFilter(f)}
          >
            {f === 'to_read' ? 'To Read' : f === 'reading' ? 'Reading' : f === 'read' ? 'Read' : 'All'}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">No saved papers yet.</p>
      ) : (
        <ul className="space-y-3">
          {items
            .filter((it) => (filter === 'all' ? true : it.status === filter))
            .map((it) => {
            const p = it.papers
            const authors = (p?.authors_json ?? []) as string[]
            return (
              <li key={it.openalex_id} className="rounded-lg border border-gray-200 p-3 dark:border-zinc-800">
                <div className="font-medium text-gray-900 dark:text-white">{p?.title ?? it.openalex_id}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {authors.join(', ')} {p?.year ? `· ${p.year}` : ''}
                </div>
                {p?.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm underline underline-offset-4"
                  >
                    Open
                  </a>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="chip">Status: {it.status ?? 'to_read'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateStatus(it.openalex_id, 'to_read')}
                      disabled={updating === it.openalex_id}
                      className="btn-secondary px-2 py-1 text-xs"
                    >
                      To Read
                    </button>
                    <button
                      onClick={() => updateStatus(it.openalex_id, 'reading')}
                      disabled={updating === it.openalex_id}
                      className="btn-secondary px-2 py-1 text-xs"
                    >
                      Reading
                    </button>
                    <button
                      onClick={() => updateStatus(it.openalex_id, 'read')}
                      disabled={updating === it.openalex_id}
                      className="btn-secondary px-2 py-1 text-xs"
                    >
                      Read
                    </button>
                  </div>
                </div>
              </li>
            )
          })
          }
        </ul>
      )}
    </div>
  )
}


