'use client'

import { useEffect, useMemo, useState } from 'react'
import { CtaButton } from 'components/ui/Animated'

type CatalogItem = {
  sku: string
  name: string
  demand52?: number[]
  forecasted_demand?: number[]
}

export default function ForecastsPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [available, setAvailable] = useState<boolean>(true)
  const [zoom, setZoom] = useState<{ sku: string; name: string; data: number[] } | null>(null)
  const [engine, setEngine] = useState<{ provider?: string; meta?: any } | null>(null)
  const [showEngineDetails, setShowEngineDetails] = useState(false)
  const [adjustPrompt, setAdjustPrompt] = useState('Market slightly low next quarter')
  const [adjusting, setAdjusting] = useState(false)
  const [prevForecasts, setPrevForecasts] = useState<Record<string, number[]>>({})
  const [showCompare, setShowCompare] = useState(false)
  const [lastAdjust, setLastAdjust] = useState<{ provider?: string; weightsUsed?: number[]; factorUsed?: number } | null>(null)
  const [infoOpen, setInfoOpen] = useState<{ title: string; body: string } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('What does the loss mean here?')
  const [chatMsgs, setChatMsgs] = useState<{ role: 'user'|'assistant'; content: string }[]>([])
  const [chatBusy, setChatBusy] = useState(false)
  const [simplePct, setSimplePct] = useState<number>(-10)
  const [simpleSkus, setSimpleSkus] = useState<string>('')
  const [busySkus, setBusySkus] = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/merchent/catalog')
      const j = await res.json()
      setItems((j.items || []) as CatalogItem[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      // check availability first
      try {
        const r = await fetch('/api/forecast/health', { cache: 'no-store' })
        const j = await r.json()
        setAvailable(Boolean(j.ok))
      } catch {
        setAvailable(false)
      }
      await load()
      // Load persisted baseline (if any)
      try {
        const br = await fetch('/api/merchent/forecasts/baseline', { cache: 'no-store' })
        const bj = await br.json().catch(() => null)
        if (bj && bj.ok && bj.baseline && typeof bj.baseline === 'object') {
          setPrevForecasts(bj.baseline as Record<string, number[]>)
        }
      } catch {}
    })()
  }, [])

  const metrics = useMemo(() => {
    const total = items.length
    const withFc = items.filter((i) => Array.isArray(i.forecasted_demand) && i.forecasted_demand!.length > 0).length
    return { total, withFc }
  }, [items])

  const runForecasts = async () => {
    setRunning(true)
    try {
      // Capture baseline forecasts before triggering a new forecast if none captured yet
      if (Object.keys(prevForecasts).length === 0) {
        const baseline: Record<string, number[]> = {}
        items.forEach((it) => {
          if (Array.isArray(it.forecasted_demand) && it.forecasted_demand.length === 12) {
            baseline[it.sku] = it.forecasted_demand as number[]
          }
        })
        if (Object.keys(baseline).length > 0) setPrevForecasts(baseline)
      }
      const res = await fetch('/api/merchent/catalog/forecast', { method: 'POST' })
      let j: any = null
      let raw = ''
      try {
        raw = await res.text()
        j = raw ? JSON.parse(raw) : null
      } catch {
        j = null
      }
      if (!res.ok || !j?.ok) {
        const msg = (j && j.error) ? j.error : (raw || 'Forecast failed')
        alert(msg)
        return
      }
      setEngine({ provider: j?.provider, meta: j?.meta })
      if (j?.meta) {
        // eslint-disable-next-line no-console
        console.log('[Forecast] meta:', j.meta)
      }
      // Log provider to console for transparency
      if (j?.provider === 'cohere') {
        // eslint-disable-next-line no-console
        console.log('[Forecast] Cohere used for forecasts')
      } else if (typeof j?.provider === 'string' && j.provider.startsWith('service:')) {
        if (j.provider.includes('pytorch')) {
          // eslint-disable-next-line no-console
          console.log('[Forecast] PyTorch service used')
        } else {
          // eslint-disable-next-line no-console
          console.log('[Forecast] Service used (naive)')
        }
      } else if (j?.provider === 'fallback') {
        // eslint-disable-next-line no-console
        console.log('[Forecast] Local average fallback used')
      }
      await load()
      if (j?.diag) {
        // eslint-disable-next-line no-alert
        console.log(`[Forecast] updated: ${j.updated}, total: ${j.diag.total}, withDemand: ${j.diag.withDemand}`)
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forecasts</h1>
          <p className="mt-1 text-gray-600">Predict the next 12 weeks based on past 52 weeks</p>
        </div>
        {available && (
          <CtaButton
            onClick={runForecasts}
            disabled={running}
            className="px-4 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {running ? 'Generating…' : 'Generate Forecasts'}
          </CtaButton>
        )}
      </div>

      {!available && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">
          Forecast service is offline. Start it at http://localhost:8001 to enable forecasts.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Total SKUs</p>
          <p className="text-2xl font-semibold">{metrics.total}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">With Forecast</p>
          <p className="text-2xl font-semibold">{metrics.withFc}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5 sm:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showCompare} onChange={(e) => setShowCompare(e.target.checked)} />
              Compare with baseline
            </label>
            <button
              onClick={async () => {
                const snap: Record<string, number[]> = {}
                items.forEach((it) => {
                  if (Array.isArray(it.forecasted_demand) && it.forecasted_demand.length === 12) {
                    snap[it.sku] = it.forecasted_demand as number[]
                  }
                })
                setPrevForecasts(snap)
                try {
                  await fetch('/api/merchent/forecasts/baseline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseline: snap }) })
                } catch {}
              }}
              className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            >
              Set baseline to current
            </button>
            <button onClick={async () => { setPrevForecasts({}); try { await fetch('/api/merchent/forecasts/baseline', { method: 'DELETE' }) } catch {} }} className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50">Clear baseline</button>
            {showCompare && (
              <div className="ml-auto flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 bg-emerald-500 rounded-sm" /> Current</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 bg-orange-500 rounded-sm" /> Baseline</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <strong>How to compare:</strong> 1) Click “Set baseline to current” to snapshot today’s forecasts. 2) Generate new forecasts or apply an adjustment. 3) Enable “Compare with baseline” to see differences. If bars look identical, capture a baseline first or apply a change.
          </div>
        </div>
        {engine && (
          <div className="bg-white text-gray-900 shadow rounded-lg p-5 sm:col-span-2">
            <button onClick={() => setShowEngineDetails((s) => !s)} className="w-full text-left">
              <p className="text-sm text-gray-500 mb-1">Forecast Engine</p>
              <div className="text-sm">
                <div><span className="text-gray-500">Provider:</span> {engine.provider || '—'}</div>
                {engine.meta && (
                  <div className="mt-1 flex flex-wrap gap-4">
                    {engine.meta.framework && <div><span className="text-gray-500">Framework:</span> {engine.meta.framework}</div>}
                    {engine.meta.model && <div><span className="text-gray-500">Model:</span> {engine.meta.model}</div>}
                    {typeof engine.meta.epochs === 'number' && <div><span className="text-gray-500">Epochs:</span> {engine.meta.epochs}</div>}
                    {typeof engine.meta.loss === 'number' && <div><span className="text-gray-500">Loss:</span> {engine.meta.loss.toFixed(4)}</div>}
                    {Array.isArray(engine.meta.layers) && engine.meta.layers.length > 0 && (
                      <div><span className="text-gray-500">Layers:</span> [{engine.meta.layers.join(' → ')}]</div>
                    )}
                  </div>
                )}
              </div>
            </button>
            {showEngineDetails && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-gray-700 mb-2">This model is a simple MLP trained briefly on the last 52 weeks of demand to predict the next 12 weeks. You can apply market adjustments by describing conditions below. If Cohere is configured, it will propose per-week multipliers; otherwise a heuristic factor is used.</p>
                {/* Glossary links */}
                <div className="mb-3 text-xs text-gray-600">
                  <button type="button" className="underline decoration-dotted mr-3" onClick={() => setInfoOpen({ title: 'Framework', body: 'Indicates the engine used for forecasts: PyTorch (local neural net), Cohere (LLM-generated multipliers), or Local (simple average-based fallback).' })}>Framework</button>
                  <button type="button" className="underline decoration-dotted mr-3" onClick={() => setInfoOpen({ title: 'Model', body: 'MLP (Multi-Layer Perceptron) with hidden sizes [128, 64], trained on the last 52 weeks to predict 12 weeks ahead.' })}>Model</button>
                  <button type="button" className="underline decoration-dotted mr-3" onClick={() => setInfoOpen({ title: 'Epochs', body: 'Number of training passes over the small in-memory dataset. More epochs can improve fit but may overfit noise.' })}>Epochs</button>
                  <button type="button" className="underline decoration-dotted mr-3" onClick={() => setInfoOpen({ title: 'Loss', body: 'Mean Squared Error between predicted and target values for the training window. Lower is better, but absolute value depends on data scale.' })}>Loss</button>
                  <button type="button" className="underline decoration-dotted" onClick={() => setInfoOpen({ title: 'Layers', body: 'Network layout. Here: input 52 weeks → dense(128) → dense(64) → output 12 weeks.' })}>Layers</button>
                  <a href="/merchent/forecasts/engine" className="ml-4 text-blue-600 hover:text-blue-700">Learn more →</a>
                </div>

                {/* Market Intuition Score */}
                <MarketIntuition
                  weights={lastAdjust?.weightsUsed}
                  factor={lastAdjust?.factorUsed}
                />

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setAdjusting(true)
                  try {
                    const res = await fetch('/api/assistant/adjust-forecast', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: adjustPrompt })
                    })
                    const txt = await res.text()
                    let j: any = null
                    try { j = txt ? JSON.parse(txt) : null } catch {}
                    if (!res.ok || !j?.ok) {
                      alert((j && j.error) || txt || 'Adjustment failed')
                      return
                    }
                    console.log('[Adjust] result:', j)
                    setLastAdjust({ provider: j?.provider, weightsUsed: j?.weightsUsed, factorUsed: j?.factorUsed })
                    await load()
                  } finally {
                    setAdjusting(false)
                  }
                }} className="flex gap-2 items-center">
                  <input value={adjustPrompt} onChange={(e) => setAdjustPrompt(e.target.value)} className="flex-1 rounded-md border-gray-300" placeholder="e.g., Market slightly low next quarter" />
                  <button type="submit" disabled={adjusting} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
                    {adjusting ? 'Applying…' : 'Apply Adjustment'}
                  </button>
                </form>
                {/* Quick suggestions */}
                <div className="mt-2 text-xs text-gray-600">
                  <span className="mr-2">Quick suggestions:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button type="button" className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setAdjustPrompt('Market is crashing; reduce demand for all items by about 15%.')}>Market crashing (−15%)</button>
                    <button type="button" className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setAdjustPrompt('Demand is low across the catalog; reduce forecasts by ~10%.')}>Demand low (−10%)</button>
                    <button type="button" className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setAdjustPrompt('Optimistic outlook; increase demand across the catalog by about 10%.')}>Optimistic (+10%)</button>
                    {items.slice(0,3).map((it) => (
                      <button key={`low-${it.sku}`} type="button" className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setAdjustPrompt(`Demand is low for ${it.name} (${it.sku}); reduce its forecast by ~10%.`)}>Low: {it.name}</button>
                    ))}
                    {items.slice(0,3).map((it) => (
                      <button key={`up-${it.sku}`} type="button" className="px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setAdjustPrompt(`Optimistic for ${it.name} (${it.sku}); increase its forecast by ~10%.`)}>Optimistic: {it.name}</button>
                    ))}
                  </div>
                </div>
                {lastAdjust && (
                  <div className="mt-3 text-xs text-gray-600">
                    <div><span className="text-gray-500">Applied via:</span> {lastAdjust.provider}</div>
                    {Array.isArray(lastAdjust.weightsUsed) && lastAdjust.weightsUsed.length === 12 ? (
                      <div className="mt-1">
                        <span className="text-gray-500">Weights:</span>
                        <div className="mt-1 max-w-full overflow-x-auto whitespace-nowrap">
                          [{lastAdjust.weightsUsed.map((w, i) => <span key={i} className="inline-block mr-1">{w.toFixed(2)}{i<11?', ':''}</span>)}]
                        </div>
                      </div>
                    ) : typeof lastAdjust.factorUsed === 'number' ? (
                      <div className="mt-1"><span className="text-gray-500">Factor:</span> {lastAdjust.factorUsed.toFixed(2)}</div>
                    ) : null}
                  </div>
                )}

                {/* Conversational help */}
                <div className="mt-6">
                  <button type="button" onClick={() => setChatOpen((v) => !v)} className="text-sm text-blue-600 hover:text-blue-700">
                    {chatOpen ? 'Hide' : 'Open'} Engine Coach
                  </button>
                  {chatOpen && (
                    <div className="mt-2 rounded-md border p-3">
                      <div className="text-xs text-gray-600 mb-2">Ask about what the engine is doing, how weights affect forecasts, or how to interpret metrics.</div>
                      <div className="max-h-48 overflow-y-auto space-y-2 mb-2">
                        {chatMsgs.map((m, i) => (
                          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                            <div className={`inline-block rounded px-2 py-1 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>{m.content}</div>
                          </div>
                        ))}
                        {chatBusy && <div className="text-left text-xs text-gray-500">Thinking…</div>}
                      </div>
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const q = chatInput.trim()
                        if (!q) return
                        setChatMsgs((arr) => [...arr, { role: 'user', content: q }])
                        setChatInput('')
                        setChatBusy(true)
                        try {
                          const ctx = JSON.stringify({ provider: engine?.provider, meta: engine?.meta, lastAdjust })
                          const r = await fetch('/api/assistant/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, context: ctx, path: '/merchent/forecasts' }) })
                          const j = await r.json().catch(() => null)
                          const reply = j?.reply || j?.error || 'Sorry, I could not answer.'
                          setChatMsgs((arr) => [...arr, { role: 'assistant', content: reply }])
                        } finally {
                          setChatBusy(false)
                        }
                      }} className="flex items-center gap-2">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 rounded-md border-gray-300" placeholder="Ask about loss, layers, weights…" />
                        <button type="submit" disabled={chatBusy} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50">Send</button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Simple adjust (direct factor) */}
                <div className="mt-6">
                  <div className="text-sm font-semibold mb-1">Simple Adjust (direct factor)</div>
                  <div className="text-xs text-gray-600 mb-2">Quickly scale the 12-week forecasts without using weights. Enter a percent and optional SKUs (comma-separated). Leave SKUs empty to apply to all.</div>
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    const factor = 1 + (Number(simplePct) || 0) / 100
                    try {
                      const skus = simpleSkus.split(',').map(s => s.trim()).filter(Boolean)
                      const res = await fetch('/api/assistant/adjust-forecast/simple', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ factor, skus: skus.length ? skus : 'all' }) })
                      const j = await res.json().catch(() => null)
                      if (!res.ok || !j?.ok) {
                        alert((j && j.error) || 'Simple adjust failed')
                        return
                      }
                      setLastAdjust({ provider: 'simple', factorUsed: factor })
                      await load()
                    } catch (err) {
                      alert('Simple adjust failed')
                    }
                  }} className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-gray-600">Percent</label>
                    <input type="number" value={simplePct} onChange={(e) => setSimplePct(Number(e.target.value))} className="w-24 rounded-md border-gray-300" min={-50} max={50} step={1} />
                    <label className="text-xs text-gray-600">SKUs</label>
                    <input value={simpleSkus} onChange={(e) => setSimpleSkus(e.target.value)} placeholder="e.g., COF-001,CHOC-002" className="flex-1 rounded-md border-gray-300" />
                    <button type="submit" className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">Apply</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white text-gray-900 shadow rounded-lg">
        <div className="px-5 py-4 border-b"><h2 className="font-semibold">SKU Forecasts</h2></div>
        {loading ? (
          <p className="p-5 text-gray-600">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Demand (52w)</th>
                  <th className="px-3 py-2 text-left">Forecast (12w)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((it) => {
                  const baseArr = showCompare ? (prevForecasts[it.sku] || []) : []
                  const curArr = Array.isArray(it.forecasted_demand) ? (it.forecasted_demand as number[]) : []
                  let deltaLabel: string | null = null
                  if (showCompare && baseArr.length === 12 && curArr.length === 12) {
                    const sumBase = baseArr.reduce((s, v) => s + (Number(v) || 0), 0)
                    const sumCur = curArr.reduce((s, v) => s + (Number(v) || 0), 0)
                    if (sumBase > 0) {
                      const pct = ((sumCur - sumBase) / sumBase) * 100
                      deltaLabel = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
                    } else {
                      deltaLabel = null
                    }
                  }
                  return (
                  <tr key={it.sku} className="text-gray-900">
                    <td className="px-3 py-2">{it.sku}</td>
                    <td className="px-3 py-2">{it.name}</td>
                    <td className="px-3 py-2">
                      <div
                        className="cursor-pointer"
                        onClick={() => setZoom({ sku: it.sku, name: it.name, data: it.demand52 || [] })}
                        title="Click to expand"
                      >
                        <Sparkline data={it.demand52 || []} color="bg-blue-500" />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Sparkline
                        data={it.forecasted_demand || []}
                        secondData={showCompare ? (prevForecasts[it.sku] || []) : undefined}
                        color="bg-emerald-500"
                        secondColor="bg-orange-500"
                        showValues
                      />
                      {/* Quick nudge controls per SKU */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-gray-500">Nudge:</span>
                        {[-10, -5, +5, +10].map((pct) => (
                          <button
                            key={`${it.sku}-${pct}`}
                            disabled={!!busySkus[it.sku]}
                            onClick={async () => {
                              setBusySkus((m) => ({ ...m, [it.sku]: true }))
                              try {
                                const factor = 1 + pct / 100
                                const res = await fetch('/api/assistant/adjust-forecast/simple', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ factor, skus: [it.sku] })
                                })
                                const j = await res.json().catch(() => null)
                                if (!res.ok || !j?.ok) {
                                  alert((j && j.error) || 'Adjust failed')
                                } else {
                                  setLastAdjust({ provider: 'simple', factorUsed: factor })
                                  await load()
                                }
                              } catch (e) {
                                alert('Adjust failed')
                              } finally {
                                setBusySkus((m) => ({ ...m, [it.sku]: false }))
                              }
                            }}
                            className="px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                            title={`Apply ${pct > 0 ? '+' : ''}${pct}% to ${it.sku}`}
                          >
                            {pct > 0 ? `+${pct}%` : `${pct}%`}
                          </button>
                        ))}
                        {busySkus[it.sku] && <span className="text-gray-500">Applying…</span>}
                      </div>
                      {showCompare && (
                        <div className="mt-1 text-xs text-gray-600">
                          {deltaLabel ? <span>Change vs. baseline: {deltaLabel}</span> : <span>No baseline or no change</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <div className="bg-white text-gray-900 rounded-lg shadow-xl max-w-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{zoom.name} ({zoom.sku})</h3>
                <p className="text-sm text-gray-500">52-week demand</p>
              </div>
              <button className="text-gray-600 hover:text-gray-900" onClick={() => setZoom(null)}>✕</button>
            </div>
            <Sparkline data={zoom.data} color="bg-blue-500" height={220} width={720} showValues />
          </div>
        </div>
      )}
    </div>
  )
}

function MarketIntuition({ weights, factor }: { weights?: number[]; factor?: number }) {
  // Score: average absolute deviation from 1.0 scaled to 0..100
  let score = 0
  if (Array.isArray(weights) && weights.length === 12) {
    const avgDev = weights.reduce((s, w) => s + Math.abs(w - 1), 0) / 12
    score = Math.min(100, Math.round(avgDev * 200))
  } else if (typeof factor === 'number') {
    score = Math.min(100, Math.round(Math.abs(factor - 1) * 200))
  }
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="underline decoration-dotted cursor-help" title="Measures how much market adjustments deviate forecasts from the model’s baseline. Higher = larger manual adjustment.">Market Intuition Score</span>
        <span>{score}/100</span>
      </div>
      <div className="mt-1 h-2 w-full rounded bg-gray-200">
        <div className="h-2 rounded bg-indigo-500" style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function Sparkline({ data, color = 'bg-blue-500', showValues = false, height = 48, width = 192, secondData, secondColor = 'bg-orange-500' }: { data: number[]; color?: string; showValues?: boolean; height?: number; width?: number; secondData?: number[]; secondColor?: string }) {
  if (!data || !data.length) return <span className="text-gray-400">n/a</span>
  const max = Math.max(...data)
  const count = data.length
  return (
    <div className="flex items-end gap-[2px]" style={{ height: `${height}px`, width: `${width}px` }}>
      {data.map((v, i) => {
        const pct = max ? (v / max) * 100 : 0
        const inBar = pct > 35
        return (
          <div key={i} className="relative" style={{ width: `calc(100% / ${count})`, height: '100%' }}>
            {/* Primary bar */}
            <div className={`${color} absolute left-0 ${secondData && secondData.length === count ? 'right-1/2' : 'right-0'} bottom-0`} style={{ height: `${pct}%` }} />
            {/* Secondary overlay bar (baseline) */}
            {Array.isArray(secondData) && secondData.length === count && (
              <div className={`${secondColor} absolute left-1/2 right-0 bottom-0 opacity-80`} style={{ height: `${max ? (Math.max(0, secondData[i]) / max) * 100 : 0}%` }} />
            )}
            {showValues && (
              <span
                className={`absolute left-1/2 -translate-x-1/2 text-[10px] leading-none select-none ${inBar ? 'text-white' : 'text-gray-700'}`}
                style={{ bottom: inBar ? '2px' : 'calc(100% + 2px)' }}
                title={String(v)}
              >
                {Math.round(v)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
