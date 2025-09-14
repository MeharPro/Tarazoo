import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const base = process.env.FORECAST_BASE_URL || 'http://localhost:8001'
    try {
      const res = await fetch(base.replace(/\/$/, '') + '/forecast_catalog', { method: 'POST' })
      if (!res.ok) {
        const err = await res.text()
        // Try Cohere fallback first
        const ch = await cohereFallbackForecast()
        if (ch.ok) return NextResponse.json({ ok: true, updated: ch.updated, provider: 'cohere', note: 'service: ' + err })
        // Fall back to local naive forecast if service unavailable
        const fb = await localFallbackForecast()
        if (fb.ok) return NextResponse.json({ ok: true, updated: fb.updated, provider: 'fallback', error: 'service: ' + err })
        return NextResponse.json({ ok: false, error: 'Forecast service error: ' + err }, { status: 502 })
      }
      const j = await res.json()
      // Include provider hint for the UI
      const provider = j?.framework ? `service:${j.framework}` : 'service'
      return NextResponse.json({ ok: true, ...j, provider })
    } catch (e: any) {
      // Try Cohere fallback
      const ch = await cohereFallbackForecast()
      if (ch.ok) return NextResponse.json({ ok: true, updated: ch.updated, provider: 'cohere' })
      // Fall back locally
      const fb = await localFallbackForecast()
      if (fb.ok) return NextResponse.json({ ok: true, updated: fb.updated, provider: 'fallback' })
      return NextResponse.json({ ok: false, error: e?.message || 'Could not reach forecast service' }, { status: 502 })
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

import { promises as fs } from 'fs'
import path from 'path'

async function localFallbackForecast() {
  try {
    const p = path.join(process.cwd(), 'backend', 'data', 'catalog.json')
    const raw = await fs.readFile(p, 'utf-8').catch(() => '{"items":[]}')
    const j = JSON.parse(raw || '{"items":[]}')
    const items = Array.isArray(j.items) ? j.items : []
    let updated = 0
    for (const it of items) {
      const draw: any = it.demand52 ?? it.demand_52 ?? it['52_weeks_demand'] ?? []
      const d: number[] = Array.isArray(draw) ? draw.map((n: any) => Number(n)) : []
      if (d.length > 0) {
        const last = d.slice(-12)
        const avg = last.length ? last.reduce((s, v) => s + v, 0) / last.length : 0
        // simple flat forecast using last-12 avg
        it.forecasted_demand = Array.from({ length: 12 }, () => Number(avg.toFixed(2)))
        updated += 1
      }
    }
    await fs.writeFile(p, JSON.stringify({ items }, null, 2), 'utf-8')
    return { ok: true, updated }
  } catch {
    return { ok: false, updated: 0 }
  }
}

async function cohereFallbackForecast() {
  try {
    const apiKey = process.env.COHERE_API_KEY
    if (!apiKey) return { ok: false, updated: 0 }
    const p = path.join(process.cwd(), 'backend', 'data', 'catalog.json')
    const raw = await fs.readFile(p, 'utf-8').catch(() => '{"items":[]}')
    const j = JSON.parse(raw || '{"items":[]}')
    const items = Array.isArray(j.items) ? j.items : []
    const payloadItems = items.map((it: any) => ({ sku: String(it.sku), demand52: (it.demand52 ?? it.demand_52 ?? it['52_weeks_demand'] ?? []) })).filter((x: any) => Array.isArray(x.demand52) && x.demand52.length > 0)
    if (!payloadItems.length) return { ok: false, updated: 0 }

    const exemplar = payloadItems.slice(0, 15)
    const system = `You are a forecasting assistant. Given past 52 weeks of demand per SKU, create a 12-week forecast per SKU.
Return STRICT JSON only with this shape: { "forecasts": { "<SKU>": [n1, n2, ..., n12], ... } }.
Use only numbers (no strings), exactly 12 values per list.`
    const user = { role: 'user', content: JSON.stringify({ items: exemplar }) }

    const res = await fetch('https://api.cohere.ai/v2/chat', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'command-r-plus', messages: [{ role: 'system', content: system }, user], temperature: 0.2 }),
    })
    if (!res.ok) return { ok: false, updated: 0 }
    const data = await res.json()
    let txt = ''
    try {
      const parts = data?.message?.content
      if (Array.isArray(parts)) txt = parts.map((p: any) => p?.text || '').join('\n').trim()
    } catch {}
    if (!txt) txt = data?.text || data?.reply || ''
    if (!txt) return { ok: false, updated: 0 }
    const start = txt.indexOf('{'); const end = txt.lastIndexOf('}');
    const jsonStr = start >= 0 && end > start ? txt.slice(start, end + 1) : txt
    let parsed: any
    try { parsed = JSON.parse(jsonStr) } catch { return { ok: false, updated: 0 } }
    const fc: Record<string, number[]> = parsed?.forecasts || {}
    let updated = 0
    for (const it of items) {
      const arr = fc[String(it.sku)]
      if (Array.isArray(arr) && arr.length === 12) { it.forecasted_demand = arr.map((n) => Number(n)); updated += 1 }
    }
    await fs.writeFile(p, JSON.stringify({ items }, null, 2), 'utf-8')
    return { ok: updated > 0, updated }
  } catch {
    return { ok: false, updated: 0 }
  }
}

