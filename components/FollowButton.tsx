'use client'

import { useEffect, useState } from 'react'
import { isFollowing, follow, unfollow } from '@/lib/social'

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const [following, setFollowing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [toggling, setToggling] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const f = await isFollowing(targetUserId)
      if (mounted) {
        setFollowing(f)
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [targetUserId])

  async function toggle() {
    setToggling(true)
    try {
      if (following) {
        await unfollow(targetUserId)
        setFollowing(false)
      } else {
        await follow(targetUserId)
        setFollowing(true)
      }
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return <button className="btn-primary px-3 py-1.5 text-sm" disabled>…</button>
  }
  return (
    <button onClick={toggle} disabled={toggling} className="btn-primary px-3 py-1.5 text-sm">
      {toggling ? 'Saving…' : following ? 'Unfollow' : 'Follow'}
    </button>
  )
}


