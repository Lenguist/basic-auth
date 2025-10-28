'use client'

import { ReactNode } from 'react'

export default function AuthCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
      {children}
    </div>
  )
}


