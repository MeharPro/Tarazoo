import { NextResponse } from 'next/server'
import { getCatalogItems, updateForecastForSkus } from 'lib/supabase'

export async function POST() {
  try {
    const base = process.env.FORECAST_BASE_URL || 'http://localhost:8001'
    try {
      const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || ''
      const items = await getCatalogItems(merchantId)
      const payload = { items: items.map((it: any) => ({ sku: it.sku, demand52: it.demand52 || [] })), output_weeks: 12 }
      const res = await fetch(base.replace(/\/$/, '') + '/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.text()
        const ch = await cohereFallbackForecast()
        if (ch.ok) return NextResponse.json({ ok: true, updated: ch.updated, provider: 'cohere', note: 'service: ' + err, meta: { framework: 'cohere', model: 'command-r-plus' } })
        const fb = await localFallbackForecast()
        if (fb.ok) return NextResponse.json({ ok: true, updated: fb.updated, provider: 'fallback', error: 'service: ' + err, meta: { framework: 'local', model: 'average_tail' } })
        return NextResponse.json({ ok: false, error: 'Forecast service error: ' + err }, { status: 502 })
      }
      const j = await res.json()
      const forecasts = (j?.forecasts || {}) as Record<string, number[]>
      const updated = await updateForecastForSkus(forecasts, merchantId)
      const provider = 'service:' + (j?.meta?.framework || 'pytorch')
      return NextResponse.json({ ok: true, updated, provider, meta: j?.meta || null })
    } catch (e: any) {
      const ch = await cohereFallbackForecast()
      if (ch.ok) return NextResponse.json({ ok: true, updated: ch.updated, provider: 'cohere', meta: { framework: 'cohere', model: 'command-r-plus' } })
      const fb = await localFallbackForecast()
      if (fb.ok) return NextResponse.json({ ok: true, updated: fb.updated, provider: 'fallback', meta: { framework: 'local', model: 'average_tail' } })
      return NextResponse.json({ ok: false, error: e?.message || 'Could not reach forecast service' }, { status: 502 })
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

async function localFallbackForecast() {
  try {
    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || ''
    const items = await getCatalogItems(merchantId)
    const forecasts: Record<string, number[]> = {}
    let withDemand = 0
    for (const it of items) {
      const d = Array.isArray((it as any).demand52) ? (it as any).demand52 as number[] : []
      if (d.length) {
        withDemand += 1
        const last = d.slice(-12)
        const avg = last.length ? last.reduce((s, v) => s + v, 0) / last.length : 0
        forecasts[it.sku] = Array.from({ length: 12 }, () => Number(avg.toFixed(2)))
      }
    }
    const updated = await updateForecastForSkus(forecasts, merchantId)
    return { ok: true, updated, diag: { total: items.length, withDemand } }
  } catch {
    return { ok: true, updated: 0, diag: { total: 0, withDemand: 0 } }
  }
}

async function cohereFallbackForecast() {
  try {
    const apiKey = process.env.COHERE_API_KEY
    if (!apiKey) return { ok: false, updated: 0 }
    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || ''
    const items = await getCatalogItems(merchantId)
    const payloadItems = items.map((it: any) => ({ sku: String(it.sku), demand52: (it.demand52 ?? []) })).filter((x: any) => Array.isArray(x.demand52) && x.demand52.length > 0)
    if (!payloadItems.length) return { ok: false, updated: 0 }

    const exemplar = payloadItems.slice(0, 15)
    const system = `You are a forecasting assistant. Given past 52 weeks of demand per SKU, create a 12-week forecast per SKU.\nReturn STRICT JSON only with this shape: { "forecasts": { "<SKU>": [n1, n2, ..., n12], ... } }.\nUse only numbers (no strings), exactly 12 values per list.`
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
    const updated = await updateForecastForSkus(fc, merchantId)
    return { ok: true, updated }
  } catch {
    return { ok: true, updated: 0 }
  }
}
