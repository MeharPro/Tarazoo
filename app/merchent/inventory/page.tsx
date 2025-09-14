'use client'

import { useEffect, useState } from 'react'

type InvItem = { sku: string; name: string }

export default function InventoryPage() {
  const [items, setItems] = useState<InvItem[]>([])
  const [loading, setLoading] = useState(true)
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [minWeeks, setMinWeeks] = useState<Record<string, number>>({})
  const [editingQty, setEditingQty] = useState<Record<string, number>>({})
  const [editingWeek, setEditingWeek] = useState<Record<string, number>>({})

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/merchent/catalog', { cache: 'no-store' })
        const j = await res.json()
        const arr = Array.isArray(j.items) ? (j.items as any[]).map((it) => ({ sku: it.sku, name: it.name })) : []
        setItems(arr)
        // Load overrides
        try {
          const or = await fetch('/api/inventory/overrides', { cache: 'no-store' })
          const oj = await or.json().catch(() => null)
          if (oj && oj.ok && oj.overrides) setOverrides(oj.overrides as Record<string, number>)
        } catch {}
        // Load min weeks
        try {
          const mr = await fetch('/api/inventory/min-week', { cache: 'no-store' })
          const mj = await mr.json().catch(() => null)
          if (mj && mj.ok && mj.weeks) setMinWeeks(mj.weeks as Record<string, number>)
        } catch {}
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <p className="mt-1 text-gray-600">List of catalog items. Adjust quantity and click Save (stored in local JSON). Sales decrement inventory automatically.</p>
      </div>

      <div className="bg-white text-gray-900 shadow rounded-lg">
        <div className="px-5 py-4 border-b"><h2 className="font-semibold">Catalog Inventory</h2></div>
        {loading ? (
          <p className="p-5 text-gray-600">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-2 text-left">SKU</th>
                  <th className="px-5 py-2 text-left">Name</th>
                  <th className="px-5 py-2 text-left">Quantity</th>
                  <th className="px-5 py-2 text-left">Min Inv Week</th>
                  <th className="px-5 py-2 text-left">Cumulative Demand</th>
                  <th className="px-5 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((i) => (
                  <InventoryRow
                    key={i.sku}
                    sku={i.sku}
                    name={i.name}
                    qty={editingQty[i.sku] != null ? editingQty[i.sku] : (overrides[i.sku] != null ? overrides[i.sku] : 0)}
                    minWeek={Math.max(1, Math.min(12, editingWeek[i.sku] != null ? editingWeek[i.sku] : (minWeeks[i.sku] != null ? minWeeks[i.sku] : 1)))}
                    onQtyChange={(v) => setEditingQty((m) => ({ ...m, [i.sku]: v }))}
                    onWeekChange={(v) => setEditingWeek((m) => ({ ...m, [i.sku]: v }))}
                    onSave={async (mw, qty) => {
                      try {
                        const res = await fetch('/api/inventory/overrides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sku: i.sku, quantity: qty }) })
                        const j = await res.json().catch(() => null)
                        if (!res.ok || !j?.ok) alert((j && j.error) || 'Failed to save')
                        else setOverrides((m) => ({ ...m, [i.sku]: qty }))
                      } catch {
                        alert('Failed to save')
                      }
                      try {
                        const r2 = await fetch('/api/inventory/min-week', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sku: i.sku, week: mw }) })
                        const j2 = await r2.json().catch(() => null)
                        if (!r2.ok || !j2?.ok) alert((j2 && j2.error) || 'Failed to save min week')
                        else setMinWeeks((m) => ({ ...m, [i.sku]: mw }))
                      } catch {
                        alert('Failed to save min week')
                      }
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function InventoryRow({ sku, name, qty, minWeek, onQtyChange, onWeekChange, onSave }: { sku: string, name: string, qty: number, minWeek: number, onQtyChange: (v: number) => void, onWeekChange: (v: number) => void, onSave: (mw: number, qty: number) => void }) {
  const [cum, setCum] = useState<number>(0)
  const [danger, setDanger] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/merchent/catalog', { cache: 'no-store' })
        const j = await res.json()
        const it = Array.isArray(j.items) ? (j.items as any[]).find((x) => x.sku === sku) : null
        const fc: number[] = (it && Array.isArray(it.forecasted_demand)) ? it.forecasted_demand : []
        const n = Math.max(1, Math.min(12, minWeek))
        const sum = fc.slice(0, n).reduce((s, v) => s + (Number(v) || 0), 0)
        setCum(sum)
        setDanger(qty < sum)
      } finally {
        setLoading(false)
      }
    })()
  }, [sku, minWeek, qty])

  return (
    <tr className={danger ? 'bg-red-50' : ''}>
      <td className="px-5 py-2">{sku}</td>
      <td className="px-5 py-2">{name}</td>
      <td className="px-5 py-2">
        <input type="number" className="w-24 rounded-md border-gray-300" value={qty} onChange={(e) => onQtyChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
      </td>
      <td className="px-5 py-2">
        <input type="number" className="w-20 rounded-md border-gray-300" value={minWeek} min={1} max={12} onChange={(e) => onWeekChange(Math.max(1, Math.min(12, Math.floor(Number(e.target.value) || 1))))} />
      </td>
      <td className="px-5 py-2">{loading ? '…' : cum.toFixed(2)}</td>
      <td className="px-5 py-2">
        <button className="px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm mr-2" onClick={() => onSave(minWeek, qty)}>Save</button>
        {danger && (
          <button className="px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 text-sm" onClick={async () => {
            const need = Math.max(0, Math.ceil(cum - qty))
            if (need <= 0) return
            try {
              const res = await fetch('/api/inventory/generate-po', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sku, qty: need }) })
              const j = await res.json().catch(() => null)
              if (!res.ok || !j?.ok) alert((j && j.error) || 'Failed to generate PO')
              else alert(`PO generated for ${sku}: ${need}`)
            } catch { alert('Failed to generate PO') }
          }}>Generate PO</button>
        )}
      </td>
    </tr>
  )
}
