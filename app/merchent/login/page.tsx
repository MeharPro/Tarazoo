'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CtaButton, ClickMe } from 'components/ui/Animated'

export default function MerchentLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/merchent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.replace('/merchent/profile')
      } else {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white text-gray-900 shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Merchent Login</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="merchent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="merchent"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="relative">
            <CtaButton
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </CtaButton>
            {!loading && <ClickMe />}
          </div>
          <p className="text-xs text-gray-500">Use merchent / merchent</p>
        </form>
      </div>
    </div>
  )
}
