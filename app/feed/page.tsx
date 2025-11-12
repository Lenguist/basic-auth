'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'
import { formatRelativeTime, formatDateTime } from '@/lib/formatTime'
import LikeButton from '@/components/LikeButton'

type Post = {
  id: string
  user_id: string
  type: 'added_to_library' | 'status_changed' | 'added_to_shelf'
  openalex_id: string | null
  status: 'to_read' | 'reading' | 'read' | null
  created_at: string
}

export default function FeedPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [profiles, setProfiles] = useState<Record<string, { username: string | null; display_name: string | null }>>({})
  const [papers, setPapers] = useState<Record<string, any>>({})
  const [likesCount, setLikesCount] = useState<Record<string, number>>({})
  const [likedByMe, setLikedByMe] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (!data.session) {
        router.push('/auth')
        return
      }
      setSession(data.session)
      // following ids
      const fol = await supabaseBrowser
        .from('follows')
        .select('following_id')
        .eq('follower_id', data.session.user.id)
      const ids = (fol.data ?? []).map((r: any) => r.following_id)
      ids.push(data.session.user.id) // include self
      if (ids.length === 0) {
        setLoading(false)
        return
      }
      // posts
      const pr = await supabaseBrowser
        .from('posts')
        .select('id,user_id,type,openalex_id,status,created_at')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
        .limit(100)
      if (pr.error) {
        setLoading(false)
        return
      }
      const ps = (pr.data as any) as Post[]
      setPosts(ps)
      // fetch profiles for unique users
      const uniqueUsers = Array.from(new Set(ps.map((p) => p.user_id)))
      const profRes = await supabaseBrowser
        .from('profiles')
        .select('id,username,display_name')
        .in('id', uniqueUsers)
      if (!profRes.error) {
        const map: any = {}
        for (const r of profRes.data as any[]) {
          map[r.id] = { username: r.username, display_name: r.display_name }
        }
        setProfiles(map)
      }
      // fetch papers for unique openalex ids
      const idsOpen = Array.from(new Set(ps.map((p) => p.openalex_id).filter(Boolean))) as string[]
      if (idsOpen.length > 0) {
        const papRes = await supabaseBrowser.from('papers').select('*').in('openalex_id', idsOpen)
        if (!papRes.error) {
          const map: any = {}
          for (const r of papRes.data as any[]) map[r.openalex_id] = r
          setPapers(map)
        }
      }
      // fetch likes for these posts (counts and whether current user liked them)
      if (ps.length > 0) {
        const postIds = ps.map((p) => p.id)
        const likesRes = await supabaseBrowser.from('post_likes').select('post_id,user_id').in('post_id', postIds)
        if (!likesRes.error) {
          const counts: Record<string, number> = {}
          const likedMap: Record<string, boolean> = {}
          for (const r of likesRes.data as any[]) {
            counts[r.post_id] = (counts[r.post_id] ?? 0) + 1
            if (r.user_id === data.session.user.id) likedMap[r.post_id] = true
          }
          setLikesCount(counts)
          setLikedByMe(likedMap)
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
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Feed</h1>
      {posts.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => {
            const prof = profiles[p.user_id]
            const paper = p.openalex_id ? papers[p.openalex_id] : null
            const name = prof?.display_name || prof?.username || p.user_id
            const label =
              p.status === 'to_read' ? 'Want to Read' : p.status === 'reading' ? 'Currently Reading' : p.status === 'read' ? 'Read' : null
            let action = ''
            if (p.type === 'added_to_shelf') action = `added to ${label ?? 'shelf'}`
            if (p.type === 'status_changed') action = `marked as ${label ?? p.status}`
            if (p.type === 'added_to_library') action = 'added to library'
            return (
              <li key={p.id} className="rounded-lg border border-gray-200 p-3 dark:border-zinc-800">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <a href={`/u/${prof?.username ?? ''}`} className="font-medium text-gray-900 hover:underline dark:text-white">
                      {name}
                    </a>{' '}
                    {action}
                  </div>
                  <time
                    className="text-xs text-gray-500 dark:text-gray-500"
                    title={formatDateTime(p.created_at)}
                  >
                    {formatRelativeTime(p.created_at)}
                  </time>
                </div>
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
                <div className="mt-3">
                  <LikeButton
                    postId={p.id}
                    initialLiked={!!likedByMe[p.id]}
                    initialCount={likesCount[p.id] ?? 0}
                    onToggle={(postId, liked) => {
                      setLikedByMe((s) => ({ ...s, [postId]: liked }))
                      setLikesCount((s) => ({ ...s, [postId]: (s[postId] ?? 0) + (liked ? 1 : -1) }))
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}


