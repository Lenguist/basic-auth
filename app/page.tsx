'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-100 via-white to-white dark:from-orange-900/20 dark:via-zinc-950 dark:to-zinc-950" />
      <section className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center px-4 text-center">
        <span className="chip mb-3">New</span>
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Track your reading. <span className="text-orange-600">Find great papers.</span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-gray-700 dark:text-gray-300">
          Papertrail lets you search research, save to your library, and keep momentum with a progress‑oriented reading experience.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/search" className="btn-primary px-6 py-3">
            Search Papers
          </Link>
          <Link href="/auth" className="btn-secondary px-6 py-3">
            Sign In
          </Link>
        </div>
      </section>
    </div>
  )
}
