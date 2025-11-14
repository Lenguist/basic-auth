'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'

type Props = { userId: string; limit?: number }

function Authors({ a }: { a: string[] | null }) {
  if (!a || a.length === 0) return <span className="text-xs text-gray-500">Unknown</span>
  const s = a.slice(0, 2).join(', ') + (a.length > 2 ? ' et al.' : '')
  return <span className="text-xs text-gray-500">{s}</span>
}

export default function LibrarySnapshot({ userId, limit = 6 }: Props) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      // fetch recent user_papers and then fetch related papers by openalex_id
      const upRes = await supabaseBrowser
        .from('user_papers')
        .select('created_at,status,openalex_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (upRes.error) {
        console.error('LibrarySnapshot: user_papers query error:', upRes.error)
      }

      const upRows = (upRes.error || !upRes.data) ? [] : (upRes.data as any[])
      if (!mounted) return
      if (upRows.length === 0) {
        console.warn(`LibrarySnapshot: no recent user_papers returned (limit=${limit})`)
        setItems([])
        setLoading(false)
        return
      }

      const ids = upRows.map((r) => r.openalex_id).filter(Boolean)
      console.log('LibrarySnapshot: fetching papers for openalex_ids:', ids)
      const pRes = await supabaseBrowser
        .from('papers')
        .select('openalex_id,title,authors_json,year,url')
        .in('openalex_id', ids)

      if (pRes.error) {
        console.error('LibrarySnapshot: papers query error:', pRes.error)
      }

      const papers = (pRes.error || !pRes.data) ? [] : (pRes.data as any[])
      console.log('LibrarySnapshot: fetched papers:', papers)
      const byId: Record<string, any> = {}
      for (const p of papers) byId[p.openalex_id] = p

      // merge into items preserving created_at/status from user_papers
      const merged = upRows.map((r) => ({ ...r, papers: byId[r.openalex_id] ?? null }))
      setItems(merged)
      setLoading(false)
    }
    if (userId) load()
    return () => { mounted = false }
  }, [userId, limit])

  if (loading) return <div className="mt-4 text-sm text-gray-500">Loading library snapshot…</div>
  if (items.length === 0) return <div className="mt-4 text-sm text-gray-500">No papers in library yet.</div>

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Library snapshot</h4>
      <div className="grid grid-cols-3 gap-3">
        {items.map((row, idx) => {
          const p = row.papers || {}
          const authors = p.authors_json ?? []
          const title = p.title ?? 'Untitled'
          const year = p.year ?? null
          const created = new Date(row.created_at)
          const dateLabel = created.toLocaleDateString()
          return (
                <div key={idx} className="flex items-start gap-2 rounded border border-gray-100 p-2 dark:border-zinc-800">
                  <div className={`w-10 h-12 shrink-0 rounded flex items-center justify-center text-xs font-semibold ${
                    row.status === 'read' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
                    row.status === 'reading' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700'
                  }`}>{row.status === 'to_read' ? 'TO READ' : row.status === 'reading' ? 'READING' : 'READ'}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</div>
                      <div>
                        <button
                          className="text-xs text-red-600 hover:underline ml-2"
                          onClick={async () => {
                            const openalexId = row.openalex_id
                            if (!openalexId) {
                              alert('Cannot delete: missing identifier')
                              return
                            }
                            const ok = confirm('Remove this paper from your library?')
                            if (!ok) return
                            setDeletingIds((s) => [...s, openalexId])
                            const del = await supabaseBrowser
                              .from('user_papers')
                              .delete()
                              .match({ user_id: userId, openalex_id: openalexId })

                            if (del.error) {
                              console.error('Failed to delete user_paper', del.error)
                              alert('Failed to remove paper. See console for details.')
                              setDeletingIds((s) => s.filter((id) => id !== openalexId))
                              return
                            }
                            // optimistic UI: remove item
                            setItems((prev) => prev.filter((it) => it.openalex_id !== openalexId))
                            setDeletingIds((s) => s.filter((id) => id !== openalexId))
                          }}
                          aria-label="Remove from library"
                        >
                          {deletingIds.includes(row.openalex_id) ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </div>
                    <Authors a={authors} />
                    <div className={`inline-block text-xs font-medium px-2 py-0.5 rounded mt-1 ${
                      row.status === 'read' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                      row.status === 'reading' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    }`}>
                      {row.status === 'to_read' ? 'To read' : row.status === 'reading' ? 'Reading' : 'Read'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{year ? `${year} · ` : ''}{dateLabel}</div>
                  </div>
                </div>
              )
        })}
      </div>
    </div>
  )
}
