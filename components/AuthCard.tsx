'use client'

import { ReactNode } from 'react'

export default function AuthCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-orange-200 bg-white p-8 shadow-md ring-1 ring-orange-100 dark:border-orange-900/40 dark:bg-zinc-950 dark:ring-orange-900/20">
      <h1 className="mb-6 text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h1>
      {children}
    </div>
  )
}


