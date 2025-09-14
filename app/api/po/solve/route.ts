import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const CATALOG_PATH = path.join(process.cwd(), 'backend', 'data', 'catalog.json')
const OVERRIDE_PATH = path.join(process.cwd(), 'backend', 'data', 'inventory_overrides.json')
const MINW_PATH = path.join(process.cwd(), 'backend', 'data', 'min_inv_weeks.json')

async function loadCatalog(): Promise<any[]> {
  try {
    const raw = await fs.readFile(CATALOG_PATH, 'utf-8').catch(() => '{}')
    const json = JSON.parse(raw)
    if (Array.isArray(json)) return json
    if (Array.isArray(json.items)) return json.items
    return []
  } catch { return [] }
}

async function loadOverrides(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(OVERRIDE_PATH, 'utf-8').catch(() => '{}')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

async function loadMinWeeks(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(MINW_PATH, 'utf-8').catch(() => '{}')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { solver?: string }
    const solver = (body.solver || 'glpk').toString()
    const items = await loadCatalog()
    const overrides = await loadOverrides()
    const minWeeks = await loadMinWeeks()

    const payloadItems = (items || []).map((it: any) => {
      const fc: number[] = Array.isArray(it.forecasted_demand) ? it.forecasted_demand : []
      const n = Math.max(1, Math.min(12, minWeeks[it.sku] || 1))
      const cum = fc.slice(0, n).reduce((s, v) => s + (Number(v) || 0), 0)
      const qty = overrides[it.sku] != null ? overrides[it.sku] : 0
      const shortfall = Math.max(0, Number((cum - qty).toFixed(2)))
      return {
        sku: it.sku,
        shortfall,
        case_pack: Number(it.case_pack || it.casePack || 1) || 1,
        moq: Number(it.moq || 0) || 0,
      }
    })

    const base = process.env.PO_BASE_URL || 'http://localhost:8002'
    let res
    try {
      res = await fetch(base.replace(/\/$/, '') + '/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: payloadItems, solver }) })
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: 'PO service unreachable' }, { status: 502 })
    }
    const j = await res.json().catch(() => null)
    if (!res.ok || !j) return NextResponse.json({ ok: false, error: 'PO service error' }, { status: 502 })
    return NextResponse.json({ ok: true, ...j, items: payloadItems })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
