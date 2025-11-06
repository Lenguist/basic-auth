'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'
import AuthCard from '@/components/AuthCard'
import { getSiteUrl } from '@/lib/siteUrl'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [step, setStep] = useState<'enterEmail' | 'checkEmail'>('enterEmail')
  const [code, setCode] = useState('')
  

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

  async function handleSendMagicLink() {
    setLoading(true)
    setMessage('')
    const siteUrl = getSiteUrl()
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })
    if (error) setMessage(error.message)
    else {
      try {
        localStorage.setItem('lastEmail', email)
      } catch {}
      setMessage(`✅ Magic link sent to ${email}`)
      setStep('checkEmail')
    }
    setLoading(false)
  }

  async function handleVerifyCode() {
    setLoading(true)
    setMessage('')
    const { error } = await supabaseBrowser.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })
    if (error) setMessage(error.message)
    else router.replace('/dashboard')
    setLoading(false)
  }

  async function handleResend() {
    setLoading(true)
    setMessage('')
    const siteUrl = getSiteUrl()
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) setMessage(error.message)
    else setMessage(`✅ Magic link sent to ${email}`)
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
        {step === 'enterEmail' && (
          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-black focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              onClick={handleSendMagicLink}
              disabled={loading || !email}
              className="w-full rounded-full bg-black px-4 py-3 text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
            {message && (
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{message}</p>
            )}
          </div>
        )}

        {step === 'checkEmail' && (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm text-gray-700 dark:text-gray-300">
              Check your email and click the link, or enter the code below
            </p>
            <input
              inputMode="numeric"
              maxLength={8}
              pattern="[0-9]*"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 tracking-widest text-gray-900 focus:border-black focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              onClick={handleVerifyCode}
              disabled={loading || code.length < 6}
              className="w-full rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={handleResend}
                disabled={loading}
                className="underline underline-offset-4 hover:no-underline"
              >
                Resend magic link
              </button>
              <button
                onClick={() => {
                  setStep('enterEmail')
                  setCode('')
                  setMessage('')
                }}
                className="underline underline-offset-4 hover:no-underline"
              >
                Use different email
              </button>
            </div>
            {message && (
              <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">{message}</p>
            )}
          </div>
        )}
      </AuthCard>
    </div>
  )
}
