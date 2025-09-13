'use server';

import { NextRequest, NextResponse } from 'next/server';

// Allowed catalog labels. Must match exactly for downstream cart lookup.
const ALLOWED_ITEMS = [
  'pen',
  'head cap',
  'redbull',
  'google cloud water bottle',
  'chips'
];

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Cohere API key not configured' }, { status: 500 });
    }

    const { image } = await req.json();
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    // Accept either a data URL (data:image/jpeg;base64,...) or raw base64
    const match = image.match(/^data:(.*?);base64,(.*)$/);
    const mime = match ? match[1] : 'image/jpeg';
    const b64 = match ? match[2] : image;

    // System prompt ensures exact label selection
    const systemPrompt = `You are a retail vision assistant. Given an image of a product, choose exactly one label from this list and reply ONLY with that label in lowercase with no punctuation or extra words:\n\n- pen\n- head cap\n- redbull\n- google cloud water bottle\n- chips\n\nIf uncertain, pick the closest match.`;

    // Call Cohere Chat API with vision model
    const cohereRes = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'c4ai-aya-vision-32b',
        message: 'Identify the product from the image and output only the exact label.',
        preamble: systemPrompt,
        temperature: 0,
        // Attach the image as base64. Different versions of Cohere accept either
        // `attachments` or `images`; we include attachments which is widely supported.
        attachments: [
          {
            type: 'image',
            data: b64,
            mime_type: mime
          }
        ]
      })
    });

    if (!cohereRes.ok) {
      const errText = await cohereRes.text();
      return NextResponse.json({ error: 'Cohere API error', details: errText }, { status: 502 });
    }

    const data = await cohereRes.json();
    // Cohere chat responses typically include a `text` field or `message`/`content`.
    let raw = (data.text || data.reply || data.response || '').toString().trim().toLowerCase();
    if (!raw && data?.message?.content) {
      raw = String(data.message.content).trim().toLowerCase();
    }

    // Normalize to allowed set
    // Also allow minor variations (e.g., 'red bull' => 'redbull')
    const normalized = raw
      .replace(/\s+/g, ' ') // collapse spaces
      .replace(/red bull/g, 'redbull')
      .replace(/google cloud bottle/g, 'google cloud water bottle')
      .trim();

    const matchLabel = ALLOWED_ITEMS.find((x) => x === normalized);
    if (!matchLabel) {
      return NextResponse.json({ error: 'Unrecognized label', raw }, { status: 422 });
    }

    return NextResponse.json({ item: matchLabel });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected error', details: err?.message || String(err) }, { status: 500 });
  }
}

