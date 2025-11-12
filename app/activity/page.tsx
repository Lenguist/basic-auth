'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'

type Post = {
  id: string
  user_id: string
  type: 'user_joined' | 'added_to_shelf' | 'status_changed' | 'followed'
  openalex_id: string | null
  status: 'to_read' | 'reading' | 'read' | null
  target_user_id: string | null
  created_at: string
}

export default function ActivityPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [papers, setPapers] = useState<Record<string, any>>({})
  const [profiles, setProfiles] = useState<Record<string, { username: string | null; display_name: string | null }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (!data.session) {
        router.push('/auth')
        return
      }
      setSession(data.session)
      const pr = await supabaseBrowser
        .from('posts')
        .select('id,user_id,type,openalex_id,status,target_user_id,created_at')
        .eq('user_id', data.session.user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!pr.error) {
        const ps = (pr.data as any) as Post[]
        setPosts(ps)
        const openIds = Array.from(new Set(ps.map((p) => p.openalex_id).filter(Boolean))) as string[]
        if (openIds.length > 0) {
          const papRes = await supabaseBrowser.from('papers').select('*').in('openalex_id', openIds)
          if (!papRes.error) {
            const map: any = {}
            for (const r of papRes.data as any[]) map[r.openalex_id] = r
            setPapers(map)
          }
        }
        const userIds = Array.from(new Set(ps.map((p) => p.target_user_id).filter(Boolean))) as string[]
        if (userIds.length > 0) {
          const profRes = await supabaseBrowser.from('profiles').select('id,username,display_name').in('id', userIds)
          if (!profRes.error) {
            const map: any = {}
            for (const r of profRes.data as any[]) map[r.id] = { username: r.username, display_name: r.display_name }
            setProfiles(map)
          }
        }
      }
      setLoading(false)
    }
    init()
  }, [router])

  if (!session || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-700 dark:text-gray-200">{loading ? 'Loading…' : 'Redirecting…'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">My Activity</h1>
      {posts.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => {
            const label =
              p.status === 'to_read' ? 'Want to Read' : p.status === 'reading' ? 'Currently Reading' : p.status === 'read' ? 'Read' : null
            let action = ''
            if (p.type === 'user_joined') action = 'joined PaperTrail'
            if (p.type === 'added_to_shelf') action = `added to ${label ?? 'shelf'}`
            if (p.type === 'status_changed') action = `marked as ${label ?? p.status}`
            if (p.type === 'followed') action = `followed ${profiles[p.target_user_id ?? '']?.username ?? 'someone'}`
            const paper = p.openalex_id ? papers[p.openalex_id] : null
            return (
              <li key={p.id} className="rounded-lg border border-gray-200 p-3 dark:border-zinc-800">
                <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">You {action}</div>
                {paper && (
                  <>
                    <div className="font-medium text-gray-900 dark:text-white">{paper.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {(paper.authors_json ?? []).join(', ')} {paper.year ? `· ${paper.year}` : ''}
                    </div>
                    {paper.url && (
                      <a href={paper.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm underline">
                        Open
                      </a>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}


