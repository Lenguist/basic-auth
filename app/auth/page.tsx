'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'
import AuthCard from '@/components/AuthCard'
import Divider from '@/components/Divider'
import GoogleIcon from '@/components/GoogleIcon'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabaseBrowser.auth.getSession()
      if (data.session) {
        setSession(data.session)
        router.push('/dashboard')
      }
    }
    getSession()

    const { data: listener } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) router.push('/dashboard')
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  async function handleGoogleSignIn() {
    setLoading(true)
    setMessage('')
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/dashboard`,
      },
    })
    if (error) setMessage(error.message)
    setLoading(false)
  }

  async function handleSignIn() {
    setLoading(true)
    setMessage('')
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    setLoading(false)
  }

  async function handleSignUp() {
    setLoading(true)
    setMessage('')
    const { error } = await supabaseBrowser.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('✅ Check your email for verification link.')
    setLoading(false)
  }

  if (session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-zinc-900">
        <p className="text-lg text-gray-800 dark:text-gray-200">Redirecting to home...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
      <AuthCard title="Welcome back.">
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-gray-900 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-white dark:hover:bg-zinc-800"
          >
            <GoogleIcon className="h-5 w-5" />
            Sign in with Google
          </button>

          <Divider />

          {!showEmailForm ? (
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full rounded-full border border-gray-300 px-4 py-3 text-gray-900 transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Sign in with email
            </button>
          ) : (
            <div className="mt-1">
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
                className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-black focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                onClick={mode === 'signin' ? handleSignIn : handleSignUp}
                disabled={loading}
                className="w-full rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
              <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
                {mode === 'signin' ? (
                  <>
                    No account?{' '}
                    <button
                      className="underline underline-offset-4 hover:no-underline"
                      onClick={() => setMode('signup')}
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Have an account?{' '}
                    <button
                      className="underline underline-offset-4 hover:no-underline"
                      onClick={() => setMode('signin')}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {message && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{message}</p>
          )}
        </div>
      </AuthCard>
    </div>
  )
}
