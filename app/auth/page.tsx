'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin() {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else setMessage('✅ Logged in successfully!')
    setLoading(false)
  }

  async function handleSignup() {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('✅ Signup successful! Check your email for verification.')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900 dark:text-white">
          Supabase Auth Demo
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-black focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-black focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
        />

        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Sign Up
          </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
