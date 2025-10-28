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
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-gray-900 transition hover:opacity-80 dark:text-white">
          BasicAuth
        </Link>
        <nav className="flex items-center gap-3">
          {!session ? (
            <Link
              href="/auth"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Sign In
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-white dark:hover:bg-zinc-800"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-lg bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
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


