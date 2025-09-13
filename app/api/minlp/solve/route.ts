import { NextRequest, NextResponse } from 'next/server';
import { createMinlpRun } from 'lib/supabase';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';

const MINLP_BASE_URL = process.env.MINLP_BASE_URL || 'http://localhost:8000';

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, orders } = body;

    // Prepare items from orders for MINLP
    const items = orders.flatMap((order: any) => 
      order.items || [{
        sku: 'SKU001',
        qty: 2,
        price_cents: 2499
      }]
    );

    // Call MINLP service
    const minlpResponse = await fetch(`${MINLP_BASE_URL}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        order_id: orders[0]?.order_id,
        items
      })
    });

    if (!minlpResponse.ok) {
      throw new Error('MINLP service failed');
    }

    const solution = await minlpResponse.json();

    // Save to Supabase
    const minlpRun = await createMinlpRun(
      merchantId,
      orders[0]?.order_id || null,
      { items },
      solution,
      null
    );

    return NextResponse.json({ success: true, solution, runId: minlpRun?.run_id });
  } catch (error) {
    console.error('MINLP solve error:', error);
    return NextResponse.json(
      { error: 'Failed to run optimization' },
      { status: 500 }
    );
  }
});
