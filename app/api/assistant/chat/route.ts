import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message: string = (body.message || '').toString()
    const context: string = (body.context || '').toString()
    const history: Array<{ role: string; content: string }> = Array.isArray(body.history) ? body.history : []
    const path: string = (body.path || '').toString()

    const apiKey = process.env.COHERE_API_KEY

    const systemPrompt = `You are a concise, friendly product assistant embedded in a web app. 
Explain what the user is looking at using the provided page context. 
Focus on purpose, key actions, and any data summaries. 
Avoid guessing unavailable details. Keep answers short, clear, and actionable. 
If the user asks how to do something, give step-by-step guidance.`

    // Build messages in OpenAI-like format for Cohere v2 compatibility
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Route: ${path || '/'}\n\nPage context:\n${context.slice(0, 4000)}\n\nUser question: ${message || 'Explain this page and what I can do here.'}` }
    ]

    if (!apiKey) {
      // Fallback local explanation without calling Cohere
      const tldr = makeHeuristicExplanation(context, path)
      return NextResponse.json({ ok: true, reply: tldr, provider: 'local-fallback' })
    }

    // Call Cohere Chat v2 endpoint
    const cohereRes = await fetch('https://api.cohere.ai/v2/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r-plus',
        messages,
        temperature: 0.3,
      }),
    })

    if (!cohereRes.ok) {
      const errText = await cohereRes.text()
      const tldr = makeHeuristicExplanation(context, path)
      return NextResponse.json({ ok: true, reply: tldr, provider: 'fallback', error: errText })
    }

    const data = await cohereRes.json()
    // Try to parse v2 content structure
    let reply = ''
    try {
      const parts = data?.message?.content
      if (Array.isArray(parts)) {
        reply = parts.map((p: any) => p?.text || '').join('\n').trim()
      }
    } catch {}
    if (!reply) {
      // fallback older API shapes
      reply = data?.text || data?.reply || JSON.stringify(data)
    }

    return NextResponse.json({ ok: true, reply, provider: 'cohere' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

function makeHeuristicExplanation(context: string, path: string) {
  const lc = context.toLowerCase()
  const bullets: string[] = []
  if (lc.includes('catalogue') || lc.includes('catalog')) {
    bullets.push('Upload or download your product catalogue as JSON')
    bullets.push('Add or remove SKUs, including 52-week demand and expiration')
    bullets.push('Review metrics: total SKUs, sales, average weekly demand, top suppliers/countries')
  }
  if (lc.includes('dashboard')) {
    bullets.push('View sales metrics and recent orders in real time')
    bullets.push('Run optimizations and review results when available')
  }
  if (lc.includes('login')) {
    bullets.push('Sign in with your merchant credentials to continue')
  }
  if (bullets.length === 0) {
    bullets.push('This page shows interactive data and actions for your store')
  }
  return `${bullets.join(' • ')}\nRoute: ${path}`
}

