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
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  // search state (copied from search page)
  const [q, setQ] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'to_read' | 'reading' | 'read'>('to_read')
  const [expandedAuthors, setExpandedAuthors] = useState<Set<string>>(new Set())

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
    } else {
      console.error('Status update error:', res.error)
    }
    setUpdating(null)
  }

  async function deleteFromLibrary(openalex_id: string) {
    setConfirmDelete(openalex_id)
  }

  async function handleConfirmDelete(openalex_id: string) {
    setConfirmDelete(null)
    setDeletingIds((prev) => [...prev, openalex_id])
    const res = await supabaseBrowser
      .from('user_papers')
      .delete()
      .match({ openalex_id, user_id: session!.user.id })
    if (!res.error) {
      setItems((prev) => prev.filter((it) => it.openalex_id !== openalex_id))
    } else {
      alert('Failed to delete paper. See console for details.')
      console.error('Delete error:', res.error)
    }
    setDeletingIds((prev) => prev.filter((id) => id !== openalex_id))
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
              <li key={it.openalex_id} className="rounded-lg border border-gray-200 p-5 dark:border-zinc-800 relative">
              <div className="absolute top-5 right-5">
                <button
                  onClick={() => deleteFromLibrary(it.openalex_id)}
                  disabled={deletingIds.includes(it.openalex_id) || updating === it.openalex_id}
                  className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                  aria-label="Delete paper"
                  title="Delete from library"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 0 0-.894.553L7.382 4H4a1 1 0 0 0 0 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a1 1 0 0 0 0-2h-3.382l-.724-1.447A1 1 0 0 0 11 2H9zM7 8a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0V8zm5-1a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="pr-10">
                <div>
                  {p?.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="float-left text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mr-2"
                      title="Open paper"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <div className="font-medium text-gray-900 dark:text-white">{p?.title ?? it.openalex_id}</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {expandedAuthors.has(it.openalex_id) ? (
                    <div>
                      {authors.join(', ')}
                      {authors.length > 12 && (
                        <button
                          onClick={() => setExpandedAuthors(prev => {
                            const next = new Set(prev)
                            next.delete(it.openalex_id)
                            return next
                          })}
                          className="ml-2 text-xs text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          collapse
                        </button>
                      )}
                    </div>
                  ) : authors.length > 12 ? (
                    <div>
                      {authors.slice(0, 12).join(', ')}...
                      <button
                        onClick={() => setExpandedAuthors(prev => new Set(prev).add(it.openalex_id))}
                        className="ml-2 text-xs text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        expand
                      </button>
                    </div>
                  ) : (
                    <div>
                      {authors.join(', ')}
                    </div>
                  )}
                </div>
                {p?.year && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Date published: {p.year}
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Date added to the library: {new Date(it.inserted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ (\d{4})/, ', $1')}
                </div>

                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    it.status === 'read' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : it.status === 'reading' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                  }`}>
                    {it.status === 'to_read' ? 'To read' : it.status === 'reading' ? 'Reading' : 'Read'}
                  </span>
                </div>
                <div className="absolute bottom-5 right-5 flex items-center gap-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Move to</span>
                  <select
                    value={it.status ?? 'to_read'}
                    onChange={(e) => updateStatus(it.openalex_id, e.target.value as any)}
                    disabled={updating === it.openalex_id || deletingIds.includes(it.openalex_id)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="to_read">To read</option>
                    <option value="reading">Reading</option>
                    <option value="read">Read</option>
                  </select>
                </div>

              </div>
            </li>
            )
          })
          }
        </ul>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Remove paper?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This paper will be removed from your library. You can add it back anytime.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(confirmDelete)}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}