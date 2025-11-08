'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'
import type { Session } from '@supabase/supabase-js'

export default function NavBar() {
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (isMounted) setSession(data.session)
    }
    init()
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    await supabaseBrowser.auth.signOut()
    router.push('/auth')
  }

  return (
    <header className="sticky top-0 z-20 border-b-2 border-orange-500/80 bg-white/80 backdrop-blur dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 transition hover:opacity-80 dark:text-white">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] bg-orange-600 text-white">P</span>
          <span>Papertrail</span>
        </Link>
        <nav className="flex items-center gap-3">
          {!session ? (
            <Link
              href="/auth"
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              Sign In
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-800 hover:bg-orange-50 dark:text-white dark:hover:bg-orange-900/20"
              >
                Profile
              </Link>
              <Link
                href="/search"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-800 hover:bg-orange-50 dark:text-white dark:hover:bg-orange-900/20"
              >
                Search
              </Link>
              <Link
                href="/library"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-800 hover:bg-orange-50 dark:text-white dark:hover:bg-orange-900/20"
              >
                Library
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-800 hover:bg-orange-50 dark:text-white dark:hover:bg-orange-900/20"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="btn-primary px-3 py-1.5 text-sm"
              >
                Sign Out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}


