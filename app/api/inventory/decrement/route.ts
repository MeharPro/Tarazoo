import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getInventoryForMerchant } from 'lib/supabase'

const OVERRIDE_PATH = path.join(process.cwd(), 'backend', 'data', 'inventory_overrides.json')

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { items?: Array<{ sku: string, qty: number }> }
    const items = Array.isArray(body.items) ? body.items : []
    if (!items.length) return NextResponse.json({ ok: false, error: 'No items' }, { status: 400 })

    // Load current overrides
    const raw = await fs.readFile(OVERRIDE_PATH, 'utf-8').catch(() => '{}')
    const overrides: Record<string, number> = raw ? JSON.parse(raw) : {}

    // Ensure baseline from Supabase if override missing
    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || ''
    const inv = await getInventoryForMerchant(merchantId)
    const baseBySku: Record<string, number> = {}
    inv.forEach((row: any) => { baseBySku[row.sku] = Number(row.available_quantity) || 0 })

    for (const it of items) {
      const sku = String(it.sku || '').trim()
      const qty = Math.max(0, Math.floor(Number(it.qty) || 0))
      const current = (overrides[sku] != null ? overrides[sku] : baseBySku[sku] != null ? baseBySku[sku] : 0)
      overrides[sku] = Math.max(0, current - qty)
    }

    await fs.mkdir(path.dirname(OVERRIDE_PATH), { recursive: true })
    await fs.writeFile(OVERRIDE_PATH, JSON.stringify(overrides, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to decrement inventory' }, { status: 500 })
  }
}

