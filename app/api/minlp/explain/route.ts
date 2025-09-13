import { NextRequest, NextResponse } from 'next/server';

const MINLP_BASE_URL = process.env.MINLP_BASE_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    const { solution } = body;

    // Call MINLP service for explanation
    const explainResponse = await fetch(`${MINLP_BASE_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solution })
    });

    if (!explainResponse.ok) {
      throw new Error('MINLP explain service failed');
    }

    const explanation = await explainResponse.json();

    return NextResponse.json(explanation);
  } catch (error) {
    console.error('MINLP explain error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
