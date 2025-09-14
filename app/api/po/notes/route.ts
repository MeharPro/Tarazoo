import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const NOTES_PATH = path.join(process.cwd(), 'backend', 'data', 'po_design_notes.json')

export async function GET() {
  try {
    const raw = await fs.readFile(NOTES_PATH, 'utf-8').catch(() => '{}')
    const json = raw ? JSON.parse(raw) : {}
    return NextResponse.json({ ok: true, notes: json })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to read notes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const notes = typeof body === 'object' && body ? body : {}
    await fs.mkdir(path.dirname(NOTES_PATH), { recursive: true })
    await fs.writeFile(NOTES_PATH, JSON.stringify(notes, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to save notes' }, { status: 500 })
  }
}

