'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (!data.session) {
        router.push('/auth')
      } else {
        setSession(data.session)
      }
      setLoading(false)
    }
    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-zinc-900">
        <p className="text-gray-700 dark:text-gray-200">Loading...</p>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
        Hello, {session.user.email} 👋
      </h1>

      <p className="mb-8 text-gray-700 dark:text-gray-300">
        Welcome to your dashboard. Only logged-in users can see this page.
      </p>

      <button
        onClick={async () => {
          await supabaseBrowser.auth.signOut()
          router.push('/auth')
        }}
        className="rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        Sign Out
      </button>
    </div>
  )
}
