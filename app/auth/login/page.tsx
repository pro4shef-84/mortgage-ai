'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/src/db/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Enter your email address first.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-slate-900 font-black">M</span>
            </div>
            <span className="font-bold text-2xl text-slate-900">MortgageAI</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Officer Sign In</h1>
          <p className="text-slate-500 text-sm mt-1">Access your mortgage processing dashboard</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {magicLinkSent ? (
            <Alert variant="success" title="Check your email">
              We sent a sign-in link to <strong>{email}</strong>. Click the link to access your dashboard.
            </Alert>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}

              <Input
                label="Email Address"
                type="email"
                placeholder="officer@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <Button type="submit" loading={loading} size="lg" className="w-full">
                Sign In
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleMagicLink}
                loading={loading}
              >
                Send Magic Link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          This portal is for licensed mortgage officers only.
        </p>
      </div>
    </div>
  )
}
