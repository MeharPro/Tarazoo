"use client"

import { useEffect, useMemo, useState } from 'react'

type Row = { sku: string, name: string, casePack: number, moq: number, shortfall: number }

export default function PoDesignPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [solver, setSolver] = useState<'scip'|'cplex'|'glpk'>('glpk')
  const [solution, setSolution] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [editingText, setEditingText] = useState(false)
  const [notes, setNotes] = useState<{ overview?: string; model?: string; adjustments?: string; glossary?: string }>({})

  const totalUnits = useMemo(() => Object.values(solution).reduce((s, v) => s + (Number(v) || 0), 0), [solution])

  useEffect(() => { void loadData(); void loadNotes() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [catRes, overRes, minRes] = await Promise.all([
        fetch('/api/merchent/catalog', { cache: 'no-store' }),
        fetch('/api/inventory/overrides', { cache: 'no-store' }),
        fetch('/api/inventory/min-week', { cache: 'no-store' }),
      ])
      const cat = await catRes.json()
      const over = await overRes.json().catch(() => null)
      const minw = await minRes.json().catch(() => null)
      const overrides: Record<string, number> = over?.ok ? over.overrides : {}
      const weeks: Record<string, number> = minw?.ok ? minw.weeks : {}
      const list: Row[] = (Array.isArray(cat.items) ? cat.items : []).map((it: any) => {
        const casePack = Number(it.casePack || it.case_pack || 1) || 1
        const moq = Number(it.moq || 0)
        const n = Math.max(1, Math.min(12, Number(weeks[it.sku] || 1)))
        const cum = Array.isArray(it.forecasted_demand) ? it.forecasted_demand.slice(0, n).reduce((s: number, v: number) => s + (Number(v) || 0), 0) : 0
        const qty = overrides[it.sku] != null ? Number(overrides[it.sku]) : 0
        const shortfall = Math.max(0, cum - qty)
        return { sku: it.sku, name: it.name, casePack, moq, shortfall }
      })
      setRows(list)
    } finally { setLoading(false) }
  }

  async function runSolve() {
    setLoading(true)
    try {
      const res = await fetch('/api/po/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ solver }) })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) { alert((j && j.error) || 'Solve failed'); return }
      setSolution(j.quantities || {})
    } finally { setLoading(false) }
  }

  async function loadNotes() {
    try {
      const r = await fetch('/api/po/notes', { cache: 'no-store' })
      const j = await r.json().catch(() => null)
      if (j && j.ok && j.notes) setNotes(j.notes)
    } catch {}
  }

  async function saveNotes() {
    try {
      const res = await fetch('/api/po/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notes) })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) alert((j && j.error) || 'Failed to save text')
      else setEditingText(false)
    } catch { alert('Failed to save text') }
  }

  async function downloadLetter() {
    const items = Object.entries(solution).map(([sku, qty]) => ({ sku, qty }))
    const res = await fetch('/api/po/letter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplier: 'Default Supplier', items }) })
    if (!res.ok) { alert('Failed to generate letter'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'purchase_order.pdf'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Purchase Order Design</h1>
          <p className="mt-1 text-black dark:text-white">Meet demand while respecting supplier constraints (case packs, MOQs). Choose a solver and generate a purchase plan.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">Solver</label>
          <select value={solver} onChange={(e) => setSolver(e.target.value as any)} className="rounded-md border-gray-300">
            <option value="scip">SCIP</option>
            <option value="cplex">CPLEX</option>
            <option value="glpk">GLPK (fallback)</option>
          </select>
          <button onClick={runSolve} disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">{loading ? 'Solving…' : 'Solve'}</button>
          <button onClick={downloadLetter} disabled={!Object.keys(solution).length} className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-50">Generate PO PDF</button>
          <button onClick={() => setEditingText((v) => !v)} className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50">{editingText ? 'Close Edit' : 'Edit Text'}</button>
          {editingText && <button onClick={saveNotes} className="px-4 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700">Save</button>}
        </div>
      </div>

      <div className="mb-6 rounded-md bg-white p-4 shadow">
        <h2 className="text-lg font-semibold mb-2 text-black">Theory (Quick)</h2>
        {editingText ? (
          <textarea value={notes.overview ?? 'We model PO design as a small integer program...'} onChange={(e) => setNotes((n) => ({ ...n, overview: e.target.value }))} className="w-full rounded-md border-gray-300 text-black" rows={4} />
        ) : (
          <p className="text-sm text-black">{notes.overview ?? 'We model PO design as a small integer program. Decision variables are the number of cases per SKU. Constraints ensure you order in case packs and meet minimum order quantities (MOQs) and demand shortfalls. The objective minimizes total ordered units.'}</p>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-5 py-4 border-b"><h2 className="font-semibold">Constraints & Demand</h2></div>
        <div className="overflow-x-auto text-black">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-2 text-left">SKU</th>
                <th className="px-5 py-2 text-left">Name</th>
                <th className="px-5 py-2 text-left">Case Pack</th>
                <th className="px-5 py-2 text-left">MOQ</th>
                <th className="px-5 py-2 text-left">Shortfall (units)</th>
                <th className="px-5 py-2 text-left">Recommended Order</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.sku}>
                  <td className="px-5 py-2">{r.sku}</td>
                  <td className="px-5 py-2">{r.name}</td>
                  <td className="px-5 py-2">{r.casePack || 1}</td>
                  <td className="px-5 py-2">{r.moq || 0}</td>
                  <td className="px-5 py-2">{r.shortfall.toFixed(2)}</td>
                  <td className="px-5 py-2">{solution[r.sku] != null ? solution[r.sku] : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-sm text-gray-600 border-t flex items-center justify-between">
          <span>After solving, the purchase order PDF will include recommended quantities for each SKU.</span>
          <span>Total units (latest solution): <span className="font-semibold text-gray-900">{totalUnits}</span></span>
        </div>
      </div>
    </div>
  )
}
