'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'
import { getSiteUrl } from '@/lib/siteUrl'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing you in…')
  const [canResend, setCanResend] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const run = async () => {
      const { error } = await supabaseBrowser.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        // Ensure we don't keep a stale/previous session when exchange fails (e.g., PKCE mismatch)
        await supabaseBrowser.auth.signOut()
        setMessage(error.message.includes('code verifier')
          ? 'We could not complete sign-in. Open the link in the same browser/origin you requested it from, or request a new magic link.'
          : error.message)
        try {
          const lastEmail = localStorage.getItem('lastEmail')
          if (lastEmail) setCanResend(lastEmail)
        } catch {}
        return
      }
      router.replace('/dashboard')
    }
    run()
  }, [router])

  async function handleResend() {
    if (!canResend) return
    setResending(true)
    const siteUrl = getSiteUrl()
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email: canResend,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) setMessage(error.message)
    else setMessage('✅ New magic link sent. Please check your email and open it in this browser.')
    setResending(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-3">
      <p className="text-center text-gray-800 dark:text-gray-200">{message}</p>
      {canResend && (
        <button
          onClick={handleResend}
          disabled={resending}
          className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {resending ? 'Sending…' : `Resend magic link to ${canResend}`}
        </button>
      )}
    </div>
  )
}


