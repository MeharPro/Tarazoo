import { NextResponse } from 'next/server'
import { getCatalogItems, updateForecastForSkus, recordAdjustmentEntries } from 'lib/supabase'

type AdjustResult = {
  ok: boolean
  updated?: number
  provider?: string
  weightsUsed?: number[]
  factorUsed?: number
  error?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { prompt?: string }
    const prompt = (body.prompt || '').toString()
    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || ''

    const items = await getCatalogItems(merchantId)
    if (!items.length) {
      return NextResponse.json({ ok: false, error: 'No catalog items found' } satisfies AdjustResult, { status: 400 })
    }

    // Determine target and direction from user intent
    const intent = parsePromptIntent(prompt, items)

    // Prefer Cohere if configured
    const apiKey = process.env.COHERE_API_KEY
    if (apiKey) {
      const cohereRes = await callCohereForWeights(apiKey, prompt, items)
      if (cohereRes.ok) {
        const applied = await applyWeightsToForecasts(merchantId, items, cohereRes.weights, cohereRes.factor, intent.targetSkus)
        const score = scoreFromWeightsOrFactor(cohereRes.weights, cohereRes.factor)
        // Audit rows per SKU updated
        await recordAdjustmentEntries((applied.skus || []).map((sku) => ({
          merchant_id: merchantId,
          sku,
          provider: 'cohere',
          prompt,
          weights: cohereRes.weights,
          factor: cohereRes.factor,
          score,
        })))
        return NextResponse.json({ ok: true, updated: applied.updated, provider: 'cohere', weightsUsed: cohereRes.weights || undefined, factorUsed: cohereRes.factor || undefined } satisfies AdjustResult)
      }
    }

    // Heuristic fallback if no Cohere or it failed
    const factor = heuristicFactorFromIntent(intent)
    const applied = await applyWeightsToForecasts(merchantId, items, null, factor, intent.targetSkus)
    const score = scoreFromWeightsOrFactor(null, factor)
    await recordAdjustmentEntries((applied.skus || []).map((sku) => ({
      merchant_id: merchantId,
      sku,
      provider: 'heuristic',
      prompt,
      weights: null,
      factor,
      score,
    })))
    return NextResponse.json({ ok: true, updated: applied.updated, provider: 'heuristic', factorUsed: factor } satisfies AdjustResult)
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' } satisfies AdjustResult, { status: 500 })
  }
}

function heuristicFactorFromIntent(intent: { sentiment: 'down'|'up'|'neutral'|'crash' }): number {
  if (intent.sentiment === 'crash') return 0.85
  if (intent.sentiment === 'down') return 0.9
  if (intent.sentiment === 'up') return 1.1
  return 1.0
}

async function callCohereForWeights(apiKey: string, prompt: string, items: any[]): Promise<{ ok: boolean, weights: number[] | null, factor: number | null }> {
  try {
    const sys = `You are a demand forecasting assistant.
The user provides guidance; you MUST respond with STRICT JSON ONLY and NOTHING ELSE.
Always prefer providing explicit per-week multipliers rather than a single factor.
Return: {"weights":[w1,w2,...,w12]} ONLY.
Rules:
- Exactly 12 numbers.
- Each weight between 0.5 and 1.5.
- Use 1.00 when unchanged.
- No commentary, no extra keys.`
    const user = { role: 'user', content: prompt || 'Market slightly low next quarter' }
    const res = await fetch('https://api.cohere.ai/v2/chat', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'command-r-plus', messages: [{ role: 'system', content: sys }, user], temperature: 0.0, max_tokens: 200 })
    })
    if (!res.ok) return { ok: false, weights: null, factor: null }
    const data = await res.json()
    let txt = ''
    try {
      const parts = data?.message?.content
      if (Array.isArray(parts)) txt = parts.map((p: any) => p?.text || '').join('\n').trim()
    } catch {}
    if (!txt) txt = data?.text || data?.reply || ''
    const start = txt.indexOf('{'); const end = txt.lastIndexOf('}')
    const jsonStr = start >= 0 && end > start ? txt.slice(start, end + 1) : txt
    const parsed = JSON.parse(jsonStr)
    let weights = Array.isArray(parsed?.weights) ? parsed.weights.map((n: any) => Number(n)) : null
    // Clamp and normalize
    if (Array.isArray(weights)) {
      weights = weights.slice(0, 12).map((w: number) => {
        if (!Number.isFinite(w)) return 1.0
        return Math.min(1.5, Math.max(0.5, Number(w.toFixed(3))))
      })
      while (weights.length < 12) weights.push(1.0)
    }
    // If still no weights, fallback to factor 1.0
    const factor = null
    return { ok: Array.isArray(weights) && weights.length === 12, weights, factor }
  } catch {
    return { ok: false, weights: null, factor: null }
  }
}

async function applyWeightsToForecasts(merchantId: string, items: any[], weights: number[] | null, factor: number | null, targetSkus: string[] | 'all' | null = 'all'): Promise<{ updated: number, skus: string[] }> {
  const forecasts: Record<string, number[]> = {}
  const skus: string[] = []
  for (const it of items) {
    if (targetSkus !== 'all' && targetSkus && !targetSkus.includes(it.sku)) continue
    const cur: number[] | null = (it as any).forecasted_demand || null
    const base: number[] = Array.isArray(cur) && cur.length === 12 ? cur : []
    if (!base.length) continue
    let adjusted: number[]
    if (Array.isArray(weights) && weights.length === 12) {
      adjusted = base.map((v, i) => Math.max(0, Number((v * weights[i]).toFixed(2))))
    } else if (typeof factor === 'number') {
      adjusted = base.map((v) => Math.max(0, Number((v * factor).toFixed(2))))
    } else {
      adjusted = base
    }
    forecasts[it.sku] = adjusted
    skus.push(it.sku)
  }
  if (Object.keys(forecasts).length === 0) return { updated: 0, skus: [] }
  const updated = await updateForecastForSkus(forecasts, merchantId)
  return { updated, skus }
}

function scoreFromWeightsOrFactor(weights: number[] | null, factor: number | null): number {
  if (Array.isArray(weights) && weights.length === 12) {
    const avgDev = weights.reduce((s, w) => s + Math.abs(w - 1), 0) / 12
    return Math.min(100, Math.round(avgDev * 200))
  }
  if (typeof factor === 'number') {
    return Math.min(100, Math.round(Math.abs(factor - 1) * 200))
  }
  return 0
}

function parsePromptIntent(prompt: string, items: any[]): { sentiment: 'down'|'up'|'neutral'|'crash'; targetSkus: string[]|'all' } {
  const p = (prompt || '').toLowerCase()
  // Sentiment detection
  let sentiment: 'down'|'up'|'neutral'|'crash' = 'neutral'
  if (/(crash|plunge|collapse|meltdown)/.test(p)) sentiment = 'crash'
  else if (/(low|decreas|down|bear|weak|slow|recession|soft)/.test(p)) sentiment = 'down'
  else if (/(optimistic|high|increase|up|bull|strong|hot|boom|surge|spike|demand up)/.test(p)) sentiment = 'up'

  // Target detection by sku or name mention
  const targets: string[] = []
  for (const it of items) {
    const sku: string = String(it.sku || '').toLowerCase()
    const name: string = String(it.name || '').toLowerCase()
    if (!sku && !name) continue
    if (sku && p.includes(sku)) targets.push(it.sku)
    else if (name && name.split(/\s+/).some((tok) => tok.length > 2 && p.includes(tok))) targets.push(it.sku)
  }
  const unique = Array.from(new Set(targets))
  const targetSkus: 'all' | string[] = unique.length ? unique : 'all'
  return { sentiment, targetSkus }
}
