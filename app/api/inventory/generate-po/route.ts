import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const PO_PATH = path.join(process.cwd(), 'backend', 'data', 'purchase_orders.json')

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { sku?: string, qty?: number }
    const sku = (body.sku || '').toString()
    const qty = Math.max(0, Math.floor(Number(body.qty) || 0))
    if (!sku || qty <= 0) return NextResponse.json({ ok: false, error: 'Invalid sku or qty' }, { status: 400 })
    const now = new Date().toISOString()
    const raw = await fs.readFile(PO_PATH, 'utf-8').catch(() => '[]')
    const arr = raw ? JSON.parse(raw) : []
    arr.push({ id: cryptoRandom(), sku, qty, created_at: now, status: 'draft' })
    await fs.mkdir(path.dirname(PO_PATH), { recursive: true })
    await fs.writeFile(PO_PATH, JSON.stringify(arr, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to generate PO' }, { status: 500 })
  }
}

function cryptoRandom() {
  // lightweight id
  return 'po_' + Math.random().toString(36).slice(2, 10)
}

