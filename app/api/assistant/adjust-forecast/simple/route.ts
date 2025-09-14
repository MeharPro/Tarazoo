import { NextResponse } from 'next/server'
import { getCatalogItems, updateForecastForSkus, recordAdjustmentEntries, getSalesTransactions } from 'lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { factor?: number, skus?: string[] | 'all' }
    let factor = Number(body.factor)
    if (!Number.isFinite(factor) || factor <= 0) return NextResponse.json({ ok: false, error: 'Invalid factor' }, { status: 400 })
    // clamp to reasonable range
    factor = Math.max(0.5, Math.min(1.5, factor))
    const targetSkus = Array.isArray(body.skus) && body.skus.length ? body.skus : 'all'

    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || ''
    const items = await getCatalogItems(merchantId)
    if (!items.length) return NextResponse.json({ ok: false, error: 'No items' }, { status: 400 })

    const forecasts: Record<string, number[]> = {}
    const appliedSkus: string[] = []
    const targetSet = targetSkus === 'all' ? null : new Set((targetSkus as string[]).map((s) => s.trim().toLowerCase()))
    // Sales-aware modulation: compute simple per-SKU sales factor from last 7 days vs prior 28 avg
    const sales = await getSalesTransactions(merchantId)
    const now = new Date()
    const sevenAgo = new Date(now)
    sevenAgo.setDate(now.getDate() - 7)
    const thirtyFiveAgo = new Date(now)
    thirtyFiveAgo.setDate(now.getDate() - 35)
    const bySku = new Map<string, { last7: number, prev28: number }>()
    for (const s of sales as any[]) {
      const dstr = s.sale_date || ''
      const d = new Date(dstr)
      const entry = bySku.get(s.product_id) || { last7: 0, prev28: 0 }
      if (d >= sevenAgo && d <= now) entry.last7 += Number(s.quantity) || 0
      else if (d >= thirtyFiveAgo && d < sevenAgo) entry.prev28 += Number(s.quantity) || 0
      bySku.set(s.product_id, entry)
    }

    for (const it of items) {
      const skuNorm = String(it.sku || '').trim().toLowerCase()
      if (targetSet && !targetSet.has(skuNorm)) continue
      let base: number[] = Array.isArray((it as any).forecasted_demand) ? ((it as any).forecasted_demand as number[]) : []
      if (base.length !== 12) {
        const d52: number[] = Array.isArray((it as any).demand52) ? ((it as any).demand52 as number[]) : []
        if (d52.length >= 12) {
          base = d52.slice(-12)
        } else if (d52.length > 0) {
          const first = d52[0]
          base = Array.from({ length: 12 }, (_, i) => d52[i] ?? first)
        } else {
          base = Array.from({ length: 12 }, () => 0)
        }
      }
      // Sales factor
      const salesEntry = bySku.get(it.sku) || { last7: 0, prev28: 0 }
      let salesFactor = 1.0
      if (salesEntry.prev28 > 0) {
        const weekAvg = salesEntry.prev28 / 4
        salesFactor = (salesEntry.last7 || 0) / weekAvg
        // clamp
        salesFactor = Math.min(1.2, Math.max(0.8, Number(salesFactor.toFixed(2))))
      }
      const finalFactor = Number((factor * salesFactor).toFixed(3))
      forecasts[it.sku] = base.map((v) => Math.max(0, Number((Number(v) * finalFactor).toFixed(2))))
      appliedSkus.push(it.sku)
    }
    if (!appliedSkus.length) return NextResponse.json({ ok: false, error: 'No applicable SKUs found to adjust (ensure forecasts or demand52 exist)' }, { status: 400 })

    const updated = await updateForecastForSkus(forecasts, merchantId)
    const score = Math.min(100, Math.round(Math.abs(factor - 1) * 200))
    await recordAdjustmentEntries(appliedSkus.map((sku) => ({ merchant_id: merchantId, sku, provider: 'simple', prompt: `simple factor ${factor}`, weights: null, factor, score })))
    return NextResponse.json({ ok: true, updated, provider: 'simple', factorUsed: factor, skus: appliedSkus })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
