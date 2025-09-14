import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SALES_PATH = path.join(process.cwd(), 'backend', 'data', 'sales.json')

async function readSales() {
  const raw = await fs.readFile(SALES_PATH, 'utf-8')
  return JSON.parse(raw)
}

async function writeSales(data: any) {
  await fs.writeFile(SALES_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export async function GET() {
  try {
    const json = await readSales()
    return NextResponse.json(json.sales || [])
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const qty = Number(body.quantity ?? 1)
    const unitPrice = Number(body.unit_price ?? 1999) // cents
    const productId = (body.product_id ?? 'DEMO-001').toString()
    const productName = (body.product_name ?? 'Demo Product').toString()

    const db = await readSales()
    const sales = Array.isArray(db.sales) ? db.sales : []

    const id = `SALE-${String(sales.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString().slice(0, 10)
    const entry = {
      id,
      product_id: productId,
      product_name: productName,
      quantity: qty,
      unit_price: unitPrice / 100,
      total_amount: (unitPrice * qty) / 100,
      sale_date: now,
      customer_id: 'CUST-DEMO',
      status: 'completed',
    }

    sales.unshift(entry)
    db.sales = sales
    await writeSales(db)

    return NextResponse.json({ ok: true, entry })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to append order' }, { status: 500 })
  }
}

