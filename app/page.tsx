'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center">
      <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">Welcome</h1>
      <p className="mb-8 max-w-lg text-center text-gray-700 dark:text-gray-300">
        This is a public home page for a minimal Supabase + Next.js auth starter.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/auth"
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-zinc-800"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}
