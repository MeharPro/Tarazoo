'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

// Allowed catalog labels. Must match exactly for downstream cart lookup.
// Put 'none' first to counter list-order bias in uncertain cases.
const ALLOWED_ITEMS = [
  'none',
  'pen',
  'head cap',
  'redbull',
  'google cloud water bottle',
  'socks'
];

async function tryCohere(params: { b64: string; mime: string; systemPrompt: string }) {
  const { b64, mime, systemPrompt } = params;
  const cohereKey = process.env.COHERE_API_KEY;
  if (!cohereKey) {
    console.warn('[Vision Detect] Cohere API key not configured; skipping fallback');
    return null;
  }
  try {
    const model = process.env.COHERE_MODEL || 'command-r';
    const res = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cohereKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } },
              { type: 'text', text: 'Pick one label from the allowed set and output ONLY that label.' }
            ]
          }
        ],
        max_tokens: 64
      })
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('[Vision Detect] Cohere API error:', t);
      return null;
    }
    const data = await res.json();
    // Attempt to extract text from Cohere response across possible shapes
    let raw = '';
    if (typeof (data as any)?.text === 'string') {
      raw = (data as any).text;
    } else if (typeof (data as any)?.message?.content?.map === 'function') {
      raw = (data as any).message.content
        .map((b: any) => (typeof b?.text === 'string' ? b.text : ''))
        .join(' ');
    } else if (Array.isArray((data as any)?.content)) {
      const textBlock = (data as any).content.find((b: any) => b?.type === 'text' || b?.type === 'output_text');
      raw = (textBlock?.text || '').toString();
    }
    raw = (raw || '').trim().toLowerCase();
    console.log('[Vision Detect] Cohere parsed label:', raw);
    const normalized = raw
      .replace(/\s+/g, ' ')
      .replace(/red bull/g, 'redbull')
      .replace(/google cloud bottle/g, 'google cloud water bottle')
      .trim();
    const matchLabel = ALLOWED_ITEMS.find((x) => x === normalized);
    if (!matchLabel) {
      return null;
    }
    if (matchLabel === 'none') {
      return { item: null, model: `cohere:${model}`, systemPrompt };
    }
    return { item: matchLabel, model: `cohere:${model}`, systemPrompt };
  } catch (err) {
    console.error('[Vision Detect] Cohere fallback unexpected error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    // Accept either a data URL (data:image/jpeg;base64,...) or raw base64
    const match = image.match(/^data:(.*?);base64,(.*)$/);
    const mime = match && match[1] ? match[1] : 'image/jpeg';
    const b64 = match && match[2] ? match[2] : image;
    const dataUrl = match ? image : `data:${mime};base64,${b64}`;

    // System prompt: default to 'none' unless clearly visible and centered.
    const systemPrompt = `You are a retail vision assistant. Given an image, output EXACTLY ONE label from this allowed set and nothing else (lowercase, no punctuation):\n\n- none\n- pen\n- head cap\n- redbull\n- google cloud water bottle\n- socks\n\nRules:\n- Your main goal is to identify if one of the items in the list is present in the image.\n- If you are uncertain, it's better to say 'none'.\n- The item might not be perfectly centered or might be slightly blurry. Use your best judgment.\n- The label 'pen' refers only to a writing instrument.`;

    // Model we are using (configurable via env). Default to the model in docs snippet.
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

    // Read Anthropic key (may be undefined; we handle fallback below)
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Log what we are sending (without exposing the whole image)
    const b64Hash = createHash('sha256').update(b64).digest('hex').slice(0, 16);
    const preview = b64.slice(0, 32);
    console.log('[Vision Detect] Request:', {
      model,
      mime,
      base64_len: b64.length,
      base64_preview: `${preview}...`,
      base64_sha256_16: b64Hash,
      systemPrompt_len: systemPrompt.length,
      allowedItems: ALLOWED_ITEMS
    });

    // If no Anthropic key, try Cohere fallback immediately
    if (!apiKey) {
      const cohereResult = await tryCohere({ b64, mime, systemPrompt });
      if (cohereResult) return NextResponse.json(cohereResult);
      return NextResponse.json({ error: 'Anthropic API key not configured and Cohere fallback not available' }, { status: 500 });
    }

    // Call Anthropic Messages API with image (base64). We avoid the Files API to keep dependencies minimal.
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 64,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mime, data: b64 }
              },
              {
                type: 'text',
                text: 'Pick one label from the allowed set and output ONLY that label.'
              }
            ]
          }
        ]
      })
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[Vision Detect] Anthropic API error:', errText);
      // Fallback to Cohere if available
      const cohereResult = await tryCohere({ b64, mime, systemPrompt });
      if (cohereResult) return NextResponse.json(cohereResult);
      return NextResponse.json({ error: 'Anthropic API error', details: errText }, { status: 502 });
    }

    const data = await anthropicRes.json();
    // Anthropic returns content array with text blocks; take the first text
    const textBlock = Array.isArray(data?.content)
      ? data.content.find((b: any) => b?.type === 'text')
      : null;
    let raw = (textBlock?.text || '').toString().trim().toLowerCase();
    console.log('[Vision Detect] Parsed label:', raw);

    // Normalize to allowed set
    // Also allow minor variations (e.g., 'red bull' => 'redbull')
    const normalized = raw
      .replace(/\s+/g, ' ') // collapse spaces
      .replace(/red bull/g, 'redbull')
      .replace(/google cloud bottle/g, 'google cloud water bottle')
      .trim();

    const matchLabel = ALLOWED_ITEMS.find((x) => x === normalized);
    if (!matchLabel) {
      console.warn('[Vision Detect] Unrecognized label from Anthropic:', { raw, normalized });
      const cohereResult = await tryCohere({ b64, mime, systemPrompt });
      if (cohereResult) return NextResponse.json(cohereResult);
      return NextResponse.json({ error: 'Unrecognized label', raw, model, systemPrompt }, { status: 422 });
    }

    // If the model says 'none', indicate no detection so the client keeps scanning
    if (matchLabel === 'none') {
      return NextResponse.json({ item: null, model, systemPrompt });
    }

    return NextResponse.json({ item: matchLabel, model, systemPrompt });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected error', details: err?.message || String(err) }, { status: 500 });
  }
}

