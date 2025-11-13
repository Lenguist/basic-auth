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

      const upRows = (upRes.error || !upRes.data) ? [] : (upRes.data as any[])
      if (!mounted) return
      if (upRows.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      const ids = upRows.map((r) => r.openalex_id).filter(Boolean)
      const pRes = await supabaseBrowser
        .from('papers')
        .select('openalex_id,title,authors_json,year,url')
        .in('openalex_id', ids)

      const papers = (pRes.error || !pRes.data) ? [] : (pRes.data as any[])
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
              <div className="w-10 h-12 shrink-0 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-semibold text-orange-700">PDF</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</div>
                <Authors a={authors} />
                <div className="text-xs text-gray-500 mt-1">{year ? `${year} · ` : ''}{dateLabel}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
