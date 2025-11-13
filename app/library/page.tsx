 'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'
import { addPaperToLibrary, type NormalizedPaper } from '@/lib/library'

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
  // search state (copied from search page)
  const [q, setQ] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'to_read' | 'reading' | 'read'>('to_read')

  const canSearch = useMemo(() => q.trim().length > 1, [q])

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

  async function search() {
    if (!canSearch) return
    setSearchLoading(true)
    setError(null)
    try {
      const url = new URL('https://api.openalex.org/works')
      url.searchParams.set('search', q)
      url.searchParams.set('per_page', '10')
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const json = await res.json()
      setResults(json.results ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Search failed')
    } finally {
      setSearchLoading(false)
    }
  }

  function normalize(work: any): NormalizedPaper {
    const openalex_id = work.id.replace('https://openalex.org/', '')
    const authors = (work.authorships ?? [])
      .map((a: any) => a?.author?.display_name)
      .filter(Boolean) as string[]
    return {
      openalex_id,
      title: work.title,
      authors,
      year: work.publication_year ?? null,
      url: work.primary_location?.landing_page_url ?? null,
      source: work.primary_location?.source?.display_name ?? 'openalex',
    }
  }

  async function handleAdd(work: any) {
    try {
      setAdding(work.id)
      const paper = normalize(work)
      await addPaperToLibrary(paper, status)
      setAddedIds((prev) => ({ ...prev, [paper.openalex_id]: true }))
      // refresh library list
      const res = await supabaseBrowser
        .from('user_papers')
        .select('openalex_id, inserted_at, status, papers(*)')
        .order('inserted_at', { ascending: false })
      if (!res.error) setItems((res.data as any) ?? [])
    } catch (e: any) {
      alert(e?.message ?? 'Failed to add')
    } finally {
      setAdding(null)
    }
  }

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
      {/* Search UI moved here from /search */}
      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search OpenAlex..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
        />
        <button
          onClick={search}
          disabled={!canSearch || searchLoading}
          className="btn-primary px-4 py-2"
        >
          {searchLoading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {/* Search results */}
      {results.length > 0 && (
        <ul className="space-y-3 mb-6">
          {results.map((w) => {
            const paper = normalize(w)
            const added = addedIds[paper.openalex_id]
            return (
              <li key={w.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-zinc-800">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{paper.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {paper.authors.join(', ')} {paper.year ? `· ${paper.year}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-zinc-800"
                    >
                      Open
                    </a>
                  )}
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
                    >
                      <option value="to_read">Want to Read</option>
                      <option value="reading">Currently Reading</option>
                      <option value="read">Read</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleAdd(w)}
                    disabled={!!added || adding === w.id}
                    className="btn-primary px-3 py-1.5 text-sm"
                  >
                    {added ? 'Added' : adding === w.id ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
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


