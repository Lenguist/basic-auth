'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'
import { addPaperToLibrary, type NormalizedPaper } from '@/lib/library'

type OpenAlexWork = {
  id: string
  title: string
  publication_year?: number
  primary_location?: { source?: { display_name?: string }; landing_page_url?: string | null }
  authorships?: Array<{ author?: { display_name?: string } }>
}

export default function SearchPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<OpenAlexWork[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (!data.session) {
        router.push('/auth')
        return
      }
      setSession(data.session)
    }
    init()
  }, [router])

  const canSearch = useMemo(() => q.trim().length > 1, [q])

  async function search() {
    if (!canSearch) return
    setLoading(true)
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
      setLoading(false)
    }
  }

  function normalize(work: OpenAlexWork): NormalizedPaper {
    const openalex_id = work.id.replace('https://openalex.org/', '')
    const authors = (work.authorships ?? [])
      .map((a) => a?.author?.display_name)
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

  async function handleAdd(work: OpenAlexWork) {
    try {
      setAdding(work.id)
      const paper = normalize(work)
      await addPaperToLibrary(paper)
      setAddedIds((prev) => ({ ...prev, [paper.openalex_id]: true }))
    } catch (e: any) {
      alert(e?.message ?? 'Failed to add')
    } finally {
      setAdding(null)
    }
  }

  if (!session) return null

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">Search Papers</h1>
      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search OpenAlex..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-orange-600 focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
        />
        <button
          onClick={search}
          disabled={!canSearch || loading}
          className="btn-primary px-4 py-2"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <ul className="space-y-3">
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
                <button
                  onClick={() => handleAdd(w)}
                  disabled={!!added || adding === w.id}
                  className="btn-primary px-3 py-1.5 text-sm"
                >
                  {added ? 'Added' : adding === w.id ? 'Adding…' : 'Add to Library'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}


