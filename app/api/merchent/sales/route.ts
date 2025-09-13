import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SALES_PATH = path.join(process.cwd(), 'backend', 'data', 'sales.json')

export async function GET() {
  try {
    const data = await fs.readFile(SALES_PATH, 'utf-8')
    const json = JSON.parse(data)
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read sales.json' }, { status: 500 })
  }
}

