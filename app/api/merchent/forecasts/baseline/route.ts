import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const BASE_PATH = path.join(process.cwd(), 'backend', 'data', 'forecast_baseline.json')

export async function GET() {
  try {
    const raw = await fs.readFile(BASE_PATH, 'utf-8').catch(() => '{}')
    const j = raw ? JSON.parse(raw) : {}
    const baseline = (j && typeof j === 'object') ? j : {}
    return NextResponse.json({ ok: true, baseline })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to read baseline' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { baseline?: Record<string, number[]> }
    const baseline = (body.baseline && typeof body.baseline === 'object') ? body.baseline : {}
    await fs.mkdir(path.dirname(BASE_PATH), { recursive: true })
    await fs.writeFile(BASE_PATH, JSON.stringify(baseline, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to save baseline' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await fs.writeFile(BASE_PATH, '{}', 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to clear baseline' }, { status: 500 })
  }
}

