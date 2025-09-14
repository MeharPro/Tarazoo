import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  const base = (process.env.FORECAST_BASE_URL || '').replace(/\/$/, '')
  if (base) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 700)
      const res = await fetch(base + '/', { signal: controller.signal })
      clearTimeout(id)
      if (res.ok) return NextResponse.json({ ok: true, provider: 'service' })
    } catch {}
  }
  // Fallback: if we can read/write catalog.json locally, consider assistant available
  try {
    const p = path.join(process.cwd(), 'backend', 'data', 'catalog.json')
    await fs.access(p).catch(async () => {
      // try to create a minimal file if missing
      await fs.mkdir(path.dirname(p), { recursive: true })
      await fs.writeFile(p, '{"items":[]}', 'utf-8')
    })
    return NextResponse.json({ ok: true, provider: 'fallback' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unreachable' })
  }
}

