import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const OVERRIDE_PATH = path.join(process.cwd(), 'backend', 'data', 'inventory_overrides.json')

export async function GET() {
  try {
    const raw = await fs.readFile(OVERRIDE_PATH, 'utf-8').catch(() => '{}')
    const json = raw ? JSON.parse(raw) : {}
    return NextResponse.json({ ok: true, overrides: json })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to read overrides' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { sku?: string, quantity?: number }
    const sku = (body.sku || '').toString()
    const quantity = Number(body.quantity)
    if (!sku || !Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ ok: false, error: 'Invalid sku or quantity' }, { status: 400 })
    }
    const raw = await fs.readFile(OVERRIDE_PATH, 'utf-8').catch(() => '{}')
    const overrides = raw ? JSON.parse(raw) : {}
    overrides[sku] = Math.max(0, Math.floor(quantity))
    await fs.mkdir(path.dirname(OVERRIDE_PATH), { recursive: true })
    await fs.writeFile(OVERRIDE_PATH, JSON.stringify(overrides, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update overrides' }, { status: 500 })
  }
}

