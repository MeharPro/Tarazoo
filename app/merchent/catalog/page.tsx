'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CtaButton, ClickMe } from 'components/ui/Animated'

type Item = {
  sku: string
  name: string
  supplier: string
  country: string
  casePack: number
  moq: number
  sales: number
  demand52: number[]
  expiration: string
}

export default function CatalogPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [zoom, setZoom] = useState<{ sku: string; name: string; data: number[] } | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/merchent/catalog')
      const j = await res.json()
      setItems(j.items || [])
    } finally {
      setLoading(false)
    }
  }

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch('/api/merchent/catalog', { method: 'POST', body: fd })
      const j = await res.json()
      if (res.ok) setItems(j.items || [])
      else alert(j.error || 'Upload failed')
    } finally {
      setSaving(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeSku = async (sku: string) => {
    if (!confirm(`Remove SKU ${sku}?`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/merchent/catalog?sku=${encodeURIComponent(sku)}`, { method: 'DELETE' })
      const j = await res.json()
      if (res.ok) setItems(j.items || [])
      else alert(j.error || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  // Inline add form state
  const [form, setForm] = useState<Partial<Item>>({ demand52: new Array(52).fill(0) })
  const addSku = async () => {
    // Basic validation
    if (!form.sku || !form.name || !form.supplier || !form.country || !form.demand52 || (form.demand52 as number[]).length !== 52) {
      alert('Please fill SKU, Name, Supplier, Country, and 52 weeks of demand (comma-separated 52 numbers).')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/merchent/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', item: form }),
      })
      const j = await res.json()
      if (res.ok) setItems(j.items || [])
      else alert(j.error || 'Add failed')
    } finally {
      setSaving(false)
    }
  }

  // Metrics
  const metrics = useMemo(() => {
    const totalSkus = items.length
    const totalSales = items.reduce((s, it) => s + (Number(it.sales) || 0), 0)
    const allWeeks = items.flatMap((it) => it.demand52 || [])
    const avgWeeklyDemand = allWeeks.length ? allWeeks.reduce((s, v) => s + v, 0) / allWeeks.length : 0
    const suppliers = new Map<string, number>()
    const countries = new Map<string, number>()
    const soonExpiring: Item[] = []
    const now = new Date()
    const soon = new Date(now.getTime() + 60 * 24 * 3600 * 1000) // 60 days
    for (const it of items) {
      suppliers.set(it.supplier, (suppliers.get(it.supplier) || 0) + 1)
      countries.set(it.country, (countries.get(it.country) || 0) + 1)
      if (it.expiration) {
        const d = new Date(it.expiration)
        if (!isNaN(d.getTime()) && d <= soon) soonExpiring.push(it)
      }
    }
    const topSuppliers = Array.from(suppliers.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topCountries = Array.from(countries.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { totalSkus, totalSales, avgWeeklyDemand, topSuppliers, topCountries, soonExpiring }
  }, [items])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catalogue Manager</h1>
          <p className="mt-1 text-gray-600">Upload JSON, add/remove SKUs, and view metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/merchent/catalog" className="px-4 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50">Download JSON</a>
          <a href="/sample-catalog.json" target="_blank" className="px-4 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50">Sample JSON</a>
          <div className="relative">
            <label className="cursor-pointer px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 inline-block">
              {saving ? 'Uploading…' : 'Upload JSON'}
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onUpload} />
            </label>
            {!saving && <ClickMe />}
          </div>
          <a href="/merchent/forecasts" className="px-4 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50">Open Forecasts</a>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Total SKUs</p>
          <p className="text-2xl font-semibold">{metrics.totalSkus}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-semibold">${metrics.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Avg Weekly Demand</p>
          <p className="text-2xl font-semibold">{metrics.avgWeeklyDemand.toFixed(1)}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Suppliers (Top)</p>
          <p className="text-sm mt-1">
            {metrics.topSuppliers.map(([name, count]) => (
              <span key={name} className="mr-3">{name}: {count}</span>
            ))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add SKU */}
        <div className="bg-white text-gray-900 shadow rounded-lg p-5 lg:col-span-1">
          <h2 className="font-semibold mb-3">Add / Replace SKU</h2>
          <div className="space-y-3">
            <input className="w-full rounded-md border-gray-300" placeholder="SKU" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className="w-full rounded-md border-gray-300" placeholder="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full rounded-md border-gray-300" placeholder="Supplier" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            <input className="w-full rounded-md border-gray-300" placeholder="Country of Origin" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="w-full rounded-md border-gray-300" placeholder="Case Pack" value={form.casePack ?? ''} onChange={(e) => setForm({ ...form, casePack: Number(e.target.value) })} />
              <input type="number" className="w-full rounded-md border-gray-300" placeholder="MOQ" value={form.moq ?? ''} onChange={(e) => setForm({ ...form, moq: Number(e.target.value) })} />
            </div>
            <input type="number" step="0.01" className="w-full rounded-md border-gray-300" placeholder="Sales ($)" value={form.sales ?? ''} onChange={(e) => setForm({ ...form, sales: Number(e.target.value) })} />
            <textarea className="w-full rounded-md border-gray-300" rows={3} placeholder="52 weeks demand (comma-separated)" value={(form.demand52 as number[] | undefined)?.join(', ') || ''}
              onChange={(e) => {
                const nums = e.target.value.split(',').map((x) => Number(x.trim())).filter((n) => !isNaN(n))
                setForm({ ...form, demand52: nums })
              }} />
            <input type="date" className="w-full rounded-md border-gray-300" value={form.expiration || ''} onChange={(e) => setForm({ ...form, expiration: e.target.value })} />
            <button onClick={addSku} disabled={saving} className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving…' : 'Add / Replace'}</button>
          </div>
        </div>

        {/* Catalogue Table */}
        <div className="bg-white text-gray-900 shadow rounded-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Catalogue ({items.length})</h2>
          </div>
          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Supplier</th>
                    <th className="px-3 py-2 text-left">Country</th>
                    <th className="px-3 py-2 text-left">Case/MOQ</th>
                    <th className="px-3 py-2 text-left">Sales</th>
                    <th className="px-3 py-2 text-left">Demand (52w)</th>
                    <th className="px-3 py-2 text-left">Expiration</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((it) => (
                    <tr key={it.sku} className="text-gray-900">
                      <td className="px-3 py-2">{it.sku}</td>
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2">{it.supplier}</td>
                      <td className="px-3 py-2">{it.country}</td>
                      <td className="px-3 py-2">{it.casePack}/{it.moq}</td>
                      <td className="px-3 py-2">${Number(it.sales || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <div
                          className="cursor-pointer"
                          onClick={() => setZoom({ sku: it.sku, name: it.name, data: it.demand52 })}
                          title="Click to expand"
                        >
                          <Sparkline data={it.demand52} color="bg-blue-500" />
                        </div>
                      </td>
                      <td className="px-3 py-2">{it.expiration || '-'}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeSku(it.sku)} className="text-red-600 hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 bg-white text-gray-900 shadow rounded-lg p-5">
        <h2 className="font-semibold mb-3">Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Top Suppliers</p>
            <ul className="list-disc ml-5 text-sm">
              {metrics.topSuppliers.map(([n, c]) => (
                <li key={n}>{n}: {c} SKUs</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Top Countries</p>
            <ul className="list-disc ml-5 text-sm">
              {metrics.topCountries.map(([n, c]) => (
                <li key={n}>{n}: {c} SKUs</li>
              ))}
            </ul>
          </div>
        </div>
        {metrics.soonExpiring.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Expiring within ~60 days</p>
            <ul className="list-disc ml-5 text-sm">
              {metrics.soonExpiring.slice(0, 10).map((it) => (
                <li key={it.sku}>{it.name} ({it.sku}) — {it.expiration}</li>
              ))}
            </ul>
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
