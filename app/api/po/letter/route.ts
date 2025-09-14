import { NextResponse } from 'next/server'

function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function pad10(n: number): string { return String(n).padStart(10, '0') }

function wrapLines(rawLines: string[], maxWidth = 72): string[] {
  const out: string[] = []
  for (const line of rawLines) {
    const words = String(line || '').split(/\s+/)
    let cur = ''
    for (const w of words) {
      if (!w) continue
      if ((cur + ' ' + w).trim().length > maxWidth) {
        if (cur) out.push(cur)
        cur = w
      } else {
        cur = (cur ? cur + ' ' : '') + w
      }
    }
    out.push(cur)
  }
  return out
}

function makePdf(linesInput: string[]): Uint8Array {
  const lines = wrapLines(linesInput, 72)
  const header = '%PDF-1.4\n'
  // Build content stream with multiple lines
  const escaped = lines.map((t) => t.replace(/[()]/g, ''))
  const contentBody = [
    'BT',
    '/F1 12 Tf',
    '14 TL',
    '72 760 Td',
    `(${escaped[0] || ''}) Tj`,
  ]
  // Insert remaining lines as (text) Tj on new lines using text leading
  for (let i = 1; i < escaped.length; i++) {
    contentBody.push('T*')
    contentBody.push(`(${escaped[i]}) Tj`)
  }
  contentBody.push('ET')
  const contentText = contentBody.join('\n')
  const contentBytes = encode(contentText)

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
  const obj4_header = `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`
  const obj4_footer = '\nendstream\nendobj\n'
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'

  // Compute byte offsets
  let chunks: Uint8Array[] = []
  const headerBytes = encode(header)
  chunks.push(headerBytes)
  let offset = headerBytes.length
  const offsets: number[] = []

  function pushObj(strOrBytes: string | Uint8Array) {
    globalThis
    const bytes = typeof strOrBytes === 'string' ? encode(strOrBytes) : strOrBytes
    chunks.push(bytes)
    offset += bytes.length
  }

  offsets.push(offset); pushObj(obj1)
  offsets.push(offset); pushObj(obj2)
  offsets.push(offset); pushObj(obj3)
  offsets.push(offset); pushObj(obj4_header); pushObj(contentBytes); pushObj(obj4_footer)
  offsets.push(offset); pushObj(obj5)

  const xrefStart = offset
  let xref = 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 0; i < offsets.length; i++) {
    xref += `${pad10(offsets[i])} 00000 n \n`
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  pushObj(xref)
  pushObj(trailer)

  // Concatenate all chunks
  const totalLen = chunks.reduce((s, b) => s + b.length, 0)
  const out = new Uint8Array(totalLen)
  let pos = 0
  for (const b of chunks) { out.set(b, pos); pos += b.length }
  return out
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { supplier?: string, items?: Array<{ sku: string, qty: number }>, buyer?: { name?: string, address?: string, email?: string } }
    const supplier = (body.supplier || 'Supplier').toString()
    const items = Array.isArray(body.items) ? body.items : []

    // Manual formatting with fixed-width columns and proper line breaks (no AI formatting)
    const dateStr = new Date().toLocaleDateString()
    const headerLines = [
      'PURCHASE ORDER',
      `Date: ${dateStr}`,
      `Supplier: ${supplier}`,
    ]
    const buyerLines: string[] = []
    if (body.buyer) {
      if (body.buyer.name) buyerLines.push(`Buyer: ${body.buyer.name}`)
      if (body.buyer.address) buyerLines.push(`Address: ${body.buyer.address}`)
      if (body.buyer.email) buyerLines.push(`Email: ${body.buyer.email}`)
    }
    const tableHeader = 'SKU'.padEnd(18) + 'Qty'.padStart(8)
    const tableRule = ''.padEnd(26, '-')
    const tableRows = items.map((it: any) => `${String(it.sku).padEnd(18)}${String(it.qty).padStart(8)}`)
    const footerLines = [
      ' ',
      'Thank you for your prompt attention to this order.',
      'Please confirm receipt and provide estimated delivery date.',
    ]
    const contentLines = [
      ...headerLines,
      ' ',
      ...buyerLines,
      buyerLines.length ? ' ' : '',
      'Items:',
      tableHeader,
      tableRule,
      ...tableRows,
      ...footerLines,
    ].filter(Boolean)

    const bytes = makePdf(contentLines)
    return new NextResponse(bytes, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="purchase_order.pdf"' } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to generate letter' }, { status: 500 })
  }
}
