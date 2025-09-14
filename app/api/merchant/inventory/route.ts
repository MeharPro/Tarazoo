import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const INV_PATH = path.join(process.cwd(), 'backend', 'data', 'inventory.json')

export async function GET() {
  try {
    const data = await fs.readFile(INV_PATH, 'utf-8')
    const json = JSON.parse(data)
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read inventory.json' }, { status: 500 })
  }
}

