"use client"

import { useState } from 'react'

export default function EngineExplainerPage() {
  const [msgs, setMsgs] = useState<{ role: 'user'|'assistant', content: string }[]>([])
  const [q, setQ] = useState('How do the 12 weights affect the forecast?')
  const [busy, setBusy] = useState(false)

  const ask = async () => {
    const question = q.trim()
    if (!question) return
    setMsgs((m) => [...m, { role: 'user', content: question }])
    setQ('')
    setBusy(true)
    try {
      const ctx = JSON.stringify({ page: 'engine-explainer' })
      const res = await fetch('/api/assistant/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question, context: ctx, path: '/merchent/forecasts/engine' }) })
      const j = await res.json().catch(() => null)
      setMsgs((m) => [...m, { role: 'assistant', content: (j && (j.reply || j.error)) || 'Sorry, I could not answer.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Forecast Engine</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6">This page explains how our engine generates 12-week demand forecasts and how adjustments work. Use the coach below to ask questions.</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Overview</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">We train a small neural network (MLP) using the last 52 weeks of demand to predict the next 12 weeks. We also support Cohere-based per-week multipliers and simple percent adjustments so you can incorporate market intuition.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Model</h2>
        <ul className="list-disc ml-6 text-sm text-gray-700 dark:text-gray-300">
          <li>Architecture: MLP 52 → 128 → 64 → 12</li>
          <li>Training: ~300 epochs, quick in-memory fit</li>
          <li>Loss: Mean Squared Error (MSE)</li>
          <li>Providers: service:pytorch (MLP), cohere (weights), local (average-based fallback)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Adjustments</h2>
        <ul className="list-disc ml-6 text-sm text-gray-700 dark:text-gray-300">
          <li>Per-week weights (Cohere): deterministic [12] multipliers applied to the forecast.</li>
          <li>Simple adjust: scale 12-week forecast by a uniform factor (e.g., −10%, +15%).</li>
          <li>Targeting: specify one or more SKUs, or apply to all items.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Glossary</h2>
        <ul className="list-disc ml-6 text-sm text-gray-700 dark:text-gray-300">
          <li><strong>Framework</strong>: Which engine produced the forecast: PyTorch, Cohere, or Local.</li>
          <li><strong>Model</strong>: The algorithm used; here, an MLP with two hidden layers.</li>
          <li><strong>Loss</strong>: MSE comparing predictions vs. targets during training.</li>
          <li><strong>Layers</strong>: Numbers of units from input to output: 52 → 128 → 64 → 12.</li>
          <li><strong>Market Intuition Score</strong>: Magnitude of manual adjustment relative to baseline.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Engine Coach</h2>
        <div className="rounded-md border p-3">
          <div className="text-xs text-gray-600 mb-2">Ask about model choices, adjustments, or interpreting outputs.</div>
          <div className="max-h-64 overflow-y-auto space-y-2 mb-2">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block rounded px-2 py-1 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>{m.content}</div>
              </div>
            ))}
            {busy && <div className="text-left text-xs text-gray-500">Thinking…</div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void ask(); }} className="flex items-center gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 rounded-md border-gray-300" placeholder="Ask about layers, loss, weights…" />
            <button type="submit" disabled={busy} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50">Send</button>
          </form>
        </div>
      </section>
    </div>
  )
}

