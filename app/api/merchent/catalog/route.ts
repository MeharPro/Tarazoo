import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const CATALOG_PATH = path.join(process.cwd(), 'backend', 'data', 'catalog.json')

type CatalogItem = {
  sku: string
  name: string
  supplier: string
  country: string
  casePack: number
  moq: number
  sales: number
  demand52: number[]
  expiration: string
}

type Catalog = { items: CatalogItem[] }

async function readCatalog(): Promise<Catalog> {
  try {
    const raw = await fs.readFile(CATALOG_PATH, 'utf-8')
    const json = JSON.parse(raw)
    if (Array.isArray(json)) return { items: json as CatalogItem[] }
    if (Array.isArray(json.items)) return { items: json.items as CatalogItem[] }
    return { items: [] }
  } catch (e) {
    return { items: [] }
  }
}

async function writeCatalog(data: Catalog) {
  await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true })
  await fs.writeFile(CATALOG_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

function normalizeItem(obj: any): CatalogItem | null {
  if (!obj) return null
  const sku = (obj.sku || obj.SKU || '').toString().trim()
  const name = (obj.name || obj.productName || obj["name of prod"] || '').toString().trim()
  const supplier = (obj.supplier || obj.supplierName || obj["supplier name"] || '').toString().trim()
  const country = (obj.country || obj.countryOfOrigin || obj["country of origin"] || '').toString().trim()
  const casePack = Number(obj.casePack || obj.case_pack || obj["case pack req"] || obj.casePackReq || 0)
  const moq = Number(obj.moq || obj["moq req"] || obj.moqReq || 0)
  const sales = Number(obj.sales ?? 0)
  const demand52 = Array.isArray(obj.demand52) ? obj.demand52.map(Number) : Array.isArray(obj["52_weeks_demand"]) ? obj["52_weeks_demand"].map(Number) : []
  const expiration = (obj.expiration || obj.expiry || '').toString()

  if (!sku || !name || !supplier || !country || demand52.length !== 52) return null

  return { sku, name, supplier, country, casePack, moq, sales, demand52, expiration }
}

export async function GET() {
  const data = await readCatalog()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let payload: Catalog

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
      const text = await file.text()
      const json = JSON.parse(text)
      const itemsRaw: any[] = Array.isArray(json) ? json : Array.isArray(json.items) ? json.items : []
      const items: CatalogItem[] = []
      for (const r of itemsRaw) {
        const it = normalizeItem(r)
        if (it) items.push(it)
      }
      payload = { items }
    } else {
      // JSON body: either full replace or single add
      const body = await request.json().catch(() => ({} as any))
      if (body && body.action === 'add' && body.item) {
        const current = await readCatalog()
        const it = normalizeItem(body.item)
        if (!it) return NextResponse.json({ error: 'Invalid item' }, { status: 400 })
        // Replace if SKU already exists
        const idx = current.items.findIndex((x) => x.sku === it.sku)
        if (idx >= 0) current.items[idx] = it
        else current.items.unshift(it)
        await writeCatalog(current)
        return NextResponse.json({ ok: true, items: current.items })
      }
      // Otherwise treat as replace
      const itemsRaw: any[] = Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : []
      const items: CatalogItem[] = []
      for (const r of itemsRaw) {
        const it = normalizeItem(r)
        if (it) items.push(it)
      }
      payload = { items }
    }

    await writeCatalog(payload)
    return NextResponse.json({ ok: true, items: payload.items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save catalog' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const sku = url.searchParams.get('sku')
    if (!sku) return NextResponse.json({ error: 'Missing sku' }, { status: 400 })
    const current = await readCatalog()
    const next = current.items.filter((x) => x.sku !== sku)
    await writeCatalog({ items: next })
    return NextResponse.json({ ok: true, items: next })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
  }
}

