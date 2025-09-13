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
      const res = await fetch('/api/merchent/catalog/forecast', { method: 'POST' })
      const j = await res.json()
      if (!res.ok || !j.ok) alert(j.error || 'Forecast failed')
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
                {items.map((it) => (
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
                    <td className="px-3 py-2"><Sparkline data={it.forecasted_demand || []} color="bg-emerald-500" showValues /></td>
                  </tr>
                ))}
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

function Sparkline({ data, color = 'bg-blue-500', showValues = false, height = 48, width = 192 }: { data: number[]; color?: string; showValues?: boolean; height?: number; width?: number }) {
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
            <div className={`${color} absolute left-0 right-0 bottom-0`} style={{ height: `${pct}%` }} />
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
