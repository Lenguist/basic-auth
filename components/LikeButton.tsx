'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'

type Props = {
  postId: string
  initialLiked?: boolean
  initialCount?: number
  onToggle?: (postId: string, liked: boolean) => void
}

export default function LikeButton({ postId, initialLiked = false, initialCount = 0, onToggle }: Props) {
  const [liked, setLiked] = useState<boolean>(initialLiked)
  const [count, setCount] = useState<number>(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLiked(initialLiked)
  }, [initialLiked])

  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  const handleClick = async () => {
    setLoading(true)
    const prevLiked = liked
    const prevCount = count
    // optimistic
    setLiked(!prevLiked)
    setCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1)
    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession()
      const me = sessionData.session?.user
      if (!me) throw new Error('Not authenticated')

      if (!prevLiked) {
        // like
        const res = await supabaseBrowser.from('post_likes').insert([{ post_id: postId, user_id: me.id }])
        if (res.error) {
          // revert
          setLiked(prevLiked)
          setCount(prevCount)
        } else {
          onToggle?.(postId, true)
        }
      } else {
        // unlike
        const res = await supabaseBrowser.from('post_likes').delete().match({ post_id: postId, user_id: me.id })
        if (res.error) {
          // revert
          setLiked(prevLiked)
          setCount(prevCount)
        } else {
          onToggle?.(postId, false)
        }
      }
    } catch (e) {
      // revert optimistic update
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${liked ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-zinc-800`}
      aria-pressed={liked}
      aria-label={liked ? 'Remove brain' : 'Add brain'}
    >
      <span className="text-lg">🧠</span>
      <span>{count}</span>
    </button>
  )
}
