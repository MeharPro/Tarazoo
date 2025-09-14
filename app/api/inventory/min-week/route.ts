import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const PATH = path.join(process.cwd(), 'backend', 'data', 'min_inv_weeks.json')

export async function GET() {
  try {
    const raw = await fs.readFile(PATH, 'utf-8').catch(() => '{}')
    const json = raw ? JSON.parse(raw) : {}
    return NextResponse.json({ ok: true, weeks: json })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to read min weeks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { sku?: string, week?: number }
    const sku = (body.sku || '').toString()
    const week = Math.max(1, Math.min(12, Math.floor(Number(body.week) || 1)))
    if (!sku) return NextResponse.json({ ok: false, error: 'Invalid sku' }, { status: 400 })
    const raw = await fs.readFile(PATH, 'utf-8').catch(() => '{}')
    const weeks = raw ? JSON.parse(raw) : {}
    weeks[sku] = week
    await fs.mkdir(path.dirname(PATH), { recursive: true })
    await fs.writeFile(PATH, JSON.stringify(weeks, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to save min week' }, { status: 500 })
  }
}

